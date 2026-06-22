//! bount-AI TEE contract — confidential Venice AI inference inside a T3N enclave.
//!
//! Exposes one function, `chat`, on the `contracts` interface. The Venice API
//! key is read from the tenant's private KV map `z:<tid>:secrets` (key
//! `venice_api_key`) *inside the enclave* and used to call Venice via the host
//! `http` capability — the secret never enters untrusted memory or the prompt.
//!
//! Host capabilities required (granted at registration / admit time):
//!   tenant_context, logging, kv_store, http
//!
//! Before first use the tenant SDK must seed the key into the `secrets` map:
//!   z_sdk.kv("secrets").set("venice_api_key", "<VENICE_API_KEY>")
//!
//! Only the model output crosses the WIT boundary back to the caller.
#![cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]

wit_bindgen::generate!({
    world: "bount-ai",
    path: "wit",
    additional_derives: [serde::Deserialize, serde::Serialize],
    generate_all,
});

use exports::z::bount_ai::contracts::{GenericInput, Guest};

const VENICE_URL: &str = "https://api.venice.ai/api/v1/chat/completions";
const DEFAULT_MODEL: &str = "llama-3.3-70b";

#[derive(serde::Deserialize)]
struct ChatReq {
    prompt: String,
    #[serde(default)]
    model: Option<String>,
}

struct Component;

#[cfg(target_arch = "wasm32")]
impl Guest for Component {
    /// Confidential entrypoint. `req.input` is the JSON request bytes minted by
    /// the node from the caller's payload: `{ "prompt": "...", "model"?: "..." }`.
    fn chat(req: GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("chat: missing input")?;
        chat_impl(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);

#[cfg(target_arch = "wasm32")]
use crate::host::{
    interfaces::{http as http_iface, kv_store, logging},
    tenant::tenant_context,
};

#[cfg(target_arch = "wasm32")]
fn chat_impl(input: &[u8]) -> Result<Vec<u8>, String> {
    use serde_json::json;

    let req: ChatReq =
        serde_json::from_slice(input).map_err(|e| format!("chat: bad input: {e}"))?;
    let model = req.model.as_deref().unwrap_or(DEFAULT_MODEL);

    // --- Task 4: read the Venice API key from the tenant's private KV map ---
    let api_key = read_venice_key()?;

    // --- Task 3: confidential HTTP call to Venice from inside the enclave ---
    let body = json!({
        "model": model,
        "messages": [{ "role": "user", "content": req.prompt }],
    });

    let resp = http_iface::call(&http_iface::Request {
        method: http_iface::Verb::Post,
        url: VENICE_URL.to_string(),
        headers: Some(vec![
            ("Authorization".to_string(), format!("Bearer {api_key}")),
            ("Accept".to_string(), "application/json".to_string()),
        ]),
        payload: Some(serde_json::to_vec(&body).map_err(|e| e.to_string())?),
    })
    .map_err(|e| format!("venice request failed: {e}"))?;

    if resp.code != 200 {
        let detail = String::from_utf8_lossy(&resp.payload);
        return Err(format!("venice HTTP {}: {detail}", resp.code));
    }

    // Extract the assistant message; fall back to the raw body if the shape
    // is unexpected so the caller still gets something useful.
    let parsed: serde_json::Value =
        serde_json::from_slice(&resp.payload).map_err(|e| e.to_string())?;
    let content = parsed["choices"][0]["message"]["content"]
        .as_str()
        .map(str::to_string)
        .unwrap_or_else(|| String::from_utf8_lossy(&resp.payload).into_owned());

    let _ = logging::info(&format!("venice chat ok ({} chars)", content.len()));

    let out = json!({ "status": "success", "model": model, "output": content });
    serde_json::to_vec(&out).map_err(|e| e.to_string())
}

/// Resolve `z:<tid>:secrets` from the tenant DID and read `venice_api_key`.
/// Fails closed: never calls Venice without an authenticated key.
#[cfg(target_arch = "wasm32")]
fn read_venice_key() -> Result<String, String> {
    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:secrets", hex::encode(&tid));
    let bytes = kv_store::get(&map_name, b"venice_api_key")
        .map_err(|e| format!("kv read: {e}"))?
        .ok_or("venice_api_key not found in z:<tid>:secrets — seed it via the tenant SDK first")?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

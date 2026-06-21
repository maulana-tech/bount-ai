wit_bindgen::generate!();

use exports::t3n::enclave::contracts::Guest;
// Confidential host capabilities provided by the T3N node (see wit/host.wit).
use t3n::enclave::{http, kv};

pub struct Component;

const VENICE_URL: &str = "https://api.venice.ai/api/v1/chat/completions";
const DEFAULT_MODEL: &str = "llama-3.3-70b";
const DEFAULT_TENANT: &str = "bount-ai";

impl Guest for Component {
    /// Confidential entrypoint. `input` is a JSON object:
    ///   { "prompt": "...", "model"?: "...", "tenant_id"?: "..." }
    ///
    /// The Venice API key is read from the private KV namespace
    /// "z:<tid>:secrets" *inside the enclave* and used to call Venice AI via the
    /// confidential HTTP host — so the secret never leaves the trusted boundary.
    fn execute(input: String) -> Result<String, String> {
        let req: serde_json::Value =
            serde_json::from_str(&input).map_err(|e| format!("invalid input json: {e}"))?;

        let prompt = req
            .get("prompt")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "missing required field: prompt".to_string())?;
        let model = req
            .get("model")
            .and_then(|v| v.as_str())
            .unwrap_or(DEFAULT_MODEL);
        let tenant_id = req
            .get("tenant_id")
            .and_then(|v| v.as_str())
            .unwrap_or(DEFAULT_TENANT);

        // --- Task 4: read the Venice API key from the private KV namespace ---
        let namespace = format!("z:{tenant_id}:secrets");
        let api_key = match kv::get(&namespace, "VENICE_API_KEY") {
            Ok(Some(key)) if !key.is_empty() => key,
            // Fail closed: never call Venice unauthenticated.
            Ok(_) => {
                return Err(format!(
                    "VENICE_API_KEY not found in {namespace}; refusing to proceed"
                ))
            }
            Err(e) => return Err(format!("kv read failed: {e}")),
        };

        // --- Task 3: confidential HTTP call to Venice AI from inside the enclave ---
        let body = serde_json::json!({
            "model": model,
            "messages": [{ "role": "user", "content": prompt }],
        })
        .to_string();

        let headers = vec![
            ("Authorization".to_string(), format!("Bearer {api_key}")),
            ("Content-Type".to_string(), "application/json".to_string()),
        ];

        let response = http::request("POST", VENICE_URL, &headers, Some(body.as_str()))
            .map_err(|e| format!("venice request failed: {e}"))?;

        // Extract the assistant message; fall back to the raw body if the shape
        // is unexpected so the caller still gets something useful.
        let content = serde_json::from_str::<serde_json::Value>(&response)
            .ok()
            .and_then(|v| {
                v["choices"][0]["message"]["content"]
                    .as_str()
                    .map(str::to_string)
            })
            .unwrap_or(response);

        Ok(serde_json::json!({
            "status": "success",
            "model": model,
            "output": content,
        })
        .to_string())
    }
}

export!(Component);

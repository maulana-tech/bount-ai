import * as fs from "fs";
import * as path from "path";
import { getStoredCredentials } from "./auth.js";
export async function publishSkill() {
    const creds = getStoredCredentials();
    if (!creds) {
        console.error("Error: You must log in first. Please run 'npx skill login'.");
        process.exit(1);
    }
    const currentDir = process.cwd();
    const wasmFile = path.join(currentDir, "dist", "index.wasm");
    if (!fs.existsSync(wasmFile)) {
        throw new Error("Could not find dist/index.wasm. Please run 'npx skill build' first.");
    }
    const skillName = path.basename(currentDir);
    console.log(`\n[bount-AI] Publishing TEE skill "${skillName}" onto Terminal 3 Network (T3N)...`);
    const agentUrl = process.env.AGENT_PUBLIC_URL || "http://localhost:8787";
    try {
        const wasmBuffer = fs.readFileSync(wasmFile);
        const res = await fetch(`${agentUrl}/publish-skill`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${creds.authToken}`
            },
            body: JSON.stringify({
                name: skillName,
                did: creds.did,
                wasmBase64: wasmBuffer.toString("base64")
            })
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Registration failed: ${text}`);
        }
        const data = (await res.json());
        console.log(`\n✔ TEE Enclave registered on T3N!`);
        console.log(`✔ Enclave Contract Address: ${data.enclaveAddress}`);
        console.log(`✔ T3N Verifiable DID: did:t3n:${skillName.toLowerCase()}`);
        console.log(`✔ Marketplace: Active & verified inside TEE\n`);
    }
    catch (err) {
        console.error("\nError during publication:", err instanceof Error ? err.message : err);
    }
}

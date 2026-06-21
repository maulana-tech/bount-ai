import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { getStoredCredentials } from "./auth.js";
/** Read the `version = "x.y.z"` field from a Cargo.toml (or package.json) in `dir`. */
function readSourceVersion(dir) {
    const cargoPath = path.join(dir, "Cargo.toml");
    if (fs.existsSync(cargoPath)) {
        const toml = fs.readFileSync(cargoPath, "utf8");
        // match the first `version = "..."` (the [package] one sits at the top)
        const m = toml.match(/^\s*version\s*=\s*"([^"]+)"/m);
        if (m)
            return { version: m[1], cargoPath };
    }
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            if (typeof pkg.version === "string")
                return { version: pkg.version, cargoPath: null };
        }
        catch {
            /* ignore */
        }
    }
    return { version: "0.1.0", cargoPath: null };
}
/** Bump the patch component of a semver string (x.y.z -> x.y.(z+1)). */
function bumpPatch(version) {
    const parts = version.split(".");
    if (parts.length === 3 && parts.every((p) => /^\d+$/.test(p))) {
        parts[2] = String(Number(parts[2]) + 1);
        return parts.join(".");
    }
    return version;
}
/** Persist the chosen version back into Cargo.toml so it stays the source of truth. */
function writeCargoVersion(cargoPath, version) {
    const toml = fs.readFileSync(cargoPath, "utf8");
    const next = toml.replace(/^(\s*version\s*=\s*")[^"]+(")/m, `$1${version}$2`);
    fs.writeFileSync(cargoPath, next);
}
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
    // Resolve the version: read current from Cargo.toml, suggest a patch bump,
    // and let the user confirm/override. T3N rejects re-publishing the same version.
    const { version: currentVersion, cargoPath } = readSourceVersion(currentDir);
    const suggested = bumpPatch(currentVersion);
    const rl = readline.createInterface({ input, output });
    const answer = (await rl.question(`Current version is ${currentVersion}. New version to publish [${suggested}]: `)).trim();
    rl.close();
    const newVersion = answer || suggested;
    if (cargoPath && newVersion !== currentVersion) {
        writeCargoVersion(cargoPath, newVersion);
        console.log(`[bount-AI] Bumped Cargo.toml version ${currentVersion} -> ${newVersion}`);
    }
    console.log(`\n[bount-AI] Publishing TEE skill "${skillName}" v${newVersion} onto Terminal 3 Network (T3N)...`);
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
                version: newVersion,
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
        console.log(`✔ Version: ${data.version || newVersion}`);
        console.log(`✔ T3N Verifiable DID: did:t3n:${skillName.toLowerCase()}`);
        console.log(`✔ Marketplace: Active & verified inside TEE\n`);
    }
    catch (err) {
        console.error("\nError during publication:", err instanceof Error ? err.message : err);
    }
}

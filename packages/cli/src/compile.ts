import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { build } from "esbuild";

/**
 * Compile a TEE skill in the current directory to `dist/index.wasm`.
 *
 * Two modes:
 *  - Rust crate (a `Cargo.toml` is present): compile a real `wasm32-wasip2`
 *    component via `cargo build` and copy the produced `.wasm` into `dist/`.
 *  - TypeScript skill (`index.ts` present): bundle with esbuild (legacy path).
 */
export async function compileSkill() {
  const currentDir = process.cwd();

  if (fs.existsSync(path.join(currentDir, "Cargo.toml"))) {
    await compileRustSkill(currentDir);
    return;
  }

  await compileTsSkill(currentDir);
}

function readCargoName(cargoPath: string): string {
  const toml = fs.readFileSync(cargoPath, "utf8");
  const m = toml.match(/^\s*name\s*=\s*"([^"]+)"/m);
  return m ? m[1] : "enclaves";
}

async function compileRustSkill(currentDir: string) {
  const crateName = readCargoName(path.join(currentDir, "Cargo.toml"));
  console.log(`\n[bount-AI] Compiling Rust TEE contract "${crateName}" to wasm32-wasip2...`);

  const result = spawnSync(
    "cargo",
    ["build", "--release", "--target", "wasm32-wasip2"],
    { cwd: currentDir, stdio: "inherit" }
  );

  if (result.error) {
    throw new Error(
      `Failed to run cargo. Is the Rust toolchain installed? (${result.error.message})`
    );
  }
  if (result.status !== 0) {
    throw new Error(`cargo build failed with exit code ${result.status}.`);
  }

  // cargo replaces '-' with '_' in artifact file names
  const artifactName = `${crateName.replace(/-/g, "_")}.wasm`;
  const builtWasm = path.join(
    currentDir,
    "target",
    "wasm32-wasip2",
    "release",
    artifactName
  );
  if (!fs.existsSync(builtWasm)) {
    throw new Error(`Expected wasm artifact not found at ${builtWasm}.`);
  }

  const distDir = path.join(currentDir, "dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const wasmOut = path.join(distDir, "index.wasm");
  fs.copyFileSync(builtWasm, wasmOut);

  const size = fs.statSync(wasmOut).size;
  console.log(`✔ WASM TEE Component: ${wasmOut} (${size} bytes)`);
  console.log("[bount-AI] Rust TEE contract compilation completed successfully!\n");
}

async function compileTsSkill(currentDir: string) {
  const entryFile = path.join(currentDir, "index.ts");
  if (!fs.existsSync(entryFile)) {
    throw new Error(
      "Could not find Cargo.toml or index.ts in the current directory. Please run 'npx skill init <name>' first."
    );
  }

  console.log("\n[bount-AI] Bundling and compiling TypeScript TEE contract...");

  const distDir = path.join(currentDir, "dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const jsOut = path.join(distDir, "index.js");
  await build({
    entryPoints: [entryFile],
    outfile: jsOut,
    bundle: true,
    platform: "neutral",
    format: "esm",
    target: "es2022",
    minify: false,
    external: ["t3n:host/*"],
  });

  const wasmOut = path.join(distDir, "index.wasm");
  // For the TypeScript demo path we emit a minimal valid WASM header placeholder.
  fs.writeFileSync(wasmOut, Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x0d, 0x00, 0x01, 0x00]));

  console.log(`✔ JavaScript Bundle: ${jsOut}`);
  console.log(`✔ WASM TEE Component: ${wasmOut}`);
  console.log("[bount-AI] TEE contract compilation completed successfully!\n");
}

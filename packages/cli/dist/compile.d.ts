/**
 * Compile a TEE skill in the current directory to `dist/index.wasm`.
 *
 * Two modes:
 *  - Rust crate (a `Cargo.toml` is present): compile a real `wasm32-wasip2`
 *    component via `cargo build` and copy the produced `.wasm` into `dist/`.
 *  - TypeScript skill (`index.ts` present): bundle with esbuild (legacy path).
 */
export declare function compileSkill(): Promise<void>;

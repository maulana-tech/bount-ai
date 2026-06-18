#!/usr/bin/env node

import { Command } from "commander";
import { login } from "./auth.js";
import { runSkill } from "./run.js";
import { compileSkill } from "./compile.js";
import { publishSkill } from "./publish.js";
import * as fs from "fs";
import * as path from "path";

const program = new Command();

program
  .name("skill")
  .description("bount-AI TEE Skill Management and Execution CLI")
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate local terminal with bount-AI (MetaMask)")
  .action(async () => {
    try {
      await login();
    } catch (err) {
      console.error("Login failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("run <skillId> [prompt]")
  .description("Run a purchased TEE skill with a prompt")
  .action(async (skillId, prompt) => {
    try {
      await runSkill(skillId, prompt || "");
    } catch (err) {
      console.error("Execution failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("init <name>")
  .description("Initialize a new TypeScript TEE skill template")
  .action(async (name) => {
    try {
      const destDir = path.resolve(process.cwd(), name);
      if (fs.existsSync(destDir)) {
        throw new Error(`Directory "${name}" already exists.`);
      }
      fs.mkdirSync(destDir, { recursive: true });
      
      const mainTsContent = `// TEE Skill: ${name}
import { getSecret } from "t3n:host/kv";
import { callHttp } from "t3n:host/http";

export function execute(input: string): string {
  // 1. Dapatkan kunci API secara aman dari KV store T3N
  const apiKey = getSecret("z:bount-ai:secrets", "VENICE_API_KEY");

  // 2. Lakukan panggilan konfidensial ke LLM (Venice AI)
  // Catatan: Gunakan placeholder jika memproses PII sensitif
  return JSON.stringify({
    status: "success",
    message: "Executed ${name} successfully inside TEE Node",
    input
  });
}
`;
      fs.writeFileSync(path.join(destDir, "index.ts"), mainTsContent);
      console.log(`Initialized TEE skill template in "${name}/index.ts"`);
    } catch (err) {
      console.error("Initialization failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("build")
  .description("Compile TypeScript TEE skill to WASM component")
  .action(async () => {
    try {
      await compileSkill();
    } catch (err) {
      console.error("Build failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("publish")
  .description("Register/Publish compiled skill component to Terminal 3 Network")
  .action(async () => {
    try {
      await publishSkill();
    } catch (err) {
      console.error("Publish failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse(process.argv);

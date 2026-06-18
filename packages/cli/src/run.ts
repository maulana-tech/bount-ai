import { getStoredCredentials } from "./auth.js";

export async function runSkill(skillId: string, prompt: string) {
  const creds = getStoredCredentials();
  if (!creds) {
    console.error("Error: You must log in first. Please run 'npx skill login'.");
    process.exit(1);
  }

  console.log(`\n[bount-AI] Invoking skill "${skillId}" securely inside TEE Node...`);
  console.log(`[Prompt]: "${prompt}"`);

  const agentUrl = process.env.AGENT_PUBLIC_URL || "http://localhost:8787";
  
  try {
    const res = await fetch(`${agentUrl}/spike`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${creds.authToken}`
      },
      body: JSON.stringify({
        request: `Run skill ${skillId} with instructions: ${prompt}`,
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Agent returned status ${res.status}: ${text}`);
    }

    const result = (await res.json()) as any;
    
    console.log("\n[bount-AI] Execution successfully completed!\n");
    
    if (result.outputs && result.outputs.length > 0) {
      for (const output of result.outputs) {
        console.log(`=== [Agent: ${output.agent.toUpperCase()}] Result ===`);
        console.log(output.content);
        console.log("=========================================\n");
      }
    } else {
      console.log("No outputs returned from enclaves.");
    }

    if (result.budget) {
      console.log(`[Budget Ledger] Spent: $${result.budget.spent.toFixed(2)} | Cap: $${result.budget.cap.toFixed(2)}`);
    }

    if (result.proofs && result.proofs.length > 0) {
      console.log("\n[T3N Ledger & TEE Proofs]:");
      for (const proof of result.proofs) {
        console.log(`  ✔ [Handshake] ${proof.from} -> ${proof.to}`);
        console.log(`    Hash: ${proof.hash}`);
        console.log(`    Scope Cap: $${proof.capUsd.toFixed(2)}`);
      }
    }
  } catch (err) {
    console.error("\nError during skill execution:", err instanceof Error ? err.message : err);
  }
}

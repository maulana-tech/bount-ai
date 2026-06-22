import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";

function openBrowser(url: string) {
  const start = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${start} "${url}"`);
}

export interface Credentials {
  did: string;
  authToken: string;
}

export function getConfigFile(): string {
  const home = os.homedir();
  return path.join(home, ".config", "bount-ai", "config.json");
}

export function getStoredCredentials(): Credentials | null {
  const file = getConfigFile();
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function login(): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    const port = 12345;
    const server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === "POST" && req.url === "/callback") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (!data.did || !data.authToken) {
              throw new Error("Invalid callback payload: did and authToken are required");
            }

            const configPath = getConfigFile();
            fs.mkdirSync(path.dirname(configPath), { recursive: true });
            fs.writeFileSync(configPath, JSON.stringify({
              did: data.did,
              authToken: data.authToken
            }, null, 2), { mode: 0o600 });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok" }));
            
            console.log(`\nSuccess: Logged in as ${data.did}`);
            console.log(`Credentials saved in: ${configPath}\n`);
            
            server.close();
            resolve(data);
          } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Invalid payload" }));
            server.close();
            reject(err);
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      const webUrl = process.env.BOUNT_AI_WEB_URL || "https://bount-ai-app.vercel.app";
      const authUrl = `${webUrl}/app/cli-auth?port=${port}`;
      console.log(`\n[bount-AI] Authenticating via: ${webUrl}`);
      console.log(`(To use a local development server, run: BOUNT_AI_WEB_URL=http://localhost:3000 skill login)\n`);
      console.log(`Opening browser to authenticate...`);
      console.log(`If browser does not open, go to: ${authUrl}\n`);
      openBrowser(authUrl);
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}

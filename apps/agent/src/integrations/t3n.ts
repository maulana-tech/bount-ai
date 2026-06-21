import {
  T3nClient,
  TenantClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  getNodeUrl,
} from "@terminal3/t3n-sdk";
import { config } from "../config.js";

const userClientsCache = new Map<string, { t3n: T3nClient; tenant: TenantClient; tenantDid: string }>();
const userInitPromises = new Map<string, Promise<{ t3n: T3nClient; tenant: TenantClient; tenantDid: string } | null>>();

export async function getT3nClients(userApiKey?: string): Promise<{ t3n: T3nClient; tenant: TenantClient; tenantDid: string } | null> {
  const apiKey = userApiKey || process.env.T3N_API_KEY || config.t3n?.apiKey;
  if (!apiKey) {
    return null;
  }

  if (userClientsCache.has(apiKey)) {
    return userClientsCache.get(apiKey)!;
  }

  if (userInitPromises.has(apiKey)) {
    return userInitPromises.get(apiKey)!;
  }

  const promise = (async () => {
    try {
      const envName = (process.env.T3N_ENVIRONMENT || config.t3n?.environment || "testnet") as "testnet" | "production";
      setEnvironment(envName);

      const address = eth_get_address(apiKey);
      console.log(`[T3N SDK] Initializing client for Eth address: ${address} on ${envName}`);

      const wasmComponent = await loadWasmComponent();
      const t3n = new T3nClient({
        wasmComponent,
        handlers: {
          EthSign: metamask_sign(address, undefined, apiKey),
        },
      });

      console.log("[T3N SDK] Connecting and performing handshake with T3N node...");
      await t3n.handshake();

      console.log("[T3N SDK] Authenticating session...");
      const did = await t3n.authenticate(createEthAuthInput(address));
      const tenantDid = did.value;

      console.log(`[T3N SDK] Authentication successful. Tenant DID: ${tenantDid}`);
      const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid });

      const clients = { t3n, tenant, tenantDid };
      userClientsCache.set(apiKey, clients);
      return clients;
    } catch (error) {
      console.error("[T3N SDK] Failed to initialize T3n client:", error);
      return null;
    } finally {
      userInitPromises.delete(apiKey);
    }
  })();

  userInitPromises.set(apiKey, promise);
  return promise;
}

export async function registerT3nContract(name: string, wasmBuffer: Buffer, version = "0.1.0", userApiKey?: string): Promise<{ contractId: string } | null> {
  const clients = await getT3nClients(userApiKey);
  if (!clients) {
    console.log("[T3N SDK] T3N client not initialized. Skipping real registration.");
    return null;
  }

  try {
    const tailName = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
    console.log(`[T3N SDK] Registering contract tail "${tailName}" v${version} on T3N...`);
    const result = (await clients.tenant.contracts.register({
      tail: tailName,
      version,
      wasm: wasmBuffer,
    })) as any;

    console.log(`[T3N SDK] Real registration success. Contract ID: ${result?.contract_id}`);
    return { contractId: result?.contract_id || "" };
  } catch (err) {
    console.error(`[T3N SDK] Real T3N registration failed:`, err);
    throw err;
  }
}

export async function executeT3nContract(name: string, input: string, userApiKey?: string, version = "0.1.0"): Promise<any | null> {
  const clients = await getT3nClients(userApiKey);
  if (!clients) {
    return null;
  }

  try {
    const tailName = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
    console.log(`[T3N SDK] Executing contract tail "${tailName}" v${version} on T3N TEE...`);
    const executeResult = await clients.tenant.contracts.execute(tailName, {
      version,
      functionName: "execute",
      input: input,
    });
    console.log(`[T3N SDK] Real T3N execution success:`, executeResult);
    return executeResult;
  } catch (err) {
    console.error(`[T3N SDK] Real T3N execution failed:`, err);
    throw err;
  }
}

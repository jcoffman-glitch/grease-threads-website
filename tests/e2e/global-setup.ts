import type { FullConfig } from "@playwright/test";

/**
 * Minimal global setup — verify the server is reachable before running tests.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL || "http://localhost:3000";

  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(baseURL);
      if (res.ok || res.status === 302 || res.status === 307) {
        console.log(`[global-setup] Server reachable at ${baseURL}`);
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error(
    `[global-setup] Server at ${baseURL} not reachable after ${maxRetries} retries`
  );
}

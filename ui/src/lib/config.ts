// src/lib/config.ts
// Public environment configuration and safety auditing

export const MEDPROOF_CONFIG = {
  network: process.env.NEXT_PUBLIC_NETWORK || process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || process.env.VITE_NETWORK || 'preprod',
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_MEDPROOF_CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS || '94499a3a15d5818967c5d8acc562daa1656ca07eb873cdfd4eca50d681def626',
  indexerUrl: process.env.NEXT_PUBLIC_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWsUrl: process.env.NEXT_PUBLIC_INDEXER_WS_URL || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  proofServerUrl: process.env.NEXT_PUBLIC_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
  nodeRpcUrl: process.env.NEXT_PUBLIC_NODE_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.preprod.midnight.network',
};

// Security check: Ensure no private credentials or secrets are leaked into client bundle
export function verifyEnvironmentSafety(): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  const envKeys = Object.keys(process.env);
  for (const key of envKeys) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      const lower = key.toLowerCase();
      if (lower.includes('secret') || lower.includes('seed') || lower.includes('private') || lower.includes('key')) {
        issues.push(`Dangerous public environment variable detected: ${key}`);
      }
    }
  }
  return { safe: issues.length === 0, issues };
}

import { NextResponse } from 'next/server';
import { MEDPROOF_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  let proofServerOnline = false;
  let indexerOnline = false;

  // Ping proof server from Node backend with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(`${MEDPROOF_CONFIG.proofServerUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
    if (resp && resp.ok) {
      proofServerOnline = true;
    }
  } catch {
    proofServerOnline = false;
  }

  // Ping Midnight Preprod indexer from Node backend with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(MEDPROOF_CONFIG.indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ __typename }',
      }),
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
    if (resp && resp.ok) {
      indexerOnline = true;
    }
  } catch {
    indexerOnline = false;
  }

  return NextResponse.json({
    proofServerOnline,
    indexerOnline,
    network: MEDPROOF_CONFIG.network,
    contractAddress: MEDPROOF_CONFIG.contractAddress,
    timestamp: new Date().toISOString(),
  });
}

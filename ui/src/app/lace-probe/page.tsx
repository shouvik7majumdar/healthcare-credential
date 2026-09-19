'use client';

import React, { useState, useRef } from 'react';

export default function LaceProbePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [providerInfo, setProviderInfo] = useState<{ name: string; apiVersion: string; id: string } | null>(null);
  const [addresses, setAddresses] = useState<{ unshielded?: string; shielded?: string }>({});
  const [connectedApiInstance, setConnectedApiInstance] = useState<any>(null);
  const isConnectingRef = useRef(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, '[' + time + '] ' + msg]);
  };

  const queryAddresses = async (api: any) => {
    addLog('Querying wallet addresses from ConnectedAPI...');
    try {
      let unshielded = '';
      let shielded = '';

      if (typeof api.getUnshieldedAddress === 'function') {
        try {
          const res = await api.getUnshieldedAddress();
          unshielded = typeof res === 'string' ? res : JSON.stringify(res);
          addLog('getUnshieldedAddress(): ' + unshielded);
        } catch (err: any) {
          addLog('getUnshieldedAddress() returned: ' + (err?.message || String(err)));
          // If locked, retry once after 500ms
          if (String(err?.message || err).toLowerCase().includes('locked')) {
            addLog('Retrying address query in 500ms after unlock...');
            await new Promise((r) => setTimeout(r, 500));
            try {
              const res2 = await api.getUnshieldedAddress();
              unshielded = typeof res2 === 'string' ? res2 : JSON.stringify(res2);
              addLog('getUnshieldedAddress() (retry): ' + unshielded);
            } catch (err2: any) {
              addLog('Retry error: ' + (err2?.message || String(err2)));
            }
          }
        }
      }

      if (typeof api.getShieldedAddresses === 'function') {
        try {
          const res = await api.getShieldedAddresses();
          shielded = typeof res === 'string' ? res : JSON.stringify(res);
          addLog('getShieldedAddresses(): ' + shielded);
        } catch (err: any) {
          addLog('getShieldedAddresses() error: ' + (err?.message || String(err)));
        }
      }

      if (unshielded || shielded) {
        setAddresses({ unshielded, shielded });
        setStatus('CONNECTED');
        addLog('✅ SUCCESS: Wallet fully connected and address loaded!');
      }
    } catch (queryErr: any) {
      addLog('Address query error: ' + (queryErr?.message || String(queryErr)));
    }
  };

  const handleConnectClick = () => {
    if (typeof window === 'undefined') return;
    if (isConnectingRef.current) {
      addLog('Connection already in flight. Please wait.');
      return;
    }

    const win = window as any;
    if (!win.midnight) {
      addLog('ERROR: window.midnight is not defined! Ensure Midnight Lace extension is installed.');
      setStatus('ERROR');
      return;
    }

    const midnightObj = win.midnight;
    const providers = Object.entries(midnightObj).map(([key, val]: [string, any]) => ({
      key,
      val,
      name: val?.name || key,
      apiVersion: val?.apiVersion || 'unknown',
    }));

    addLog('Found ' + providers.length + ' provider(s) in window.midnight: ' + providers.map((p) => p.key).join(', '));

    const laceEntry =
      providers.find((p) => p.key === 'mnLace') ||
      providers.find((p) => p.name?.toLowerCase().includes('lace') || p.key.toLowerCase().includes('lace')) ||
      providers[0];

    if (!laceEntry || !laceEntry.val) {
      addLog('ERROR: No valid Lace InitialAPI found.');
      setStatus('ERROR');
      return;
    }

    const laceProvider = laceEntry.val;
    const info = {
      name: laceProvider.name || laceEntry.name,
      apiVersion: laceProvider.apiVersion || 'unknown',
      id: laceEntry.key,
    };
    setProviderInfo(info);
    addLog('Selected Provider: ' + info.name + ' (API ' + info.apiVersion + ', ID: ' + info.id + ')');

    if (typeof laceProvider.connect !== 'function') {
      addLog('ERROR: Selected provider does not implement connect().');
      setStatus('ERROR');
      return;
    }

    isConnectingRef.current = true;
    setStatus('CONNECTING');
    addLog("Calling laceProvider.connect('preprod') directly in user click stack...");

    const startTime = Date.now();

    laceProvider
      .connect('preprod')
      .then(async (connectedApi: any) => {
        const elapsed = Date.now() - startTime;
        addLog("SUCCESS: connect('preprod') resolved in " + elapsed + 'ms!');
        setConnectedApiInstance(connectedApi);

        if (!connectedApi) {
          addLog('WARNING: connect() resolved with empty/null ConnectedAPI.');
          return;
        }

        await queryAddresses(connectedApi);
      })
      .catch((err: any) => {
        const elapsed = Date.now() - startTime;
        addLog("ERROR: connect('preprod') rejected after " + elapsed + 'ms: ' + (err?.message || String(err)));
        setStatus('ERROR');
      })
      .finally(() => {
        isConnectingRef.current = false;
      });
  };

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '40px auto',
        padding: '24px',
        fontFamily: 'monospace',
        color: '#e2e8f0',
        background: '#0a0f1d',
        borderRadius: '12px',
        border: '1px solid #1e293b',
      }}
    >
      <h2 style={{ color: '#38bdf8', marginBottom: '8px' }}>⚡ MedProof Minimal Lace Connector Probe</h2>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
        Isolated, pure single-click connector diagnostic testing direct <code>laceProvider.connect(&apos;preprod&apos;)</code>.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={handleConnectClick}
          disabled={status === 'CONNECTING'}
          style={{
            background: status === 'CONNECTING' ? '#0369a1' : '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 700,
            borderRadius: '8px',
            cursor: status === 'CONNECTING' ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)',
          }}
        >
          {status === 'CONNECTING' ? '⏳ Connecting to Lace...' : 'Connect Midnight Lace'}
        </button>

        {connectedApiInstance && !addresses.unshielded && (
          <button
            onClick={() => queryAddresses(connectedApiInstance)}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            🔄 Fetch Address Now (Wallet Unlocked)
          </button>
        )}
      </div>

      {providerInfo && (
        <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #334155' }}>
          <div><strong>Provider:</strong> {providerInfo.name}</div>
          <div><strong>API Version:</strong> {providerInfo.apiVersion}</div>
          <div><strong>Provider ID:</strong> {providerInfo.id}</div>
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ color: status === 'CONNECTED' ? '#4ade80' : status === 'ERROR' ? '#f87171' : '#38bdf8' }}>
              {status}
            </span>
          </div>
        </div>
      )}

      {addresses.unshielded && (
        <div style={{ background: '#064e3b', padding: '14px', borderRadius: '8px', marginBottom: '16px', color: '#a7f3d0' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>🎉 Genuine Midnight Wallet Connected:</div>
          <div style={{ wordBreak: 'break-all', fontSize: '13px' }}><strong>Unshielded:</strong> {addresses.unshielded}</div>
          {addresses.shielded && (
            <div style={{ wordBreak: 'break-all', fontSize: '13px', marginTop: '4px' }}>
              <strong>Shielded:</strong> {addresses.shielded}
            </div>
          )}
        </div>
      )}

      <div style={{ background: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Diagnostic Execution Log:</div>
        {logs.length === 0 ? (
          <div style={{ color: '#475569' }}>Click &quot;Connect Midnight Lace&quot; above to begin diagnostic probe...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={{ fontSize: '12px', lineHeight: 1.5 }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

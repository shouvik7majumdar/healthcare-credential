import WebSocket from 'ws';

const ws = new WebSocket('wss://indexer.preprod.midnight.network/api/v4/graphql/ws');
ws.on('open', () => {
  console.log('WS connected successfully to indexerWS!');
  ws.close();
});
ws.on('error', (e) => {
  console.error('WS indexer error:', e.message);
});

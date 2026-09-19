import urllib.request
import json
import time

req = urllib.request.Request(
    'https://indexer.preprod.midnight.network/api/v4/graphql',
    data=json.dumps({'query': 'query { block { height timestamp } }'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
data = json.loads(res.read().decode())
block_ts = data['data']['block']['timestamp']
sys_ts = int(time.time() * 1000)
diff_ms = sys_ts - block_ts

print('Block height:', data['data']['block']['height'])
print('Block timestamp ms:', block_ts)
print('System timestamp ms:', sys_ts)
print('Diff (sys - block) ms:', diff_ms)
print('Diff (sys - block) seconds:', diff_ms / 1000.0)

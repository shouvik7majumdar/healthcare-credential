import json

with open('/home/user/midnight-projects/confidential-prescription-verification/.midnight-wallet-state/preprod/dust.json') as f:
    d = json.load(f)

s = d['state']
if isinstance(s, dict):
    print('State keys:', list(s.keys()))
    for k in s:
        if k in ['progress', 'blockData', 'tip', 'parameters', 'latestBlock']:
            print(k, ':', s[k])
elif isinstance(s, str):
    print('State string prefix:', s[:200])

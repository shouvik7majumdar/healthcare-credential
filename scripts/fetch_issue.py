import urllib.request
import json

req = urllib.request.Request(
    'https://api.github.com/repos/midnightntwrk/midnight-node/issues/2070',
    headers={'User-Agent': 'Mozilla/5.0'}
)
try:
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        print('Title:', data.get('title'))
        print('Body:\n', data.get('body', '')[:3000])
except Exception as e:
    print('Error:', e)

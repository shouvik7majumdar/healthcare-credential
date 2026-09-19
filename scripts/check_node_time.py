import urllib.request
import json
import time

def rpc(method, params=[]):
    req = urllib.request.Request(
        'https://rpc.preprod.midnight.network',
        data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())['result']

header = rpc('chain_getHeader')
block_num = int(header['number'], 16)
print('Latest Block Number from Node:', block_num)

sys_time = int(time.time() * 1000)
print('System time ms:', sys_time)

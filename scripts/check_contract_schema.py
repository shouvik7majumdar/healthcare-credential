import urllib.request
import json

def query_indexer(q):
    req = urllib.request.Request(
        'https://indexer.preprod.midnight.network/api/v4/graphql',
        data=json.dumps({'query': q}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

field_query = '''
query {
  __type(name: " Query)

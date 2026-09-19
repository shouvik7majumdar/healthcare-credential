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

schema_query = '''
query {
  __schema {
    queryType {
      fields {
        name
      }
    }
  }
}
'''
print('Query fields:', [f['name'] for f in query_indexer(schema_query)['data']['__schema']['queryType']['fields']])

import json

with open(".midnight-wallet-state/preprod/unshielded.json") as f:
    d = json.load(f)
    print("unshielded version:", d.get("version"))
    state = d.get("state")
    # print keys of state
    if isinstance(state, dict):
        print("state keys:", list(state.keys()))
        for k in state:
            if k != "wallet":
                print(f"  {k}:", str(state[k])[:100])

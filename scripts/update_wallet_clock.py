path = '/home/user/midnight-projects/confidential-prescription-verification/src/wallet.ts'
with open(path, 'r') as f:
    code = f.read()

# 1. Update interface
code = code.replace(
    '  cwd?: string;\n}',
    '  cwd?: string;\n  clock?: (config: any) => { now: () => Date };\n}'
)

# 2. Update WalletFacade.init call
code = code.replace(
    '  const wallet = await WalletFacade.init({\n    configuration: walletConfig,\n    shielded:',
    '  const wallet = await WalletFacade.init({\n    configuration: walletConfig,\n    clock: opts.clock ?? (() => ({ now: () => new Date(Date.now() - 60_000) })),\n    shielded:'
)

with open(path, 'w') as f:
    f.write(code)
print('Updated src/wallet.ts successfully')

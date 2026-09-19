path = '/home/user/midnight-projects/confidential-prescription-verification/ui/src/services/lace-wallet-service.ts'
with open(path, 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '// Try candidate networks starting with effectivePreferred' in line:
        start_idx = i
    if start_idx != -1 and 'errMsg.toLowerCase().includes(\'reject\')' in line:
        end_idx = i
        break

print(f'start: {start_idx}, end: {end_idx}')
if start_idx != -1 and end_idx != -1:
    replacement = [
        '    try {\n',
        '      if (selected.supportsConnect) {\n',
        '        walletApi = await Promise.race([provider.connect(activeNetworkId), timeoutPromise]);\n',
        '      } else if (selected.supportsEnable) {\n',
        '        walletApi = await Promise.race([provider.enable(), timeoutPromise]);\n',
        '      } else {\n',
        '        throw new Error(\'Provider does not expose connect() or enable() method.\');\n',
        '      }\n',
        '    } catch (err: any) {\n',
        '      if (err instanceof WalletAuthorizationRejectedError) {\n',
        '        if (process.env.NODE_ENV !== \'production\') {\n',
        '          console.log(\'[MEDPROOF-LACE] CONNECT_CALL_REJECTED\', { elapsedMs: Date.now() - startTime });\n',
        '        }\n',
        '        throw err;\n',
        '      }\n',
        '      '
    ]
    lines = lines[:start_idx] + replacement + lines[end_idx:]
    with open(path, 'w') as f:
        f.writelines(lines)
    print('UPDATED SUCCESSFULLY')

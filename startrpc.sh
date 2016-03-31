echo -n Password: 
read -s password
echo -n 'WalletFile? e.g.  /azurewallet\n'
read -s walletfile
/tmp/simplewallet --wallet-file $walletfile --password $password --rpc-bind-port 18082

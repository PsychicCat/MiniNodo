echo -n Password: 
read -s password
echo -n 'WalletFile? ~/wallet/testwallet1'
read -s walletfile
./simplewallet --wallet-file $walletfile --password $password --rpc-bind-port 18082

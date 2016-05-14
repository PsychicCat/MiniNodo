echo "press ctrl + a +d when it says ready for simple wallet. Repeat when simplewallet loads"
screen -S Bitmonerod -m ./bitmonerod

screen -S Simplewallet -m ./simplewallet --wallet-file ~/wallet/testwallet1 --password yourpassword --rpc-bind-port 18082

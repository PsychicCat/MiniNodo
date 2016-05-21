# MiniNodo / MiniNero Web
This node.js server runs on the same machine as your monero installation and provides encrypted and authenticated communication via NACL between the MiniNeroUniversal Windows 10 phone / tablet / PC apps, your Monero installation, and xmr.to. 

Additionally, I've included MiniNero Web which allows for management of MiniNodo, and is a simple standalone wallet gui (This can accomplish basic gui tasks such as send, receive, and view transactions, but is not intended to replace an official GUI). 
Demo Video: https://www.youtube.com/embed/jR8o9uNb_jc
![Screenshot](http://i.imgur.com/MmYzTlM.png)

#Installation (Ubuntu 14 / Windows msys2)
0. A pre-requisite is that your monero installation should be running in rpc mode: ./simplewallet --wallet-file ~/wallet.bin --password <wallet_password> --rpc-bind-port 18082)   (it is helpful to use the program "screen" at this point: https://www.rackaid.com/blog/linux-screen-tutorial-and-how-to/). You can likely add daemon mode too, if you don't want to actually download the blockchain.

1. You should first make sure that you have a recent (5.8 should work) node.js installation on the PC running Monero. For example if that is a Windows pc you can go here: https://nodejs.org/en/ and on Linux, you can use the instructions here: https://nodejs.org/en/download/package-manager/

2. Next clone the repository, or download it as a zip file and extract it to a folder. 

3. In the top MiniNodo directory, use "npm install" to install all the dependency packages listed in package.json

4. To start your server, you can use the command: "node MiniNodo.js"  

#Installation (Ubuntu 16 fresh install)
0. Same as above. (Actually the app will work without this, but will be slightly less useful)
1. sudo apt-get install npm
2. git clone https://www.github.com/ShenNoether/MiniNodo 
3. cd MiniNodo
4. npm install 
5. nodejs MiniNodo.js 
6. open web browser to the printed address / port. Occasionally, if you are behind a vpn or internal network, you will need to use your external ip, which can be found through ifconfig / ipconfig


#Notes
1. My next aim is to improve user-friendliness of this code / repo. 
2. Use at your own risk. 

#Optional Command Line Flags:
-h should print the help
-p <password>
-mp <port for mininero web>
-swp <simplewallet port>
-w    opens your browser to the app



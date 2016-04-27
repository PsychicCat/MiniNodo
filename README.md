# MiniNodo / MiniNero Web
This node.js server runs on the same machine as your monero installation and provides encrypted and authenticated communication via NACL between the MiniNeroUniversal Windows 10 phone / tablet / PC apps, your Monero installation, and xmr.to. 

Additionally, I've included MiniNero Web which allows for management of MiniNodo, and is a simple standalone wallet gui (This can accomplish basic gui tasks such as send, receive, and view transactions, but is not intended to replace an official GUI). 
Screenshots: http://imgur.com/a/Hifdb
![Screenshot](http://i.imgur.com/uf08KTw.png)

#Installation
0. A pre-requisite is that your monero installation should be running in rpc mode: ./simplewallet --wallet-file ~/wallet.bin --password <wallet_password> --rpc-bind-port 18082)   (it is helpful to use the program "screen" at this point: https://www.rackaid.com/blog/linux-screen-tutorial-and-how-to/)

1. You should first make sure that you have a recent (5.8 should work) node.js installation on the PC running Monero. For example if that is a Windows pc you can go here: https://nodejs.org/en/ and on Linux, you can use the instructions here: https://nodejs.org/en/download/package-manager/

2. Next clone the repository, or download it as a zip file and extract it to a folder. 

3. In the top MiniNodo directory, use "npm install" to install all the dependency packages listed in package.json

4. To start your server, you can use the command: node MiniNodo.js 0.0.0.0  

5. The first time you run the server, it will print out two long hex strings: MiniNeroSK and MiniNeroPk. Save the one it tells you to save to a password manager (I use enpass, but keepass, lastpass also suffice). 

6. Now you can connect to Monero using MiniNero.app on your Windows 10 phone or PC (see https://github.com/ShenNoether/MiniNeroUniversal and hopefully it will be in the Windows Store as well relatively soon ) -- Android and iOs versions will likely be available in the future as well. 

7. Finally, and Importantly: the file routes/routes.js file has a variable called "dummy" defined near the top of the file. If you want to test out MiniNodo without connecting to your Monero installation, then the file should read:

dummy = true;  

Otherwise, for actual usage with Monero (use at your own risk!) you can change this to 

dummy = false; 

#Notes
1. My next aim is to improve user-friendliness of this code / repo. 
2. Use at your own risk. 



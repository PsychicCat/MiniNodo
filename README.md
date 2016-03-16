# MiniNodo
This node.js server runs on the same machine as your monero installation and provides encrypted and authenticated communication via NACL between the MiniNeroUniversal Windows 10 phone / tablet / PC apps and your Monero installation. 

#Installation
1. You should first make sure that you have a recent (5.8 should work) node.js installation on the PC running Monero. For example if that is a Windows pc you can go here: https://nodejs.org/en/ and on Linux, you can use the instructions here: https://nodejs.org/en/download/package-manager/

2. Next clone the repository, or download it as a zip file and extract it to a folder. 

3. In the top MiniNodo directory, use "npm install" to install all the dependency packages listed in package.json

4. To start your server, you can use the command: node MiniNodo.js 0.0.0.0 

5. The first time you run the server, it will print out two long hex strings: MiniNeroSK and MiniNeroPk. Save the one it tells you to save to a password manager (I use enpass, but keepass, lastpass also suffice). 

6. Now you can connect to Monero using MiniNero.app on your Windows 10 phone or PC (see https://github.com/ShenNoether/MiniNeroUniversal and hopefully it will be in the Windows Store as well relatively soon ) -- Android and iOs versions will likely be available in the future as well. 


# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Use NPM to initialize your project and create package.json to store project dependencies.
```
npm init
```
- Install crypto-js with --save flag to save dependency to our package.json file
```
npm install crypto-js --save
```
- Install level with --save flag
```
npm install level --save
```
#### Web Server

<b>This type of web server should only be used and accessed locally (127.0.0.1||localhost).</b> 

- Install fs 
```
npm install fs
```
- Install express
```
npm install express
```
- Install bodyParser 
```
npm install body-parser
```


## Files/Folders
```
project2-----|
             |----levelSandbox.js
             |
             |----simpleChain.js
             |
             |----app.js
             |
             |----privateblockchainUI.html
             |
             |----chaindata 
                      |
                      |---files to store the blockchain (NOT ADVISED TO CHANGE INSIDE CHAINDATA)
             |
             |----README.md

```          

#### levelSandbox.js

Contains leveldb class, this allows blocks on the chain to be persistent. The functions within the class are asynchronous meaning multiple operations can occur at once. Asynchronous operations are done through <a href = "https://developers.google.com/web/fundamentals/primers/promises">Promises </a> witch have to be dealt with appropriately.

#### simpleChain.js

Consist of two classes, Block class and Blockchain class. Together creates a functional private blockchain. With the help of levelSandbox the block chain can be saved and reused.

Block class consist of only a constructor that describes the block object (hash,height,body,time,previousBlockHash).

BlockChain class contains asynchronous functions that handle the creation of the chain and the management of blocks on the chain. The reason for Blockchain functions to return Promise it allows the data from leveldb to be used without having unknown variables.
 
<u>NOTE</u>
I find this file to be good for building appilcations as shown in app.js

#### app.js

Contains the same code in simpleChain but, added a function web server that will accept get and post request from the client browser to manage and view the blockchain. Each get and post request calls out corresponding blockChain function with variables passed from the client. It utilizes the await operator to receive the Promise that will be sent back to the client.

#### privateblockchainUI.html

Privateblock chain UI
Basic html code and dynamic javascript to better visualize and manage the private block chain. 

#### chaindata

Blockchain data is stored. If a block is changed or a new chain is needed, chaindata folder can be deleted.


#### README.md

Your reading it!

### Code Flow
```
Blockchain class                      leveldb class
    |                                    |
    |--addBlock()                        |-- addLevelDBData()
    |                                    |
    |--validateBlock()                   |-- changeDBDate()
    |                                    |
    |--validateChain()                   |-- getLevelDBData()
    |                                    |
    |--getHeight()                       |-- addDataToLevelDB()
    |                                    |
    |--getBlock()                        |-- getBlockCount()
                                         |
                                         |-- getChain()
```


#### Creating blocks/Genesis block and saving to leveldb 

 
A check is done in the constructor of the BlockChain class that Promises to get the height of the saved chain. Using a leveldb function called getBlockCount() line[82 - 95] if nothing is returned a genesis block is created. Else we use the height to create a new block with the height of the last block created.


Using BlockCreator function to create new blocks line[292 - 310]. A timing and interval function that creates a defined amount of new block, that is passed to addBlock within in BlockChain class. addBlocks will then set block height, time, previousBlockhash and then a hash of the block itself. This is then passed to addDataToLevelDB within leveldb class to be saved. 

```
BlockCreator()
      |
      |--addBlock()
            |
            |-- addDataToLevelDB()
      
```

#### Validate Block / Validate Chain

Validating a block is done in validateBlock in the BlockChain class.
First requesting a block by its height with getLevelDBData. The next step is to rehash the block to compare the hash in the block. If the hashes are not equal then the block has been change therefore invalid.


```
validateBlock()
      |
      |--getLevelDBData()
```

Validating the chain starts by requesting the height of the chain getBlockCount in leveldb. Then looping the the range of the blocks with getLevelDBData and comparing two things. First the last blocks hash with the current blocks previous hash and like validating a single block, rehashing the block. Only if both are true the chain is valid.

```
validateChain()
      |
      |--getBlocksCount()
     then
      |
      |--getLevelDBData() 
```

#### get Block / chain height


getHeight function found in BlockChain Class utilizes getBlocksCount to return the height of the chain. 

```
getHeight()
    |
    |--getBlocksCount()
```
getBlock function found in BlockChain class uses getLevelDBData to return a specific block.

```
getBlock()
    |
    |--getLevelDBData()
```

### Managing the Private Blockchain 


#### simpleChain.js

To use simpleChain.js to manage the blockchain use lines 313-328 for creating and validation.

First call out BlockCreator to generate some blocks. The two inputs are timing between block being created and amount of blocks to be created. 
Recommend to stay above 1 sec per block (1 sec == 1000)
<u>NOTE</u> this will generate chaindata folder.
```
// Used to create blocks
BlockCreator(1000,5);
```
After creating blocks the functions below are available. 
```
//validateChain
PrivateChain.validateChain();
```
Input: block you want to validate.
```
//validateBlock
PrivateChain.validateBlock(1);
```
```
//Get height of chain
PrivateChain.getHeight();
```
Input: block you want to inspect.
```
//Get single Block
PrivateChain.getBlock(1);
```

#### app.js

Starting the web server
first cd into project repository ``` cd Project_2 ```
run 
```
node app.js
```
The server will be listing on 8080 for a client connection.

<u>Developed with Google Chrome</u>
Copy and paste the socket into url of browser  ```http://127.0.0.1:8080```




Having trouble on windows, windows firewall might need to be turn off.

Copy and paste into control panel 
```Control Panel\System and Security\Windows Defender Firewall\Customize Settings``` then select ```Turn off windows defender Firewall ```. Dont forget to turn it back on!

The video below shows the UI in action, from creating blocks to getting a better visual on how blocks are validated and connected. 

<video width= '940' height = '480' controls muted>
<source  src = "/UI.mp4" type = "video/mp4">
</video>





### Potential Short Comings

If a large amount of blocks where to be created memory would eventually be filled. To solve this either set a limit on how many blocks can be in memory. Or have no blocks in memory, they would be directly saved to the database.



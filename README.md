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
#### Web API

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
- Install sanitize
```
npm install sanitize
```


## Files/Folders
```
project3-----|
             |----levelSandbox.js
             |
             |----RESTful_api.js
             |
             |
             |----chaindata
                      |
                      |---files to store the blockchain (NOT ADVISED TO CHANGE INSIDE CHAINDATA)
             |
             |----README.md

```          

#### levelSandbox.js

Contains leveldb class, this allows blocks on the chain to be persistent. The functions within the class are asynchronous meaning multiple operations can occur at once. Asynchronous operations are done through <a href = "https://developers.google.com/web/fundamentals/primers/promises">Promises </a> which have to be dealt with appropriately.

#### RESTful_api.js

Consist of two classes, Block class and Blockchain class. Together creates a functional private blockchain. With the help of levelSandbox the block chain can be saved and reused.

Block class consist of only a constructor that describes the block object (hash,height,body,time,previousBlockHash).

BlockChain class contains asynchronous functions that handles the creation and management of blocks on the chain.

---


Express framework was used to create a RESTful api that accepts a get and post request. The get endpoint receives data through the URL path with a block height parameter. Example to get block zero <a href= http://localhost:8000/block/0>http://localhost/block/0</a>. This will return a JSON object of the block. Post endpoint receives data in the http payload as raw json. That data is then used as the block body, which is added to the chain.

---

#### Chaindata

Storage of blockchain data.

#### README.md

Your reading it!

### Code Flow
```

Express Web Service            Blockchain class           leveldb class
      |                             |                          |
      |--app.listen()               |--addBlock()              |-- addLevelDBData()
      |                             |                          |
      |--app.get()                  |--validateBlock()         |-- changeDBDate()
      |                             |                          |
      |--app.post()                 |--validateChain()         |-- getLevelDBData()
      |                             |                          |
      |--clientErrorHandler()       |--getHeight()             |-- addDataToLevelDB()
                                    |                          |
                                    |--getBlock()              |-- getBlockCount()
                                                               |
                                                               |-- getChain()
```


#### Creating blocks/Genesis block and saving to leveldb

AddBlock function takes in a block object. Then checking the height of the saved chain determines a genesis block or exsiting block. If height is zero, there are no blocks on the chain therefore a genesis block will be created. Otherwise the last block of the saved chain is used to link the new block to the chain.

``` javascript
    if (result == 0){ 
        newBlock.previousBlockHash = "";
                newBlock.height = result;
                newBlock.time = new Date().getTime().toString().slice(0,-3);
                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        db.addDataToLevelDB(JSON.stringify(newBlock).toString());
        resolve(newBlock);
    }else{
        db.getLevelDBData(result - 1).then((resultBlock) => {
        var lastDBblock = JSON.parse(resultBlock);
        var PH = lastDBblock.hash;
        newBlock.previousBlockHash = PH;
        newBlock.height = result;
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        db.addDataToLevelDB(JSON.stringify(newBlock).toString());
        resolve(newBlock);

```

#### Validate Block / Validate Chain

Validating a block is done in validateBlock in the BlockChain class.
First a specific block is requested by its height with getLevelDBData. Second the existing hash is removed and stored. Enabling rehashing of that block to compare the stored hash. If the hashes are not equal then the block has been change therefore invalid.


```javascript

        var obj = JSON.parse(block); 
        var blockhash = obj.hash;
        obj.hash = "";
        var validBlockHash = SHA256(JSON.stringify(obj)).toString();
        obj.hash = blockhash;
        if (obj.hash === validBlockHash){
            resolve("Valid");
        }else{
            resolve("Invalid");
        }

```

Validating the chain starts by requesting the height of the chain. Then looping the the range of the blocks and comparing two things. First the last blocks hash with the current blocks previous hash. Second, rehashing the block similiar to validating a single block. Only if both are true the chain is valid. The way the function returns the promise is done by first to resolve.
``` javascript
          var CorrectCounter = 0;
            for (var a = 1; a < result + 1; a++){
              db.getLevelDBData(a - 1).then((hash) => {
                var obj = JSON.parse(hash);
                var blockhash = obj.hash;
                obj.hash = "";
                var validBlockHash = SHA256(JSON.stringify(obj)).toString();
                obj.hash = blockhash;
                if (obj.height == 0){
                  if (obj.hash === validBlockHash){
                    // Genesis block is valid wait for the Promise
                  }else{
                    var StringEnder = "Chain invalid, please check block "+obj.height;
                    resolve(StringEnder);
                  }
                }else{
                  db.getLevelDBData(obj.height-1).then((priorHash) => {
                        var Newobj = JSON.parse(priorHash);
                        if (Newobj.hash === obj.previousBlockHash && validBlockHash === obj.hash){
                          if (result - 2 == CorrectCounter){
                            resolve("CHAIN VALID")
                          }
                          CorrectCounter += 1;
                        }else{
                          var prior = obj.height - 1
                          var StringEnder = "Chain invalid, please check blocks "+obj.height+" and "+prior;
                          resolve(StringEnder);
                        }
                  }).catch(function(err){
                    reject(err);
                });
                };
```

#### get Block / chain height


getHeight function found in BlockChain Class utilizes getBlocksCount to return the height of the chain.

```javascript 

          db.getBlocksCount().then((result) => {
              resolve(result);
          }).catch(function(err){
              reject(err);
          });

```
getBlock function found in BlockChain class uses getLevelDBData to return a specific block.

```javascript
        db.getLevelDBData(BlockN).then((result) => {
            resolve(result);
        }).catch(function(err){
            reject(err);
        });
```

---

Get endpoint for a specific block is done by getting the height of the chain and block. The height of the chain allows for proper error handling for whether the chain or block exist. User input is also sanitized to make sure it's a number.   
``` javascript
PrivateChain.getHeight().then((ChainHeight) => {
      if (ChainHeight > 0){
        var CorrectIndex = ChainHeight - 1;
        var BlockNumber = req.paramInt('index');
        BlockNumber = parseInt(BlockNumber);
        Boolofvalue = isNaN(BlockNumber);
        if (Boolofvalue == false){
          if (BlockNumber < ChainHeight){
            PrivateChain.getBlock(BlockNumber).then((Blockstring) => {
            var Block_data = JSON.parse(Blockstring);
            res.status(200); 
            res.json(Block_data);
            res.end();
```
Post endpoint that enables the creation of new block is made through the block chain class, "addblock". Payload content is validated before creating and adding to the chain.
``` javascript
var string = JSON.parse(req.body)
    var data = string.body;
    if (data.length == 0){
      clientErrorHandler(400,req,res);
    }else{
      const BlockModel = new Block;
      BlockModel.body = data
      PrivateChain.addBlock(BlockModel).then((createdBlock) => {
      res.status(200);
      res.setHeader('Content-Type','text/json',);
      res.json(createdBlock);
      res.end();
```



### Managing the Private Blockchain


#### RESTful_api.js


After creating blocks the functions below are available.
```
//validateChain
PrivateChain.validateChain();
```

```
//validateBlock
//Input: block you want to validate.
PrivateChain.validateBlock(1);
```
```
//Get height of chain
PrivateChain.getHeight();
```

```
//Get single Block
//Input: block you want to inspect.
PrivateChain.getBlock(1);
```
```
//Get entire chain
//This is only for visual purposes 
PrivateChain.ChainRecon();
```

---

#### Error Handling / Sanitize user input

Handling errors is done through the clientErrorHandler function. Allows for server and clients errors to be handled appropriately.


```javascript
function clientErrorHandler(err, req, res, parms){
  if (err == 500){
    res.status(err);
    res.json({'Server':'Oops I broke!'});
    res.end();
  }else if (err == 400){
    res.status(err);
    res.json({'Error': 'Block failed to be created and add to chain (If this persist please revert to projects readme for example)'});
    res.end();
  } else if (err == 404){
    res.status(err);
    res.json({'Error':'No blocks exist on the chain'});
    res.end();
  } else if (err == 406){
    res.status(err);
    res.json({'Error':'Please enter a number.'});
    res.end();
  } else if (err == 409){
    let ErrorString = 'Block request is out of range. Current Height is '+ parms +'.'
	res.status(err); 
	res.json({'Error':ErrorString});
	res.end();
  }

};
```




---

### Using the API



#### Get request for a block

Getting a block is done through the url. After the last forward slash represents a block by height /block/{height}. JSON object is returned representing the block.

Example URL: http://localhost:8000/block/0




#### Post request to add block

Creating a block uses the data payload option through the url path /block. The data payload is sent raw with content being application JSON. The newly created block is then sent back to the user.

<b>Example post request.</b>

```
{
"body": "Testing block with test string data"
}
```


<b>NOTE</b> tested and developed with <a href ="https://www.getpostman.com/" >postman</a>

#### Running the server
Starting the web server
first cd into project repository ``` cd Project_3 ```
run
```
node RESTful_api.js
```
The server will be listing on 8000 for a client connection.
socket: http://127.0.0.1:8000/

---



/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

// leveldb import
const Leveldb = require('./levelSandbox.js');

// Constuct leveldb object (Saved blockchain)
const db = new Leveldb.leveldb;

// web server imports
var express = require('express');
var bodyParser = require('body-parser');
var app   = express();


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ====================== Blockchain Class ================================*/


class Blockchain{


/* ==================== Create new block =================
|    Function within Blockchain class to add new blocks  |
|  =====================================================*/

  addBlock(newBlock){
    return new Promise(function(resolve, reject) {
      db.getBlocksCount().then((result) => {
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
					 }).catch(function(err){
            reject(err);
          })
        }
      }).catch(function(err){
        reject(err);
    })
  })

  }


/* ======================= Validate a single block =========================
|   -Function within Blockchain class to validate a single block.           |
|    -Block is rehashed and compared to validate the block .                |
|    -When rehashing the block the hash value is remove to get a valid hash.|
|    INPUT                                                                  |
|      intager (block height)                                               |
|    OUTPUT                                                                 |
|      string (Block vaildation) as a promise                               |
|  ========================================================================*/

      validateBlock(blockHeight){
        return new Promise(function(resolve,reject) {
          db.getLevelDBData(blockHeight).then((block) => {
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
        }).catch(function(err){
          reject(err);
      })
    })
  }


/* ================================================ Validate the entire block chain ================================================
|   -Function within Blockchain class to validate the block chain                                                                     |
|    -This function uses the power of promise to resolve the itegerate of the chain                                                   |
|        -Loop through each block                                                                                                     |
|          -If block is invalid a resolve is returned                                                                                 |
|          -Else do nothing until the end of the chain. If a resolve is not returned before the end of the chain, resolve chain vaild.|
|    INPUT                                                                                                                            |
|        NONE                                                                                                                         |
|    OUTPUT                                                                                                                           |
|        string that discribes the chain is valid or not as a promise                                                                 |
|  ================================================================================================================================*/

    validateChain(){
      return new Promise(function(resolve,reject) {
        db.getBlocksCount().then((result) => {
          var CorrectCounter = 0;
            // loop through each block from block one used to compare pervious hash
            for (var a = 1; a < result + 1; a++){
              db.getLevelDBData(a - 1).then((hash) => {
                var obj = JSON.parse(hash);
                var blockhash = obj.hash;
                obj.hash = "";
                var validBlockHash = SHA256(JSON.stringify(obj)).toString();
                obj.hash = blockhash;
                if (obj.height == 0){
                  if (obj.hash === validBlockHash){
                    // Do Nothing hashes match wait for the Promise
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
                          var StringEnder = "CHAIN invalid, please check blocks "+obj.height+" and "+prior;
                          resolve(StringEnder);
                        }
                  }).catch(function(err){
                    reject(err);
                });
                };
                }).catch(function(err){
                  reject(err);
              });
            };
        }).catch(function(err){
          reject(err);
      });
    });

  }

/* ==================== Get the height of the block chain =======================
|  -Function within Blockchain class to get the prior height of the block chain  |
|  -Uses getBlockCount to height of the chain                                    |
|   INPUT                                                                        |
|        NONE                                                                    |
|    OUTPUT                                                                      |
|        intager of height of chain as a promise                                 |
|  ==============================================================================*/

    getHeight(){
      return new Promise(function(resolve, reject) {
          db.getBlocksCount().then((result) => {
              resolve(result);
          }).catch(function(err){
              reject(err);
          });
      });
    }


/* ============= Get a single block of the block chain ===================
|   -Function within Blockchain class to get a speific block on the chain |
|    -Uses getLevelDBData to reateive block from leveldb                  |
|    INPUT                                                                |
|        intager used to get specific block                               |
|    OUTPUT                                                               |
|        block object as a promise                                        |
|  ======================================================================*/

    getBlock(BlockN){
      return new Promise(function(resolve,reject) {
        db.getLevelDBData(BlockN).then((result) => {
            resolve(result);
        }).catch(function(err){
            reject(err);
        });
      });
    };


/* ================= Get the entire block chain ====================
|   -Function within Blockchain class to get the entire block chain |
|   -Used to visualize the block chain on the clients browser       |
|   -Uses db.getChain() to get chain                                |
|   INPUT                                                           |
|        None                                                       |
|   OUTPUT                                                          |
|        list of block objects as a promise                         |
|  =================================================================*/
  ChainRecon(){
    return new Promise(function(resolve,reject) {
      db.getChain().then((chain) => {
          resolve(chain);
        }).catch(function(err){
         reject(err);
        });
      });
    };
}


// Create blockchain object
const PrivateChain = new Blockchain;


/* =============================================== Express API  ==================================================
|   Below is a functional RESTful api, that clients can post and get data directly through the block chain class |
|  =============================================================================================================*/


//Note that in version 4 of express, express.bodyParser() was
//deprecated in favor of a separate 'body-parser' module.
app.use(bodyParser.text({ type:'application/json'}));
//require sanitize as a middleware with express
app.use(require('sanitize').middleware);

app.use(clientErrorHandler)

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
    var ErrorString = 'Block request is out of range. Current Height is '+ parms +'.'
		res.status(err); 
		res.json({'Error':ErrorString});
		res.end();
  }

};



/*====================== get request to get a single block ==================
|   - check if requested variable (H) is a intager                          |
|   - chain height is compared to the requested block, to check existences  |
|   - if variable is a intager and block existence JSON block object is sent|
|   - else error is sent as JSON                                            |
|   INPUT                                                                   |
|      request: intager                                                     |
|   OUTPUT                                                                  |
|      response: JSON object                                                |
|==========================================================================*/


app.get('/block/:index',async function(req,res){
    res.setHeader('Content-Type','text/json');
    PrivateChain.getHeight().then((ChainHeight) => {
      if (ChainHeight > 0){
        CorrectIndex = ChainHeight - 1;
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
          }).catch(function(err){
            clientErrorHandler(err,req,res);
          });
          }else{
            clientErrorHandler(409,req,res,CorrectIndex);
          }
        }else{
          clientErrorHandler(406,req,res);
        }
      }else{
        clientErrorHandler(404,req,res);
      }
    }).catch(function(err){
      
      clientErrorHandler(err,req,res);
  });
});



/*======================== post request to add blocks to the chain ===============================
|    -check if request body variable is a string or nothing                                       |
|    -a new block is created and add to the chain with body of the block being the request string |
|    -data is raw within the body of the request                      |
|    INPUT                                                                                        |
|        request: string                                                                          |
|    OUTPUT                                                                                       |
|        response: JSON (object)                                                                  |
|================================================================================================*/
// post endpoint url /blocks
app.post('/block',async function(req,res) {
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
      }).catch(function(err){
        clientErrorHandler(err,req,res);
      });
    }
});


// start the web server running on localhost (127.0.0.1) on port 8000
app.listen(8000, function() {
  console.log('Server running at http://127.0.0.1:8000/');
});

const SHA256 = require('crypto-js/sha256');
const Leveldb = require('./levelSandbox.js');

const db = new Leveldb.leveldb;

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
    |      integer (block height)                                               |
    |    OUTPUT                                                                 |
    |      string (Block vaildation) as a promise                               |
    |  ========================================================================*/
    // NEW this takes in a block object to validate
    validateBlock(block){
        return new Promise(function(resolve,reject) {
            var obj = JSON.parse(block);
            var blockhash = obj.hash;
            obj.hash = "";
            var validBlockHash = SHA256(JSON.stringify(obj)).toString();
            obj.hash = blockhash;
            if (obj.hash === validBlockHash){
                resolve("Valid");
            }else{
                resolve("Invalid");
            };
        }).catch(function(err){
            reject(err);
        });
    };


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
                        // Do Nothing, hashes match wait for the resolve
                        }else{
                        var StringEnder = "Chain invalid, please check block "+obj.height;
                        resolve(StringEnder);
                        };
                    }else{
                        db.getLevelDBData(obj.height-1).then((priorHash) => {
                            var Newobj = JSON.parse(priorHash);
                            if (Newobj.hash === obj.previousBlockHash && validBlockHash === obj.hash){
                                if (result - 2 == CorrectCounter){
                                resolve("CHAIN VALID");
                                };
                                CorrectCounter += 1;
                            }else{
                                var prior = obj.height - 1
                                var StringEnder = "Chain invalid, please check blocks "+obj.height+" and "+prior;
                                resolve(StringEnder);
                            };
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
      };

    /* ==================== Get the height of the block chain =======================
    |  -Function within Blockchain class to get the prior height of the block chain  |
    |  -Uses getBlockCount to height of the chain                                    |
    |   INPUT                                                                        |
    |        NONE                                                                    |
    |    OUTPUT                                                                      |
    |        integer of height of chain as a promise                                 |
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
    |    -Uses getLevelDBData to return block from leveldb                  |
    |    INPUT                                                                |
    |        integer used to get specific block                               |
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


    /* ========= middle function between api and level database ===============
    |    INPUT                                                                |
    |        search value and type of variable to search for                  |
    |    OUTPUT                                                               |
    |        array of blocks that match user value                            |
    |  ======================================================================*/ 

      ChainRecon(SearchValue,Type){
        return new Promise(function(resolve,reject) {
          db.getChain(SearchValue,Type).then((chain) => {
              resolve(chain);
            }).catch(function(err){
             reject(500);
            });
          });
        };

    }

module.exports.Blockchain = Blockchain;

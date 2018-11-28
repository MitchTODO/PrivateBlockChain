/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

// leveldb import 
const Leveldb = require('./levelSandbox.js');

// Constuct leveldb object (Saved blockchain)
const db = new Leveldb.leveldb;

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

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    // construct chain in memory 
    this.chain = [];
    // get height of db, this allow to add block to db without deletion of chain
    db.getBlocksCount().then((result) => {
      // If nothing create a genesis block
      if(!result) {
        let GenBlock = new Block("First block in the chain - Genesis block");
        GenBlock.time = new Date().getTime().toString().slice(0,-3);
        GenBlock.height = 0;
        GenBlock.hash = SHA256(JSON.stringify(GenBlock)).toString();
        this.chain.push(GenBlock);
        db.addDataToLevelDB(JSON.stringify(GenBlock).toString());
        // else create a new block with the correct height 
        // NOTE this means a new block will be add when constucting Blockchain class
        }else {
          db.getLevelDBData(result - 1).then((resultBlock) => {
            if(!resultBlock){
              console.log('Cant ID last DB block');
              //create new block with the height + 1 of last block added to db
              // the new block is add to database chain and memory chain
            }else{
              var lastDBblock = JSON.parse(resultBlock);
              var PH = lastDBblock.hash;
              let CB = new Block();
              CB.previousBlockHash = PH;
              CB.height = result;
              CB.time = new Date().getTime().toString().slice(0,-3);
              CB.hash = SHA256(JSON.stringify(CB)).toString();
              // Chain in memory
              this.chain.push(CB);
              // Chain in db 
              db.addDataToLevelDB(JSON.stringify(CB).toString());
              
            }
           }).catch((err) => { console.log(err); });
          
        }
    }).catch((err) => { console.log(err); });
    
  }


/* ==================== Create new block =================
|    Function within Blockchain class to add new blocks  |
|  =====================================================*/

  addBlock(newBlock){
    // Block height
    newBlock.height = this.chain[this.chain.length - 1].height + 1;
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(newBlock.height>0){
      // Will have to change for no prior hash value aka starting from ! 0 
      newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    db.addDataToLevelDB(JSON.stringify(newBlock).toString());
    // Add block to chain in memory
  	this.chain.push(newBlock);
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
        return new Promise(resolve => {
        // get requested block 
        db.getLevelDBData(blockHeight).then((block) => {
          if (!block){
            console.log('Error With getting Block within validateBlock')
            resolve("A Error Accored, please check block range");
          }else{
            // Turn block into object
            var obj = JSON.parse(block);
            // Hold block hash
            var blockhash = obj.hash;
            // make block hash empty sting 
            obj.hash = "";
            // rehash the block 
            var validBlockHash = SHA256(JSON.stringify(obj)).toString();
            // put back hash for validation
            obj.hash = blockhash;
            // compare hashes and validate the block
            if (obj.hash === validBlockHash){
              var CorrectString = ("Block #"+obj.height+" is validated and intacted")
              console.log('\x1b[32m%s\x1b[0m',CorrectString);
              resolve("Valid");
            }else{
              console.log('\x1b[31m%s\x1b[0m',"WARNING block #"+obj.height+" has been tampered with or corrupt. Please check chain integerite using validateChain()");
              resolve("Invalid");
            }
      }
    });
  });
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
      return new Promise(resolve => {
        //get the height of the chain 
      db.getBlocksCount().then((result) => {
        if(!result) {
          console.log('Error with getting chain height within validateChain');
          }else {
            var CorrectCounter = 0;
            // loop through each block from block one used to compare pervious hash
            for (var a = 0; a < result + 1; a++){
              // get blocks value used to compare 
              // NOTE Block objects are returns as strings
              db.getLevelDBData(a-1).then((hash) => {
                if (!hash){
                  console.log('Error With getting block within validateChain')
                }else{
                  //Turn string back into block object
                  var obj = JSON.parse(hash);
                  // Hold block hash for comparing
                  var blockhash = obj.hash;
                  // remove hash from block object
                  obj.hash = "";
                  // Hash block with SHA256 to compare with hash in block
                  var validBlockHash = SHA256(JSON.stringify(obj)).toString();
                  // put back object hash that was removed
                  obj.hash = blockhash;
                  //Gensis block has no pervious hash, block is only compared to the hash done to the block 
                  if (obj.height == 0){
                    // Comparing the hash we just created (validBlockHash) with the hash in the block
                    if (obj.hash === validBlockHash){
                      console.log("Gensis Block Valid")
                    }else{
                      console.log("Gensis block invalid")
                      // if gensis is invalid we resolve the promise with string and block height
                      var StringEnder = "CHAIN invalid, please check block "+obj.height;
                      resolve(StringEnder);
                    }
                  }else{
                  // if not gensis block, get the pevious block by subtracting one from the height 
                  db.getLevelDBData(obj.height - 1).then((priorHash) => {
                    if (!priorHash){
                      console.log("Error getting next Block")
                      }else{
                        // make the previous block into a object 
                        var Newobj = JSON.parse(priorHash);
                        // Full vaildation of the block
                        // Compare main block hash and next block previous hash
                        // Compare Hash just create and hash already in the block 
                        if (Newobj.hash === obj.previousBlockHash && validBlockHash === obj.hash){
                          // Reach the end of the chain and resolve the promise with a vaild string
                          if (result - 2 == CorrectCounter){
                            console.log('\x1b[32m%s\x1b[0m',"CHAIN VALID")
                            resolve("CHAIN VALID")
                          }
                          // counter for chain position
                          CorrectCounter += 1;
                        // if block or previous block is invaild, resolve promise with string with blocks that are invalid
                        }else{
                          console.log('\x1b[31m%s\x1b[0m',"HASH DOES NOT MATCH WITH BLOCK:",obj.height)
                          var prior = obj.height - 1
                          var StringEnder = "CHAIN invalid, please check blocks "+obj.height+" and "+prior;
                          resolve(StringEnder);
                        }
                      }
                  });
                }
                }
              }).catch((err) => { console.log(err);});
            }
          }
          
      }).catch((err) => { console.log(err); });
      
    })
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
      return new Promise(resolve => {
        db.getBlocksCount().then((result) => {
          if (!result){
            console.log('\x1b[31m%s\x1b[0m','Error With getting height within getHeight()')
          }else{
            console.log('\x1b[32m%s\x1b[0m',result);
            resolve(result);
          }
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
      return new Promise(resolve => {
        db.getLevelDBData(BlockN).then((result) => {
          if(!result){
            console.log('\x1b[31m%s\x1b[0m','Error with getting block within getBlock()')
          }else{
            console.log('\x1b[32m%s\x1b[0m',JSON.stringify(result));
            resolve(result);
          }
        })
      })
    }


}


// Create blockchain object
const PrivateChain = new Blockchain;

/* ========================== Creating blocks  ====================================
|  -Allows for the creation of new blocks                                         |
|  -Using addBlock function with in blockchain class                              |
| INPUTS                                                                          |
|  -Taking in two intagers (timing,amount).                                       |
|  -Timing specifying the timeout period between blocks being created.            | 
|  -Amount of blocks to be created.                                               |
| OUTPUTS                                                                         |
|   returns a string as a promise                                                 |
|  ==============================================================================*/


async function BlockCreator(timing,amount){
  return new Promise(resolve => {
  (function theLoop (i) {
    setTimeout(function () {
        const BlockModel = new Block;
        PrivateChain.addBlock(BlockModel);
          i++;
      if (i < amount - 1) { 
            theLoop(i) 
          } else {
            console.log('\x1b[32m%s\x1b[0m',"Blocks Added Successful")
            resolve("Blocks Added Successful");
          }
    }, timing);
    })(0);
  });
  }




// Used to create blocks
//BlockCreator(1000,5);

//validateChain
//PrivateChain.validateChain();

//validateBlock
//PrivateChain.validateBlock(1);

//Get height of chain
//PrivateChain.getHeight();

//Get single Block
//PrivateChain.getBlock(1);

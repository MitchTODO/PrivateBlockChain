
// web server imports
const express = require('express');
const bodyParser = require('body-parser');
const app   = express();

// boom error handling 
const boom = require('./myBoom.js');

// Blockchain 
const blockchain = require('./BlockChain.js');
const block = require('./Block.js')

//mempool
const mempool = require('./memPool.js');

// Create objects 
const PrivateChain = new blockchain.Blockchain; //BlockChain 
const Boom = new boom.Error; // Client error handling 
const Mempool = new mempool.MemPool; //Mempool 

//Note that in version 4 of express, express.bodyParser() was
//deprecated in favor of a separate 'body-parser' module.
app.use(bodyParser.text({ type:'application/json'}));

//require sanitize as a middleware with express
app.use(require('sanitize').middleware);

// sends JSON out 
function outgoing(res,value){
  res.status(200);
  res.setHeader('Content-Type','text/json');
  res.json(value);
  res.end();
};

// check for undefine varablies
function incoming(value){
  if (value == undefined){
    return false;
  }else{
    return true;
  };
};


/**
 * POST endpoint to request validation
 * 
 * check address length and typeof variable 
 * pass address to mempool (requestValidation) to get JSON object
 * 
 * INPUT 
 *      JSON bitcoin address 34 charaters
 * OUTPUT 
 *      JSON object including message used for signing 
 * 
 */

app.post("/requestValidation",async function(req,res){
    var Address = JSON.parse(req.body).address;
    if (incoming(Address) == true){  
      if (Address.length == 34){
          Mempool.requestValidation(Address).then((validReturn) => {
            outgoing(res,validReturn);
          }).catch(function(err){
            Boom.badImplementation(res,"Server cannot create a validation request.");
          });
      }else{
        Boom.badRequest(res,'Missing or invalid Bitcoin wallet.');
      };
  }else{
    Boom.badRequest(res,'Invalid post, check your JSON.');
  };
});


/**
 * POST endpoint to validate address and signature
 * 
 * check length and unknown values for address / signature
 * pass both address/signature to mempool (validateRequestByWallet) to get validation status 
 * 
 * INPUT
 *      JSON address and signature 
 * OUTPUT
 *      JSON object of validation status 
 * 
 */

app.post("/message-signature/validate", async function(req,res){
  var request = JSON.parse(req.body);
  var address = request.address;
  var signature = request.signature;
  if (incoming(signature) == true & incoming(address) == true){ 
    if (address.length == 34 & signature.length == 88){ 
      Mempool.validateRequestByWallet(address,signature).then((validReturn) => { 
        outgoing(res,validReturn);
      }).catch(function(err){
        if (err == 410){
          Boom.resourceGone(res,'Request Expired or wallet address is incorrect, please create a new validation request.');
        }else if (err == 500){
          Boom.badImplementation(res,'Server cannot validate request by wallet.');
        };
      });
    }else{
        Boom.badRequest(res,'Wallet and/or signature is not correct.');
    };
  }else{
    Boom.badRequest(res,'Invalid post, check your JSON.');
  };
});


/** 
 * POST star object to create a new block 
 * 
 * check length and unknown values for address / star object
 * pass star object to verifyAddressRequest within mempool, returns bool if address is valid to own a star
 * check if star is already owned 
 * 
 * INPUT
 *      JSON address and star object containing location and story 
 * OUTPUT
 *      JSON of newly created block
 */

app.post('/block',async function(req,res) {
  var starObject = JSON.parse(req.body);
  if (incoming(starObject.star) == true & incoming(starObject.address) == true){ // could be unknown variables
    let hasMoreThanAscii = /^[\u0000-\u007f]*$/.test(starObject.star.story); 
    if (hasMoreThanAscii == true & starObject.star.story.length <  250){
      Mempool.verifyAddressRequest(starObject).then((BlockStatus) => {
        if(BlockStatus == true){
          PrivateChain.ChainRecon(starObject.star,"STAR").then((status) => {
            if (status.length == 0){
              starObject.star.story = Buffer(starObject.star.story).toString('hex');
              let NewBlock = new block.Block(starObject);
              PrivateChain.addBlock(NewBlock).then((BackBlock) => {
                outgoing(res,BackBlock); 
                Mempool.removeValidation(starObject.address);
              }).catch(function(err){
                Boom.badImplementation(res,"Cannot create block with star data.");
              });
            }else{
              Boom.conflict(res,"Star already owned.");
            };
          }).catch(function(err){
            Boom.badImplementation(res,"Cannot verify if star is owned.");
          });
        }else{
          Boom.unauthorized(res,'Wallet address and signature is not valid.');
        };
      }).catch(function(err){
        if (err == 500){
          Boom.badImplementation(res,'Cannot varify address.');
        }else if (err == 400){
          Boom.badRequest(res,'Cannot find address in mempool.');
        };
      });
    }else{
      Boom.badRequest(res,'Story has Non ASCII characters and/or is too long, please keep it under 250 charaters.');
    };
  }else{
    Boom.badRequest(res,'Invalid post, check your JSON.');
  };   
});


/**
 * GET a block that matches the users HASH 
 * pass the hash to chainRecon within blockchain, returns the matching block 
 * 
 * INPUT
 *      hash within the URL 
 * OUTPUT
 *      JSON of the matching block
 */

app.get('/stars/hash:HASH',async function(req,res){
  var key = req.params.HASH.slice(1);
  if (key.length == 64 & incoming(key) == true){ 
    PrivateChain.ChainRecon(key,'HASH').then((MatchBlocks) => { // get block that were created with are key (hash)
      if (MatchBlocks.length == 0){ 
        Boom.notFound(res,'no results found.');
      }else{
        outgoing(res,MatchBlocks); // return the block
      }
    }).catch(function(err){
      Boom.badImplementation(res,'Not able to search blocks.');
    });
  }else{
    Boom.badRequest(res,'Invalid get request, check your parameters.');
  }
});


/**
 * GET blocks that match the users address
 * pass the address to chainRecon within blockchain, returns a array of matching blocks 
 * 
 * INPUT
 *      address within the URL 
 * OUTPUT
 *      JSON of matching blocks 
 */

app.get('/stars/address:ADDRESS',async function(req,res){
  var key = req.params.ADDRESS.slice(1); 
  if (key.length == 34 & incoming(key) == true){ 
    PrivateChain.ChainRecon(key,"ADDRESS").then((MatchBlocks) => { 
      if (MatchBlocks.length == 0){ // check array for block
        Boom.notFound(res,'no results found.');
      }else{
        outgoing(res,MatchBlocks);
      }
    }).catch(function(err){
      Boom.badImplementation(res,'Not able to search blocks.');
    });
  }else{
    Boom.badRequest(res,'Invalid get request, check your parameters.');
  };
});


/**
 * GET a block by the height 
 * pass height of request block to getBlock within blockchain, returns the block
 * 
 * INPUT
 *      height of block within the URL 
 * OUTPUT
 *      JSON of request block
 */

app.get('/block/:index',async function(req,res){
    PrivateChain.getHeight().then((ChainHeight) => {
      if (ChainHeight > 0){
        let CorrectIndex = ChainHeight - 1;
        let BlockNumber = req.paramInt('index');
        BlockNumber = parseInt(BlockNumber); 
        Boolofvalue = isNaN(BlockNumber);
        if (Boolofvalue == false){
          if (BlockNumber < ChainHeight){
            PrivateChain.getBlock(BlockNumber).then((Blockstring) => {
            let Block_data = JSON.parse(Blockstring);
            outgoing(res,Block_data);
          }).catch(function(err){
            Boom.badImplementation(res,'Not able to search blocks.');
          });
          }else{
            Boom.conflict(res,'Invalid block height, current hight of chain is '+ CorrectIndex+'.');
          }
        }else{
          Boom.badRequest(res,'Please enter a number.');
        }
      }else{
        Boom.notFound(res,'No blocks exist.');
      }
    }).catch(function(err){
      Boom.badImplementation(res,'Not able to search blocks.');
  });
});



// start the web server running on localhost (127.0.0.1) on port 8000
app.listen(8000, function() {
  console.log('Server running at http://127.0.0.1:8000/');
});

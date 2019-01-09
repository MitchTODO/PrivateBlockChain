//level library
const level = require('level');
const chainDB = './chaindata';


class leveldb {
  constructor() {
    this.db = level(chainDB);
  }
  
// Add data to levelDB with key and value (Promise)
addLevelDBData(key, value) {
  let self = this;
  return new Promise(function(resolve, reject) {
      self.db.put(key, value, function(err) {
          if (err) {
              reject(err);
          }
          resolve(value);
      });
  });
}

// This is only used for testing
changeDBData(key,value){
    let self = this;
    return new Promise(function(resolve,reject) {
        self.db.put(key,value,(err,value) => {
            if(err){
                if (err.type == "NotFoundError"){
                    resolve("Block Not Found");
                }
            }else{
                resolve("Block Change Successful");
            }
        })
    })
   
}

// Get data from levelDB with key (Promise)
getLevelDBData(key){
  let self = this; // because we are returning a promise we will need this to be able to reference 'this' inside the Promise constructor
  return new Promise(function(resolve, reject) {
      self.db.get(key, (err, value) => {
          if(err){
            reject(500);
          }else {
            resolve(value);
          }
      });
  });
}

// Add data to levelDB with value
 addDataToLevelDB(value) {
  let self = this;
    let i = 0;
    return new Promise(function(resolve,reject){
      self.db.createReadStream().on('data', function(data) {
        i++;
      }).on('error', function(err) {
        reject(err)
      }).on('close', function() {
        self.addLevelDBData(i, value);
        resolve(true)
      });
    })

};

// create a counter for every object in the database
getBlocksCount() {
  let self = this;
  var a = 0;
  return new Promise(function(resolve, reject) {
  self.db.createReadStream().on('data', function(data) {
      a++;
  }).on('error', function(err) {
      reject(500);
  }).on('close', function() {
    resolve(a);
    
  });
});
}

// loops through each block, can check by three things HASH,ADDRESS and STAR
getChain(key,SearchType) {
  let self = this;
  var BC = [];
  return new Promise(function(resolve, reject) {
    self.db.createReadStream().on('data', function(data) {
        var stringObject = data.value;
        var blockObject = JSON.parse(stringObject);
        if (SearchType == "HASH" & key.length == 64 & blockObject.hash == key){
            resolve(blockObject); // Only one block can match a hash
        }else if (SearchType == "ADDRESS" & key.length == 34 & blockObject.body.address == key){
            BC.push(blockObject);
        }else if (SearchType == "STAR"){
            if (blockObject.body.star.dec == key.dec & blockObject.body.star.ra == key.ra){
                BC.push(blockObject)
            };
        };
        }).on('error', function(err) {
            reject(500)
        }).on('close', function() { 
            resolve(BC); // resolve array
        });
    });
}

}

module.exports.leveldb = leveldb;


/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/




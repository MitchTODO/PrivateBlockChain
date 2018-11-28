/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

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
              console.log('Block ' + key + ' submission failed', err);
              reject(err);
          }
          resolve(value);
      });
  });
}

//  NOTE THIS IS ONLY FOR DEVELOPMENT
// Used in app.js to alterblocks to show that chain and Block Validation work
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
              if (err.type == 'NotFoundError') {
                  resolve(undefined);
              }else {
                  console.log('Block ' + key + ' get failed', err);
                  reject(err);
              }
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
      reject(err)
  }).on('close', function() {
    resolve(a);
  });
});
}

// Only Used for app.js 
// Allow the client to view the blockchain
getChain() {
  let self = this;
  var BC = [];
  return new Promise(function(resolve, reject) {
  self.db.createReadStream().on('data', function(data) {
      
      //console.log(typeof obj.height);
      //BC.splice(obj.height, 0, data);
      BC.push(data);

  }).on('error', function(err) {
      reject(err)
      //return console.log('Unable to read data stream!', err)
  }).on('close', function() {
      //console.log('returning length as: ' + a);
      
    resolve(BC);
    
      //return a-1;
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




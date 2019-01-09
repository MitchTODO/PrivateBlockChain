// Bitcoin librarys 
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');


// validation block class
// used in mempool, represents a request 
// create new epoch data 
// concatenate strings to create message
// 300 second / 5mins
class validationBlock{
    constructor(data){
        this.walletAddress = data;
        this.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
        this.message = this.walletAddress.toString()+":"+ this.requestTimeStamp.toString()+":starRegistry";
        this.validationWindow = 300;
    }
}

// validation status class 
// used in mempool, as JSON object sent to client after validation 
class validationStatus{
    constructor(sign,validBlock){
        this.registerStar = sign;
        this.status = {
            "address":validBlock.walletAddress,
            "requestTimeStamp":validBlock.requestTimeStamp,
            "message":validBlock.message,
            "validationWindow":validBlock.validationWindow,
            "messageSignature":sign
        };
    }
}

// mempool class 
class MemPool{
    constructor(){
        this.mempool = [];
        this.timeoutRequest = [];
    };

    // elapse timer to update validationWindow
    async TimeTracker(index){
        let self = this;
        var prev = self.mempool[index].request;
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - prev.requestTimeStamp;
        let timeLeft = (5*60*1000/1000) - timeElapse; // 5 minutes
        prev.validationWindow = timeLeft;
    };
    
    // adds validation block to mempool 
    requestValidation(address){
        let self = this;
        return new Promise(function(resolve, reject){
            const TimingWindow = (5*60*1000)
            var index = self.mempool.findIndex(x => x.id === address); 
            if (index != -1){   // if address exist return previous validation block
                self.TimeTracker(index,TimingWindow);
                resolve(self.mempool[index].request);
            }else{ // else create new validation block 
            var request = new validationBlock(address);
            self.mempool.push({id:request.walletAddress,request},setTimeout(function(){ self.removeValidation(request.walletAddress); },TimingWindow)); // auto removing in 5 min from mempool  
            resolve(request);
            }
        }).catch(function(err){
            reject(500);
        });
    }; 

    // removes validation block from mempool by address 
    removeValidation(address){
        let self = this;
        var valueToRemove = self.mempool.findIndex(x => x.id === address);
        self.mempool.splice(valueToRemove, 1);
    };

    // validate by message, address and signature
    // uses bitcoinMessage.verify to verify signature 
    validateRequestByWallet(address,signature){
        let self = this;
        return new Promise(function(resolve,reject){
            try{
                var index = self.mempool.findIndex(x => x.id === address);
                if(index != -1){ 
                    if (self.mempool[index].Block == undefined){
                        let message = self.mempool[index].request.message; // message is already in mempool 
                        let Valid = bitcoinMessage.verify(message, address, signature); // returns a bool value 
                        self.TimeTracker(index); //update time 
                        let Block = new validationStatus(Valid,self.mempool[index].request);
                        self.mempool[index]['Block'] = (Block);
                        resolve(Block);
                    }else{
                        self.TimeTracker(index);
                        self.mempool[index].Block.status.validationWindow = self.mempool[index].request.validationWindow;
                        resolve(self.mempool[index].Block);
                    };
                }else{
                    reject(410);
                };
            }catch{
                reject(500);
            };
        });
    };

    // varify ownership of the address
    verifyAddressRequest(starData){
        let self = this;
        return new Promise(function(resolve,reject){
            try{
                var index = self.mempool.findIndex(x => x.id === starData.address); // find address in mempool 
                if (index != -1){
                    let status = self.mempool[index].Block.status.messageSignature;
                    if (status == true){ // if messageSignature is true 
                        resolve(true);
                    }else{
                        resolve(false);
                    };
                    
                }else{
                    reject(400);
                };
            }catch{
                reject(500);
            };
        });
    };

};

module.exports.MemPool = MemPool;

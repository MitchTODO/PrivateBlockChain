
# Decentralized Star Notary

StarNotary smart contract allows for the ownership and transfer of stars, that is deployed on the Rinkeby public test network. The star notary contract is inherited from <a href = http://erc721.org/>ERC721 </a>, that is a minimum interface smart contract that allows for unique tokens to be managed, owned and traded.

---

## Contract Functions

List of contract functions:

<u>Default functions that came with starter code</u>

    createStar()

    putStarUpForSale()

    make_payable()

    buyStar()

<u>Newly created functions</u>

    lookUptokenIdToStarInfo()

    exchangeStars()

    transferStar()

---

### Name and Symbol

Contracts tokens are named "StarToken" with a symbol of "SRT".

```javascript
string public constant name = "StarToken";
string public constant symbol = "SRT";
```

---

### lookUptokenIdToStarInfo

Allows looking up the star name by id. By indexing a mapping variable called tokenIdToStarInfo the name of the star is returned as a string.

```javascript
// Implement Task 1 lookUptokenIdToStarInfo
function lookUptokenIdToStarInfo (uint _tokenId) public view returns (string memory) {
    //1. You should return the Star saved in tokenIdToStarInfo mapping
    return tokenIdToStarInfo[_tokenId].name;
}
```

---

### exchangeStars

Allows for two star to be exchanged. Two star ID's are inputs and through the use of "ownerOf" the address owner can be known. By comparing the sender address (one making the request) to the ownerOf ID address we can identify the sender is the owner of one of the stars. This prevents any two stars from being traded. The transferFrom function allows the transfer of stars. This function is within the ERC721.

```javascript
// Implement Task 1 Exchange Stars function
function exchangeStars(uint256 _tokenId1, uint256 _tokenId2) public {
    //1. Passing to star tokenId you will need to check if the owner of _tokenId1 or _tokenId2 is the sender
    address sender = msg.sender;
    //2. You don't have to check for the price of the token (star)
    //3. Get the owner of the two tokens (ownerOf(_tokenId1), ownerOf(_tokenId1)
    address address1 = ownerOf(_tokenId1);
    address address2 = ownerOf(_tokenId2);
    //4. Use _transferFrom function to exchange the tokens.
    if (sender == address1){
        //token 1 is owned by sender
        _transferFrom(address1, address2, _tokenId1);
        _transferFrom(address2, address1, _tokenId2);
    }else if (sender == address2){
        // token 2 is owned by sender
        _transferFrom(address2, address1, _tokenId2);
        _transferFrom(address1, address2, _tokenId1);
    }   
}
```

---

### transferStar

Allows for the transfer of a star from one address to another. Receivers address and senders star ID are inputs. Checks if sender address owns the star, if true the star is transferred with a ERC721 function.

```javascript
// Implement Task 1 Transfer Stars
function transferStar(address _to1, uint256 _tokenId) public {
    //1. Check if the sender is the ownerOf(_tokenId)
    address address1 = ownerOf(_tokenId);
    //2. Use the transferFrom(from, to, tokenId); function to transfer the Star
    if(msg.sender == address1){
        _transferFrom(address1, _to1, _tokenId);
    }
}
```

---
## Testing Contract Function

### TestStarNotary

A instance of the contract is deployed in each test statement. Stars are also created depending on the type of test. Stars are owned by address given by truffle.

#### Test token name and symbol

Testing token name and symbol is done by calling out public variables within the contract and checked with conditional statements "assert.equal()". Star name is also tested by creating a star with a name "Mystar", then testing that newly created star name.

```javascript
it('can add the star name and star symbol properly', async() => {
    //1. Create a star
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 6;
    await instance.createStar('Mystar', starId, {from: user1});

    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let ContractName = await instance.name(); //get Token name
    let ContractSymbol = await instance.symbol(); // get token symbol
    let starLookUp = await instance.lookUptokenIdToStarInfo(starId); //get star name

    assert.equal(ContractName,'StarToken');
    assert.equal(ContractSymbol,'SRT');
    assert.equal(starLookUp,'Mystar');
});
```

#### Test exchanging stars

Testing exchange stars requires two address both with owned stars for the exchange. Then passing the starId's to the exchangeStars function within the contract. To check if the exchange worked, the ownership of the stars will be in the other address.

This table my help with accounts to stars ownership.

<table style="width:100%">
  <tr>
    <th>Alice</th>
    <th>Bob</th>
  </tr>
  <tr>
    <td>StarID: 7</td>
    <td>StarID: 8</td>
  </tr>
  <tr>
    <td>StarName TheMstar</td>
    <td>StarName TheGstar</td>
  </tr>
</table>

```javascript
it('lets 2 users exchange stars', async() => {
    let instance = await StarNotary.deployed();
    // two address accounts
    let Alice = accounts[0];
    let Bob = accounts[1];
    // two stars with IDs
    let starId = 7;
    let starId2 = 8;
    // 1. Create 2 Stars
    await instance.createStar('TheMstar',starId, {from: Alice}); // Alice owns star ID 7
    await instance.createStar('TheGstar',starId2, {from: Bob}); // Bob owns star ID 8
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.exchangeStars(starId,starId2);
    let star1 = await instance.ownerOf.call(starId); // get new owner of star ID 7
    let star2 = await instance.ownerOf.call(starId2); // get new owner of star ID 8
    // 3. Verify that the owners changed
    assert.equal(star1,Bob); // Bob should own star ID 7
    assert.equal(star2,Alice); // Alice should own star ID 8
});
```

#### Test transfer stars

Testing transfer stars needs two address with a single star in only one address. After calling transferStar with the receivers address and senders star ID as inputs. Then by confirming that the receivers address is now the new owner of the star, the test will pass.

```javascript
it('lets a user transfer a star', async() => {
    let instance = await StarNotary.deployed();
    let Alice = accounts[0];
    let Bob = accounts[1];
    let starId = 9;
    // 1. create a Star
    await instance.createStar('TheMstar',starId, {from: Alice}); // create the star in Alice's account
    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(Bob,starId); // Transfer Alices star to Bobs account by star ID 9
    // 3. Verify the star owner changed.
    let stars = await instance.ownerOf.call(starId); // get owner of star ID 9
    assert.equal(stars,Bob); // Bob should own star ID 9
});
```
---

## Front end DAPP

functions:

default functions
    setStatus: changes the html text tags by ID

    createStar: allows a user to create a star on the blockchain with a metamask address

Newly created functions

    lookUp: allows a user to lookup a star name by ID through the use of a contract function.

---
```javascript
setStatus: function(message,htmlID) {
  const status = document.getElementById(htmlID);
  status.innerHTML = message;
},

// Implement Task 4 Modify the front end of the DAPP
lookUp: async function (){
  let { lookUptokenIdToStarInfo } = this.meta.methods;
  let { symbol } = this.meta.methods;
  let { name } = this.meta.methods;
  let id = document.getElementById("lookid").value;
  id = parseInt(id);
  let starName = await lookUptokenIdToStarInfo(id).call(); // call lookUptokenIdToStarInfo function within the contract
  let contract = await name().call();
  let sym = await symbol().call();
  if (starName.length == 0){ // if starName is zero then no name exist and therefor not owned
    App.setStatus("Star not owned.","status");
    App.setStatus("Star ID: ","starData");
    App.setStatus("Token Name: ","contract");
    App.setStatus("Token Symbol: ","symbol");
  }else{ // else its owned and displayed by passing tag ID to setStatus
    App.setStatus("Star owned.","status");
      App.setStatus("Star ID: "+id+" is named "+starName,"starData");
      App.setStatus("Token Name: "+contract,"contract");
      App.setStatus("Token Symbol: "+sym,"symbol");
  }

}
```

---
## Getting started and deploying contract

_My Versions_

``Token address c963a21eb4d6445bbac51a143477b898``

``nodejs v11.3.0``

``Truffle v5.0.3``

``webpack 4.28.1``

clone the git repository

    git clone https://github.com/MitchTODO/Private-Blockchain.git

cd into repository


### Deploying Contract to local running Ethereum network

Install truffle

    npm -g install truffle

Run truffle develope in the project repo:

    truffle develope

You should see truffle running on http://127.0.0.1:9545/ with a development console

Next compiling the contract, inside the development console, run:

    compile

 Then migrating the contract to the locally running Ethereum network, inside the development console, run:

    migrate --reset

Testing the StarNotary contract with TestStarNotary.js inside the development console, run:

    test

__Note__ you will need web3 for the Front End of the DAPP, this should automatically install with truffle. But if you have problems with webpack-dev-server. Find that module in app/node_modules/webpack-dev-server and delete it.
Then run   <br>   ```npm install webpack-dev-server```

Open another terminal window and go inside the project directory, and run:

    cd app

    npm run dev

#### Setting up MetaMask to managed address and allow transactions

Make sure you have <a href = "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn">metaMask </a> chrome extension install

Once installed click on the little fox top left of browser and then on the drop down for different networks. Select Custom RPC, scroll down to new network and paste http://127.0.0.1:9545 then save.

![alt text](pics/metamask.png "metaMask")

If successful you should see you are connect to the local network.

![alt text](pics/local.png "local")

Now we need to import one of are truffle address so we can create some stars.

Go to the truffle development console and copy a private key. This key will be used to import the address into metaMask. Go back to metamask and click on the circle of colors then import account. __Note__ Make sure your still on the local network.  Paste your private key then select import. If done right you should see your new test account with 100 ETH. Make sure you have this account selected.

![alt text](pics/private.png "private")

To view the DAPP point your browser to http://127.0.0.1:8080


Next create a star with a star name (string) and star ID (integer), then press create star. You should see a metaMask
notification allowing you to confirm a contract interaction.

![alt text](pics/contract.png "contract")

Looking up a star by id.

![alt text](pics/lookup.png "lookup")

---

### Deploying Contract to the Rinkeby public test network

Open the package-lock.json and verify that truffle-hdwallet-provider and openzeppelin-solidity dependencies are installed. If not you can always install it with the commands:

    npm install --save truffle-hdwallet-provider

    npm install --save openzeppelin-solidity

Then opening truffle-config.js file to allow deployment to rinkeby.

Edit networks like so:

__Note__ you will need your metaMask seed words found in settings within metaMask. Also a infura contract address, the one below is already in used. Use <a href = "https://infura.io/">infura</a> to create a new contract address on rinkeby.

```javascript
networks: {
  // Useful for testing. The `development` name is special - truffle uses it by default
  // if it's defined here and no other network is specified at the command line.
  // You should run a client (like ganache-cli, geth or parity) in a separate terminal
  // tab if you use this network and you must also set the `host`, `port` and `network_id`
  // options below to some value.
  //
  development: {
    host: "localhost",     // Localhost (default: none)
    port: 9545,            // Standard Ethereum port (default: none)
    network_id: "*",       // Any network (default: none)
  },
   rinkeby: {
   provider: function() {
       return new HDWalletProvider("<YOUR SEED WORDS>","https://rinkeby.infura.io/v3/cdf64f4c7d234ad199892d66ae7a4c6c")
     },
     network_id: '4',
     gas: 4500000,
     gasPrice: 10000000000,
    }
  },
}
```

Deploying to Rinkeby, open a new console in the project repo and run:

    truffle migrate --reset --network rinkeby

In another console run web3, run:

    cd app

    npm run dev

__Note__ <a href = "https://faucet.rinkeby.io/">Rinkeby faucet</a> must be used to get test ether to make transactions.

To view the DAPP point your browser to http://127.0.0.1:8080, make sure you selected a Rinkeby account in metaMask with Ether. Next create a star with a star name (string) and star ID (integer), then press create star. You should see a metaMask notification allowing you to confirm a contract interaction.

Contract will pend for a couple of seconds. Then you should see confirmation. Next look up the star you just created by entering the star ID.

![alt text](pics/createToekn.png "Token")

Now we will view the new star Token on <a href = "https://rinkeby.etherscan.io/token/0xaB0C8c151D124430231C8bb5D8B6DD5c2A4595D7">Etherscan</a>

![alt text](pics/Token.png "Token")

StarNotary smart contract is now deployed on a test public blockchain.

// multiple port
const process = require('process');
const portt = process.argv[2];
// import uuid
//const uuid = require('uuid/v1');
//const nodeAddress = uuid().split('-').join('');

// import request promise library that allows us to make requests to all the other nodes in our network
const rp = require('request-promise');

// import our blockchain
const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

// import express package
const express = require('express');
const app = express();

// import bodyparser ( to recieve json data)
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const port = process.env.PORT || 3000;

app.get('/blockchain', function (req, res) {
    res.send(bitcoin);
});

app.post('/transaction', function(req, res) {
  const newTransaction = req.body;
  bitcoin.addTransactionToPendingTransaction(newTransaction);
});

app.get('/mine', function(req, res) {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData ={
        transactions : bitcoin.pendingTransactions,
        index : lastBlock['index'] + 1
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash,blockHash);
    
    res.json({
        note : "New block mined succefully",
        block : newBlock
    });
});
 app.post('/register-and-broadcast-node', function(req,res){
const newNodeUrl = req.body.newNodeUrl;
if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
bitcoin.networkNodes.push(newNodeUrl);

const regNodesPromises =[];
bitcoin.networkNodes.forEach(networkNodeUrl =>{
  const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: { newNodeUrl: newNodeUrl},
      json: true
  }
  regNodesPromises.push(rp(requestOptions));
});

Promise.all(regNodesPromises).then(data =>{
   const bulkRegisterOptions = {
     uri: newNodeUrl+ '/register-nodes-bulk',
      method: 'POST',
      body: {allNetworksNodes:[...bitcoin.networkNodes,bitcoin.currentNodeUrl]},
      json: true  
   } ; 
   return rp(bulkRegisterOptions);
}).then(data =>{
  res.json({note : 'New node registred with network successfully'});
});

 });

 app.post('/register-node',function(req,res){
  const newNodeUrl = req.body.newNodeUrl;

  const nodeNotAlreadyPresent = 
          bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = 
          bitcoin.currentNodeUrl !== newNodeUrl;

  if(nodeNotAlreadyPresent && notCurrentNode ) bitcoin.networkNodes.push(newNodeUrl);

  res.json({note : 'New node registred with network successfully'});

  

 });
 
 app.post('/register-nodes-bulk',function(req,res){
  const allNetworksNodes = req.body.allNetworksNodes;
  allNetworksNodes.forEach(networkNodeUrl =>{
      const nodeNotAlreadyPresent = 
          bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
  const notCurrentNode = 
          bitcoin.currentNodeUrl !== networkNodeUrl;
          if(nodeNotAlreadyPresent && notCurrentNode )
    bitcoin.networkNodes.push(networkNodeUrl);
  });
    res.json({note : 'Bulk registration successful.'});

 });

 app.post('/transaction/broadcast', function(req, res) {
  const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  bitcoin.addTransactionToPendingTransaction(newTransaction);
  const requestPromises = [];
  bitcoin.networkNodes.forEach(networkNodeUrl =>{
   const requestOptions = {
       uri: networkNodeUrl + '/transaction',
       method : 'POST',
       body: newTransaction,
       json: true
   };
   requestPromises.push(rp(requestOptions));
  });
  promises.all(requestPromises).then(data =>{
       res.json({note : 'Transaction created and broadcast successfully'});
  });
});
app.listen(portt,()=>{
    console.log(` server is running at port ${portt}`);
});
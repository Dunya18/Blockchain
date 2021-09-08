

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/blockchain', function (req, res) {
    res.send('hello world!!');
});
app.post('/transaction', function(req, res) {
});
app.get('/mine', function(req, res) {
});
app.listen(port,()=>{
    console.log(` server is running at port ${port}`);
});
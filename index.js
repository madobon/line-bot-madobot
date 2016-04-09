var express = require('express');
var app = express();

app.post('/linebot/callback', function (req, res) {
  console.log(req.params);
  console.log(process.env.ENV_VARIABLE);
  res.send('Hello World!');
});

app.listen(80, function () {
  console.log('Example app listening on port 80!');
});

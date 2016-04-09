// http client
var request = require('request');

// express
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// line callback
app.post('/linebot/callback', function (req, res) {

  var results = req.body.result;

  results.forEach(function(result, index, array) {
    var param = {
      to: result.content.from,
      toChannel: 1383378250, // Fixed
      eventType: '138311608800106203', // Fixed
      content: result.content
    };

    var headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Line-ChannelID': process.env.LINE_CHANNEL_ID,
      'X-Line-ChannelSecret': process.env.LINE_CHANNEL_SECRET,
      'X-Line-Trusted-User-With-ACL': process.env.LINE_MID
    };

    var options = {
      url: 'https://trialbot-api.line.me/v1/events',
      method: 'POST',
      headers: headers,
      json: param
    };

    request(options, function (error, response, body) {
      if (!error) {
        console.log(response, body);
      }
    })
  });
  res.send('Hello World!');
});

app.listen(process.env.PORT, function () {
  console.log('Express server started on port %s', process.env.PORT);
});
// http client
var request = require('request');

// express
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// cheerio
var client = require('cheerio-httpcli');

client.reset();
client.setBrowser('chrome');

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// line callback
app.post('/linebot/callback', function (req, res) {

  var results = req.body.result;

  results.forEach(function(result, index, array) {
    client.fetch('http://weather.yahoo.co.jp/weather/search/', { p: result.content.text}, function (err, $, res, body) {
      var link = $('#rsltmuni a').attr('href');

      if (link) {
        client.fetch(link, {}, function(err, $, res, body) {

          var $today = $('#yjw_pinpoint_today');
          var texts = [];
          var textsArea = createAreaText($);
          Array.prototype.push.apply(texts, textsArea);
          var textsToday = createWeatherText($today, '= = = = = = = = = =', '= = = = = = = = = =');
          Array.prototype.push.apply(texts, textsToday);

          console.log(texts);

          result.content.text = texts.join('\n');

          var param = {
            to: [result.content.from],
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
          })
        });
      }

      function createAreaText($) {
        var body = []
        body.push($('title').text().match(/(.+)の天気/)[0] + '予報です。');
        return body;
      }


      function getWeather($weather) {

        var weather = '';

        switch ($weather.attr('id')) {
          case 'sunBtn':
            weather = '晴れ';
            break;
          case 'cloudsBtn':
            weather = '曇り';
            break;
          case 'rainBtn':
            weather = '雨';
            break;
          case 'snowBtn':
            weather = '雪';
            break;
          default:
            console.error('dom has changed!')
        }

        return weather
      }

      function createWeatherText($weather, prefix, suffix) {

          var weatherData = getRawWeatherData($weather.find('.yjw_table2'));

          var body = [];
          if (prefix) body.push(prefix);
          var date = $weather.find('h3 span').text()
                      .replace(' - ', '')
                      .replace(/\((.+?)\)/, '($1曜日)');

          body.push(date);

          var tempatures = [];

          Object.keys(weatherData).forEach(function(key) {

              var data = weatherData[key];
              var time = data[0].replace(/[\n\r]/g, '');
              var weather = data[1].replace(/[\n\r]/g, '');
              var tempature = data[2];
              var humidity = data[3];
              var precipitation = data[4];
              var windData = data[5].split(/[\n\r]/g);
              var windDirection = windData[0];
              var windPower = windData[1];

              // body.push(time + 'の天気は' + weather + '、気温は' + tempature + '度、湿度は' + humidity + '％、降水量は' + precipitation + 'ミリメートル、風向は' + windDirection + '、風速は' + windPower + 'メートル毎秒です。');

              if (parseInt(precipitation, 10) > 0) {
                body.push(`${time}、${weather}、気温は${tempature}度、湿度は${humidity}％、降水量は${precipitation}ミリメートルです。'`);
              } else {
                body.push(`${time}、${weather}、気温は${tempature}度、湿度は${humidity}％です。`);
              }

              tempatures.push({
                time: time,
                tempature: tempature
              });

          });

          tempatures = tempatures.sort(function(a, b){
            var x = a['tempature'];
            var y = b['tempature'];
            if (x > y) return 1;
            if (x < y) return -1;
            return 0;
          });

          if (tempatures.length > 1) {
            var minTempature = tempatures[0];
            var maxTempature = tempatures[tempatures.length - 1];

            // body.push(`最低気温は${minTempature.time}の${minTempature.tempature}度です。`);
            // body.push(`最高気温は${maxTempature.time}の${maxTempature.tempature}度です。`);
          }

          if (suffix) body.push(suffix);

          return body;
      }

      function getRawWeatherData($dataTable) {
          var weatherData = {};
          $dataTable.each(function() {
              $(this).find('tr').eq(0).each(function() {
                  $(this).find('td').each(function(i, elem) {
                      if ($(this).attr('bgcolor') === '#e9eefd') {
                          weatherData[i] = [];
                      }
                  });
              });
          });

          $dataTable.each(function() {
              $(this).find('tr').each(function() {
                  var $td = $(this).find('td');
                  Object.keys(weatherData).forEach(function(key) {
                      weatherData[key].push($td.eq(key).text());
                  });
              });
          });
          return weatherData;
      }
    });
  });
  res.send('OK');
});

var PORT = process.env.VCAP_APP_PORT || 8080;
var HOST = process.env.VCAP_APP_HOST || 'localhost';

app.listen(PORT, HOST, function () {
  console.log('Express server started on port %s', PORT);
});

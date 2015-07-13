var express = require('express');
var app = express();
var unirest = require('unirest');

app.set('view engine', 'jade');

app.get('/', function (req, res) {
    unirest.get('https://api.github.com/repos/jasonrudolph/keyboard/stargazers')
        .headers({'User-Agent': 'Unirest Node.js'})
        .end(function (data) {
            res.render('index', {title: data.body.length});
            console.log(data.body)
        });
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
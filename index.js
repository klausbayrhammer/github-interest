var express = require('express');
var unirest = require('unirest');
var async = require('async');

var app = express();
app.set('view engine', 'jade');

const username = 'klausbayrhammer';
const password = 'xxx';

app.get('/', function (req, res) {
    console.log(req.query);
    var reponame = req.query.reponame;
    if (reponame !== undefined) {
        githubApiCall('https://api.github.com/repos/' + reponame + '/stargazers', function (data) {
            var repos = {};
            var calls = [];
            data.body.forEach(function (user) {
                    calls.push(function (callback) {
                        githubApiCall('https://api.github.com/users/' + user.login + '/starred', function (data) {
                            data.body.forEach(function (repo) {
                                var repo_name = repo.full_name;
                                repos[repo_name] = (repos[repo_name] || 0) + 1;
                                console.log(user.login + repo_name);
                            });
                            callback(null, user.login);
                        });
                    })
                }
            );
            async.parallel(calls, function (err, result) {
                console.log(repos);
                res.render('index', {title: data.body.length});
            });
        });
    } else {
        console.log('No reponame defined yet');
        res.render('index');
    }
});

function githubApiCall(url, callback) {
    unirest.get(url)
        .headers({'User-Agent': 'Unirest Node.js'})
        .auth({user: username, pass: password, sendImmediately: true})
        .end(callback);
}

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
"use strict";

var express = require('express');
var unirest = require('unirest');
var async = require('async');
const _ = require('underscore');

var app = express();
app.set('view engine', 'jade');

const username = 'klausbayrhammer';
const password = process.env.github_pass;

app.get('/', (req, res) => {
    console.log(req.query);
    var reponame = req.query.reponame;
    if (reponame !== undefined) {
        githubApiCall('https://api.github.com/repos/' + reponame + '/stargazers', data =>  {
            var promises = _.map(data.body, user => {
                    return new Promise(resolve => {
                        githubApiCall('https://api.github.com/users/' + user.login + '/starred', data => {
                            var repo_names = _.map(data.body, (repo) => repo.full_name);
                            console.log(user.login);
                            resolve(repo_names);
                        });
                    });
                }
            );
            Promise.all(promises).then((values) => {
                var groupedRepoNames = _.countBy(_.flatten(values), v=>v);
                console.log(groupedRepoNames);
                res.render('index', {content: JSON.stringify(groupedRepoNames)});
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

var server = app.listen(3000,() => {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
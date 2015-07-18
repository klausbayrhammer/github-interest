"use strict";

var express = require('express');
var unirest = require('unirest');
const _ = require('underscore');
const pagingLimit = 60;
const username = process.env.github_user;
const password = process.env.github_pass;

var app = express();
app.set('view engine', 'jade');

app.use(express.static('static'));

app.get('/', (req, res) => {
    console.log(req.query);
    var reponame = req.query.reponame;
    if (reponame === undefined) {
        renderStartScreen(res);
    } else if ((reponame.match(/\//g) || []).length !== 1) {
        renderError(res, reponame, 'Malformed github repo', reponame);
    } else {
        githubApiCall(res, reponame, 'https://api.github.com/repos/' + reponame + '/stargazers?per_page=' + pagingLimit, data => {
            console.log('remaining rate limit: ' + data.headers['x-ratelimit-remaining']);
            var promises = _.map(data.body, user => {
                    return new Promise(resolve => {
                        // add paging
                        githubApiCall(res, reponame, 'https://api.github.com/users/' + user.login + '/starred?per_page=' + pagingLimit, data => {
                            var repo_names = _.map(data.body, (repo) => repo.full_name);
                            resolve(repo_names);
                        });
                    });
                }
            );
            Promise.all(promises).then((values) => {
                var groupedRepoNames = _.countBy(_.flatten(values), v=>v);
                var maxOccurence = _.max(groupedRepoNames);
                var sortedOccurences = _.sortBy(_.map(groupedRepoNames, (vals, key) => {
                    return {name: key, count: vals, percent: vals / maxOccurence * 100};
                }), 'count');
                var firstOccurencePage = sortedOccurences.reverse().slice(1, 20);
                res.render('index', {content: firstOccurencePage, searchterm: reponame});
            });
        });
    }
});

function githubApiCall(res,reponame, url, successCallback) {
    unirest.get(url)
        .headers({'User-Agent': 'Unirest Node.js'})
        .auth({user: username, pass: password, sendImmediately: true})
        .end(data => {
            if(data.status === 200) {
                successCallback(data)
            } else if(data.status === 403) {
                renderError(res, reponame, 'Rate Limit Reached')
            } else if(data.status === 404) {
                renderError(res, reponame, 'Repo ' + reponame + ' not found')
            } else {
                renderError(res, reponame, 'Error Invoking API')
            }
        });
}

function renderStartScreen(res) {
    console.log('No reponame defined yet');
    res.render('index');
}

function renderError(res, searchterm, error) {
    console.log(error);
    res.render('index', {error: error, searchterm: searchterm})
}

var server = app.listen(process.env.PORT || 3000,() => {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
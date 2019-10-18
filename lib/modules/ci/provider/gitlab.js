'use strict';

var Q = require('q'),
    request = require('request');

var Gitlab = function(config) {
    this.config = config;
};

Gitlab.prototype.getBuilds = function() {
    var promises = this.config.projects.map(function(project) {
        var baseUrl = '/projects/'+encodeURIComponent(project)+'/repository/';

        return this.get(baseUrl + 'branches/master')
            .then(function(branch) {
                return this.get(baseUrl + 'commits/' + branch.commit.id);
            }.bind(this))
            .then(function(commit) {
                return {
                    id: 'gitlab'+project,
                    name: project,
                    running: commit.status === 'running',
                    status: commit.status,
                    author: commit.author_name
                };
            });
    }.bind(this));

    return Q.all(promises);
};

Gitlab.prototype.get = function(path) {
    var options = {
        uri: this.config.url + '/api/v4' + path,
        json: true,
        headers: {
            'PRIVATE-TOKEN': this.config.token
        }
    };

    return Q.nfcall(request, options).then(function(result) {
        var response = result[0];
        var body = response.body;
        var code = parseInt(response.statusCode);

        if (code >= 200 && code < 300) {
            return body;
        }

        if ('message' in body) {
            throw new Error(body.message);
        }

        throw new Error('HTTP '+code);
    });
};

module.exports = Gitlab;

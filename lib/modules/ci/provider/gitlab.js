'use strict';

const Q = require('q');
const request = require('request');

const Gitlab = function(config) {
    this.config = config;
};

Gitlab.prototype.getBuilds = function() {
    const { projects } = this.config;

    const promises = projects.map((project) => {
        const baseUrl = '/projects/'+encodeURIComponent(project)+'/repository/';

        return this.get(baseUrl + 'branches/master')
            .then((branch) => this.get(baseUrl + 'commits/' + branch.commit.id))
            .then((commit) => {
                const { status, author_name } = commit;

                return {
                    id: 'gitlab'+project,
                    name: project,
                    running: 'running' === status,
                    status: status,
                    author: author_name
                };
            });
    });

    return Q.all(promises);
}.bind(this);

Gitlab.prototype.get = function(path) {
    const { url, token } = this.config;

    const options = {
        uri: url + '/api/v4' + path,
        json: true,
        headers: {
            'PRIVATE-TOKEN': token
        }
    };

    return Q.nfcall(request, options).then(function(result) {
        const response = result[0];
        const { body, statusCode } = response;

        const code = parseInt(statusCode);
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

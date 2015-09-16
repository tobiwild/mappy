'use strict';

var request = require('request'),
    Q = require('q'),
    _ = require('lodash'),
    parseXmlString = require('xml2js').parseString;

var JenkinsService = function(url) {
    this.url = url;
};

JenkinsService.prototype.getActiveBuildsWithDetails = function(opts) {
    opts = _.extend({
        filter: false,
        params: {}
    }, opts || {});
    return this.getActiveBuilds().then(function(builds) {
        if (opts.filter) {
            builds = _.filter(builds, opts.filter);
        }
        var promises = builds.map(function(build) {
            return this.getBuild(
                build.job,
                build.build,
                opts.params
            );
        }.bind(this));

        return Q.all(promises);
    }.bind(this));
};

JenkinsService.prototype.getActiveBuilds = function() {
    return this.get('/computer/api/xml', {
        tree: 'computer[executors[currentExecutable[url]],oneOffExecutors[currentExecutable[url]]]',
        xpath: '//url',
        wrapper: 'builds'
    }).then(function(data) {
        return Q.nfcall(parseXmlString, data);
    }).then(function(data) {
        if (! data.builds) {
            return [];
        }

        return data.builds.url.map(function(url) {
            var m = url.match(/\/([^\/]+)\/(\d+)\//);

            if (!m) {
                throw new Error('build url invalid: '+url);
            }

            return {
                job: m[1],
                build: parseInt(m[2])
            };
        });
    });
};

JenkinsService.prototype.getBuild = function(job, build, params) {
    return this.get(['job', job, build, 'api', 'json'], params)
        .then(function(data) {
            return JSON.parse(data);
        });
};

JenkinsService.prototype.get = function(path, params) {
    return this.request(path, {
        qs: params || {}
    });
};

JenkinsService.prototype.request = function(path, options) {
    if (Array.isArray(path)) {
        path = '/' + path.join('/');
    }

    options = _.extend({
        method: 'GET'
    }, options || {});

    options.uri = this.url + path;

    return Q.nfcall(request, options).then(function(result) {
        var response = result[0];
        var body = response.body;
        var code = parseInt(response.statusCode);

        if (code >= 200 && code < 300) {
            return body;
        }

        var errorMessage = 'HTTP '+code;

        throw new Error(errorMessage);
    });
};

module.exports = JenkinsService;

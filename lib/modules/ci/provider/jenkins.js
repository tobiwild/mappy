'use strict';

var Q = require('q'),
    _ = require('lodash'),
    request = require('request');

var Jenkins = function(config) {
    this.config = config;
};

Jenkins.prototype.getBuilds = function() {
    var jenkins = require('jenkins')({
        url: this.config.url,
        request: request.defaults(this.config.requestDefaults)
    });

    return Q.ninvoke(jenkins.job, 'list')
        .then(function(jobs) {
            if (this._areJobsMissing(jobs)) {
                throw new Error('jenkins jobs are missing');
            }
            return this._parseJobs(jobs);
        }.bind(this));
};

Jenkins.prototype._parseJobs = function(jobs) {
    var result = [];

    jobs.forEach(function(job) {
        if (_.find(this.config.jobs, function(jobRegexString) {
            var regex = new RegExp(jobRegexString);
            return regex.test(job.name);
        })) {
            result.push({
                id: 'jenkins'+job.name,
                name: job.name,
                running: /_anime$/.test(job.color),
                status: /^blue/.test(job.color) ? 'success' : 'failed',
                author: ''
            });

        }
    }.bind(this));

    return result;
};

Jenkins.prototype._areJobsMissing = function(jobs) {
    var result = false;

    _.each(this.config.jobs, function(jobName) {
        var job = _.find(jobs, function(job) {
            var regex = new RegExp(jobName);
            return regex.test(job.name);
        });

        if (! job) {
            result = true;
            return false;
        }
    }.bind(this));

    return result;
};

module.exports = Jenkins;

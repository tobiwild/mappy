'use strict';

var events = require('events'),
    util = require('util'),
    _ = require('lodash'),
    Q = require('q'),
    ItemEventEmitter = require('../item_event_emitter');

var JenkinsListener = function(jenkins, opts) {
    events.EventEmitter.call(this);

    this.jenkins = jenkins;
    this.opts = _.extend({
        jobs: [],
        failStates: ['red', 'red_anime', 'yellow', 'yellow_anime'],
        fetchLastBuildForFailingJobs: false,
        waitSillFailing: 3600
    }, opts);

    this.itemEventEmitter = new ItemEventEmitter({
        getItemId: function(item) {
            return item.name;
        },
        lastingEventAfter: this.opts.waitSillFailing
    });

    this.itemEventEmitter
        .on('new', function(job) {
            if (this.opts.fetchLastBuildForFailingJobs) {
                this.jenkins.build.get(job.name, 'lastFailedBuild', function(err, build) {
                    job.lastBuild = build;
                    this.emit('failure', job);
                }.bind(this));
            } else {
                this.emit('failure', job);
            }
        }.bind(this))
        .on('gone', function(job) {
            this.emit('fixed', job);
        }.bind(this))
        .on('change', function(changeSet, items) {
            this.emit('change', changeSet, items);
        }.bind(this))
        .on('allGone', function() {
            this.emit('successful');
        }.bind(this))
        .on('lasting', function(job) {
            this.emit('stillFailing', job);
        }.bind(this));
};

util.inherits(JenkinsListener, events.EventEmitter);

JenkinsListener.prototype.update = function() {
    var deferred = Q.defer();

    this.jenkins.job.list(function(err, jobs) {
        if (err) {
            deferred.reject(err);
            return;
        }

        if (this._areJobsMissing(jobs)) {
            deferred.reject(new Error('missing jobs'));
            return;
        }

        this._parseJobs(jobs);
        deferred.resolve();
    }.bind(this));

    return deferred.promise;
};

JenkinsListener.prototype._parseJobs = function(jobs) {
    jobs = _.filter(jobs, function(job) {
        return _.contains(this.opts.failStates, job.color) &&
            _.find(this.opts.jobs, function(jobRegexString) {
                var regex = new RegExp(jobRegexString);
                return regex.test(job.name);
            });
    }.bind(this));

    this.itemEventEmitter.update(jobs);
};

JenkinsListener.prototype._areJobsMissing = function(jobs) {
    var result = false;

    _.each(this.opts.jobs, function(jobName) {
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

module.exports = JenkinsListener;

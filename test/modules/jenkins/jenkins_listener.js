'use strict';

var sinon = require('sinon');
var _ = require('lodash');

var JenkinsListener = require('app/modules/jenkins/jenkins_listener');

describe('JenkinsListener', function() {

    var jenkins;
    var listener;

    var jenkinsJobList = [];

    var getCallbacks = function() {
        var events = [
            'successful',
            'failure',
            'error',
            'fixed',
            'stillFailure'
        ];

        var result = {};

        _.each(events, function(ev) {
            var cb = sinon.spy();
            listener.on(ev, cb);
            result[ev] = cb;
        });

        return result;
    };

    beforeEach(function() {
        jenkins = {
            job: {
                list: function(cb) {
                    cb(null, jenkinsJobList);
                }
            }
        };

        var opts = {
            jobs: [
                'Job1',
                'Job2',
            ],
            failStates: ['red', 'red_anime']
        };

        listener = new JenkinsListener(jenkins, opts);
    });

    it('should notify about failing jobs', function() {
        jenkinsJobList = [
            { name: 'Job1', color: 'blue' },
            { name: 'Job2', color: 'red' },
        ];

        var callback = sinon.spy();
        listener.on('failure', callback);

        listener.update();

        sinon.assert.calledOnce(callback);
        sinon.assert.calledWith(callback, jenkinsJobList[1]);
    });

    it('should also notify failure for red_anime', function() {
        jenkinsJobList = [
            { name: 'Job1', color: 'blue' },
            { name: 'Job2', color: 'red_anime' },
        ];

        var callback = sinon.spy();
        listener.on('failure', callback);

        listener.update();

        sinon.assert.calledOnce(callback);
        sinon.assert.calledWith(callback, jenkinsJobList[1]);
    });

    it('should reject promise when jobs are missing', function(done) {
        jenkinsJobList = [
            { name: 'Job2', color: 'blue' }
        ];

        listener.update().catch(function() {
            done();
        });
    });

    it('should notify only once for failing job', function() {
        jenkinsJobList = [
            { name: 'Job1', color: 'blue' },
            { name: 'Job2', color: 'red' },
        ];

        var callbacks = getCallbacks();

        listener.update();
        listener.update();

        sinon.assert.calledOnce(callbacks.failure);
        sinon.assert.notCalled(callbacks.successful);
    });

    it('should notify about fixed jobs', function() {
        jenkinsJobList = [
            { name: 'Job1', color: 'blue' },
            { name: 'Job2', color: 'red' },
        ];

        var callbacks = getCallbacks();

        listener.update();

        jenkinsJobList = [
            { name: 'Job1', color: 'blue' },
            { name: 'Job2', color: 'blue' },
        ];

        listener.update();

        sinon.assert.calledOnce(callbacks.fixed);
        sinon.assert.calledWith(callbacks.fixed, { name: 'Job2', color: 'red' });
        sinon.assert.calledOnce(callbacks.successful);
    });
});

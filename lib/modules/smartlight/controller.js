'use strict';

var JenkinsService = require('./jenkins_service'),
    ProgressMatrix = require('./progress_matrix'),
    L8 = require('l8smartlight').L8,
    _ = require('lodash'),
    config = require('app/config/smartlight.json');

function run() {
    var jenkinsService = new JenkinsService(config.jenkins.uri),
        l8 = new L8(config.l8.device, null),
        progressMatrix = new ProgressMatrix();

    function fetchProgressValues() {
        return jenkinsService.getActiveBuildsWithDetails({
            params: {
                tree: 'id,estimatedDuration,timestamp'
            },
            filter: function(build) {
                return _.includes(config.jenkins.jobs, build.job);
            }
        }).then(function(builds) {
            return _.sortBy(builds, 'timestamp').map(function(build) {
                return {
                    value: 1 - (new Date().getTime() - build.timestamp) / build.estimatedDuration,
                    id: build.id
                };
            });
        });
    }

    function refresh() {
        fetchProgressValues().then(function(values) {
            return l8.setMatrix(
                progressMatrix.getMatrix(values)
            );
        }).catch(function(error) {
            console.error(error);
        }).finally(function() {
            setTimeout(refresh, config.interval);
        });
    }

    l8.open().then(function() {
        refresh();
    }).catch(function(error) {
        console.log(error);
    });
}

module.exports = {
    run: run
};

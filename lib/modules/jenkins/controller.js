'use strict';

var JenkinsListener = require('./jenkins_listener'),
    _ = require('lodash'),
    commands = require('mappy-commands'),
    config = require('app/config/jenkins.json');

function run() {
    var request = require('request').defaults(config.requestDefaults);
    var jenkins = require('jenkins')({
        url: config.url,
        request: request
    });

    var toggleUsbPowerCommand = commands.get('ToggleUsbPowerCommand');
    var ledTextCommand = commands.get('LedTextCommand');

    var say = function(text) {
        commands.say(text);
    };

    var toggleUsbPower = function(name, mode) {
        if (! (name in config.usbDevices)) {
            return;
        }
        var params = _.clone(config.usbDevices[name]);
        params.mode = mode;
        toggleUsbPowerCommand.run(params);
    };

    var showJobsLedText = function(jobs) {
        if (! jobs.length) {
            ledTextCommand.stop();
        }

        var names = _.map(jobs, function(job) {
            return job.name.toUpperCase();
        });

        ledTextCommand.run({
            message: names.length + ' F',
            fastprint: true,
            repeat: true,
            timeout: 3000
        }).then(function() {
            ledTextCommand.run({
                message: names.join(' -- '),
                repeat: true,
                speed: 30
            });
        });
    };

    var playEventAudio = function() {
        if (config.eventAudioFile) {
            commands.play(config.eventAudioFile);
        }
    };

    var sayJobFailing = function(job, still) {
        var text = '';
        _.each(job.lastBuild.culprits, function(culprit) {
            text += 'Herr ' + culprit.fullName + ', ';
        });

        if (text) {
            say(text);
        }

        if (still) {
            say('bitte den Job' + job.name + ' endlich fixen');
        } else {
            say('bitte den Job' + job.name + ' fixen');
        }
    };

    var jenkinsListener = new JenkinsListener(jenkins, {
        jobs: config.jobs,
        fetchLastBuildForFailingJobs: true
    });

    jenkinsListener
        .on('successful', function() {
            toggleUsbPower('failing', 'off');
            say('Alle Jobs sind grün. Ihr seid die Geilsten');
        })
        .on('failure', function(job) {
            toggleUsbPower('failing', 'on');
            sayJobFailing(job);
        })
        .on('stillFailing', function(job) {
            sayJobFailing(job, true);
        })
        .on('fixed', function(job) {
            say('Der Job ' + job.name + ' wurde gefixt');
        })
        .on('change', function(changeSet, jobs) {
            playEventAudio();
            showJobsLedText(jobs);
        });

    toggleUsbPower('failing', 'off');

    jenkins.get(function(err) {
        if (err) {
            console.error('could not connect: ' + err);
            return;
        }

        runUpdate();
    });

    function runUpdate() {
        jenkinsListener.update()
            .catch(function(err) {
                console.error('update error: ' + err.message);
            })
        .finally(function() {
            setTimeout(runUpdate, config.interval);
        });
    }
}

module.exports = {
    run: run
};

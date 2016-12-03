'use strict';

var _ = require('lodash'),
    commands = require('mappy-commands'),
    config = require('app/config/ci.json'),
    Q = require('q'),
    ItemEventEmitter = require('app/item_event_emitter');

function run() {
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

        commands.runSerial('ToggleUsbPowerCommand', params);
    };

    var toggleUsbSwitch = function(name, on) {
        if (! (name in config.usbSwitch)) {
            return;
        }

        commands.runSerial('UsbSwitchCommand', {
            on: on,
            port: config.usbSwitch[name]
        });
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
        if (job.author) {
            say('Hallo ' + job.author + ', ');
        }

        if (still) {
            say('bitte den Job' + job.name + ' endlich fixen');
        } else {
            say('bitte den Job' + job.name + ' fixen');
        }
    };

    var providers = [];

    for (var provider in config.provider) {
        var ProviderModule = require('./provider/'+provider);
        providers.push(new ProviderModule(config.provider[provider]));
    }

    var failedEventEmitter = new ItemEventEmitter({
        getItemId: function(build) {
            return build.id;
        },
        filter: function(build) {
            return build.status !== 'success';
        },
        newItemFilter: function(build) {
            return build.status === 'failed';
        }
    });
    var runningEventEmitter = new ItemEventEmitter({
        getItemId: function(build) {
            return build.id;
        },
        filter: function(build) {
            return build.running;
        }
    });

    failedEventEmitter
        .on('first', function() {
            toggleUsbPower('failed', 'on');
            toggleUsbSwitch('success', 0);
            toggleUsbSwitch('failed', 1);
        })
        .on('new', function(job) {
            sayJobFailing(job);
        })
        .on('lasting', function(job) {
            sayJobFailing(job, true);
        })
        .on('gone', function(job) {
            say('Der Job ' + job.name + ' wurde gefixt');
        })
        .on('empty', function() {
            toggleUsbPower('failed', 'off');
            toggleUsbSwitch('failed', 0);
            toggleUsbSwitch('success', 1);
        })
        .on('allGone', function() {
            say('Alle Jobs sind grün. Ihr seid die Geilsten');
        })
        .on('change', function(changeSet, jobs) {
            playEventAudio();
            showJobsLedText(jobs);
        });

    runningEventEmitter
        .on('first', function() {
            toggleUsbSwitch('running', 1);
        })
        .on('empty', function() {
            toggleUsbSwitch('running', 0);
        });

    function runUpdate() {
        var promises = providers.map(function(provider) {
            return provider.getBuilds();
        });

        Q.all(promises)
            .then(function(builds) {
                return builds.reduce(function(a, b) {
                    return a.concat(b);
                }, []);
            })
            .then(function(builds) {
                runningEventEmitter.update(builds);
                failedEventEmitter.update(builds);
            })
            .catch(function(err) {
                console.error(err);
            })
            .finally(function() {
                setTimeout(runUpdate, config.interval);
            });
    }

    runUpdate();
}

module.exports = {
    run: run
};

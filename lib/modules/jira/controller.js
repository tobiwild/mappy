'use strict';

var JiraService = require('./jira_service'),
    ItemEventEmitter = require('app/item_event_emitter'),
    util = require('util'),
    commands = require('mappy-commands'),
    config = require('app/config/jira.json');

function run() {
    var jiraService = new JiraService(
        config.url,
        config.username,
        config.password
    );

    var itemEventEmitter = new ItemEventEmitter({
        getItemId: function(item) {
            return item.id;
        }
    });

    var toggleUsbPower = function(mode) {
        var params = util._extend({}, config.usbDevice);
        params.mode = mode;
        commands.get('ToggleUsbPowerCommand').run(params);
    };

    itemEventEmitter
        .on('new', function(item) {
            toggleUsbPower('loop');
            commands.play(config.audio.new);
            commands.say(item.fields.summary);
        })
        .on('gone', function(item) {
            commands.say('Supergeil, der folgende Blocker wurde behoben');
            commands.say(item.fields.summary);
        })
        .on('lasting', function(item) {
            commands.say('Könntet Ihr den folgenden Blocker endlich mal fixen');
            commands.say(item.fields.summary);
        })
        .on('allGone', function() {
            toggleUsbPower('off');
            commands.say('Bravo, bravo, alle Blocker behoben. Weiterschlafen!');
        });

    var runUpdate = function() {
        jiraService.search({
            jql: config.jql,
            fields: [
                'summary'
            ]
        })
        .then(function(response) {
            itemEventEmitter.update(response.issues);
        })
        .catch(function(error) {
            console.error(error.message);
        })
        .finally(function() {
            setTimeout(runUpdate, config.interval * 1000);
        });
    };

    toggleUsbPower('off');
    runUpdate();
}

module.exports = {
    run: run
};

'use strict';

var fs = require('fs');
var commands = require('mappy-commands');
var mappyChat = require('mappy-chat');
var mappyJenkins = require('mappy-jenkins');
var mappyCalendar = require('./lib/mappy_calendar');


function run(controller, config) {
    try {
        controller.run(config, commands);
    } catch(e) {
        console.error(e);
    }
}

fs.readFile('./config/calendar.json', function(err, data) {
    run(mappyCalendar, JSON.parse(data));
});

fs.readFile('./config/chat.json', function(err, data) {
    run(mappyChat, JSON.parse(data));
});

fs.readFile('./config/jenkins.json', function(err, data) {
    run(mappyJenkins, JSON.parse(data));
});

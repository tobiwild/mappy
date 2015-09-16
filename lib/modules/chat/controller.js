'use strict';

var mappyChat = require('mappy-chat'),
    commands = require('mappy-commands'),
    config = require('app/config/chat.json');

function run() {
    mappyChat.run(config, commands);
}

module.exports = {
    run: run
};

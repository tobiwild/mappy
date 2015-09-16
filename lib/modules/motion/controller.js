'use strict';

var SerialPort = require('serialport').SerialPort,
    RandomSelector = require('./random_selector'),
    commands = require('mappy-commands'),
    config = require('app/config/motion.json');

function run() {
    var serialPort = new SerialPort(config.devicePath);
    var randomSelector = new RandomSelector(
        config.audioFiles, config.eventChance
    );

    serialPort.on('open', function () {
        serialPort.on('data', function() {
            randomSelector.select(function(file) {
                commands.play(file);
            });
        });
    });

    serialPort.on('error', function(error) {
        console.error(error);
    });
}

module.exports = {
    run: run
};

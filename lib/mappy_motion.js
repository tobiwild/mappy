'use strict';

var SerialPort = require('serialport').SerialPort;
var RandomSelector = require('./random_selector');

function run(config, commands) {
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

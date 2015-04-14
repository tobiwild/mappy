'use strict';

var SerialPort = require('serialport').SerialPort;

function run(config, commands) {
    var serialPort = new SerialPort(config.devicePath);

    serialPort.on('open', function () {
        serialPort.on('data', function() {
            commands.play(config.eventAudioFile);
        });
    });
}

module.exports = {
    run: run
};

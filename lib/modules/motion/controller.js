const { SerialPort } = require('serialport');
const commands = require('mappy-commands');
const config = require('../../config/motion.json');
const RandomSelector = require('./random_selector');

function run() {
  const serialPort = new SerialPort(config.devicePath);
  const randomSelector = new RandomSelector(config.audioFiles, config.eventChance);

  serialPort.on('open', () => {
    serialPort.on('data', () => {
      randomSelector.select(file => {
        commands.play(file);
      });
    });
  });

  serialPort.on('error', error => {
    console.error(error);
  });
}

module.exports = {
  run
};

const _ = require('lodash');
const commands = require('mappy-commands');
const Q = require('q');
const ItemEventEmitter = require('../../item_event_emitter');
const config = require('../../config/ci.json');

function run() {
  const ledTextCommand = commands.get('LedTextCommand');

  const say = text => {
    commands.say(text);
  };

  const toggleUsbPower = (name, mode) => {
    if (!(name in config.usbDevices)) {
      return;
    }
    const params = _.clone(config.usbDevices[name]);
    params.mode = mode;

    commands.runSerial('ToggleUsbPowerCommand', params);
  };

  const toggleUsbSwitch = (name, on) => {
    if (!(name in config.usbSwitch)) {
      return;
    }

    commands.runSerial('UsbSwitchCommand', {
      on,
      port: config.usbSwitch[name]
    });
  };

  const showJobsLedText = jobs => {
    if (!jobs.length) {
      ledTextCommand.stop();
    }

    const names = _.map(jobs, ({ name }) => name.toUpperCase());

    ledTextCommand
      .run({
        message: `${names.length} F`,
        fastprint: true,
        repeat: true,
        timeout: 3000
      })
      .then(() => {
        ledTextCommand.run({
          message: names.join(' -- '),
          repeat: true,
          speed: 30
        });
      });
  };

  const playEventAudio = () => {
    if (config.eventAudioFile) {
      commands.play(config.eventAudioFile);
    }
  };

  const sayJobFailing = ({ author, name }, still) => {
    if (author) {
      say(`Hallo ${author}, `);
    }

    if (still) {
      say(`bitte den Job${name} endlich fixen`);
    } else {
      say(`bitte den Job${name} fixen`);
    }
  };

  const providers = [];

  Object.keys(config.provider).forEach(provider => {
    /* eslint-disable-next-line import/no-dynamic-require, global-require */
    const ProviderModule = require(`./provider/${provider}`);
    providers.push(new ProviderModule(config.provider[provider]));
  });

  const failedEventEmitter = new ItemEventEmitter({
    getItemId({ id }) {
      return id;
    },
    filter({ status }) {
      return status !== 'success';
    },
    newItemFilter({ status }) {
      return status === 'failed';
    }
  });
  const runningEventEmitter = new ItemEventEmitter({
    getItemId({ id }) {
      return id;
    },
    filter({ running }) {
      return running;
    }
  });

  failedEventEmitter
    .on('first', () => {
      toggleUsbPower('failed', 'on');
      toggleUsbSwitch('success', 0);
      toggleUsbSwitch('failed', 1);
    })
    .on('new', job => {
      sayJobFailing(job);
    })
    .on('lasting', job => {
      sayJobFailing(job, true);
    })
    .on('gone', ({ name }) => {
      say(`Der Job ${name} wurde gefixt`);
    })
    .on('empty', () => {
      toggleUsbPower('failed', 'off');
      toggleUsbSwitch('failed', 0);
      toggleUsbSwitch('success', 1);
    })
    .on('allGone', () => {
      say('Alle Jobs sind grün. Ihr seid die Geilsten');
    })
    .on('change', (changeSet, jobs) => {
      playEventAudio();
      showJobsLedText(jobs);
    });

  runningEventEmitter
    .on('first', () => {
      toggleUsbSwitch('running', 1);
    })
    .on('empty', () => {
      toggleUsbSwitch('running', 0);
    });

  function runUpdate() {
    const promises = providers.map(provider => provider.getBuilds());

    Q.all(promises)
      .then(builds => builds.reduce((a, b) => a.concat(b), []))
      .then(builds => {
        runningEventEmitter.update(builds);
        failedEventEmitter.update(builds);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setTimeout(runUpdate, config.interval);
      });
  }

  runUpdate();
}

module.exports = {
  run
};

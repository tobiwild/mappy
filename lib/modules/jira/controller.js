const commands = require('mappy-commands');
const config = require('../../config/jira.json');
const JiraService = require('./jira_service');
const ItemEventEmitter = require('../../item_event_emitter');

function run() {
  const jiraService = new JiraService(config.url, config.username, config.password);

  const itemEventEmitter = new ItemEventEmitter({
    getItemId({ id }) {
      return id;
    }
  });

  const toggleUsbPower = mode => {
    if (!('usbDevice' in config)) {
      return;
    }
    const params = { ...config.usbDevice };
    params.mode = mode;
    commands.get('ToggleUsbPowerCommand').run(params);
  };

  itemEventEmitter
    .on('new', ({ fields }) => {
      toggleUsbPower('loop');
      commands.play(config.audio.new);
      commands.say(fields.summary);
    })
    .on('gone', ({ fields }) => {
      commands.say('Supergeil, der folgende Blocker wurde behoben');
      commands.say(fields.summary);
    })
    .on('lasting', ({ fields }) => {
      commands.say('Könntet Ihr den folgenden Blocker endlich mal fixen');
      commands.say(fields.summary);
    })
    .on('empty', () => {
      toggleUsbPower('off');
    })
    .on('allGone', () => {
      commands.say('Bravo, bravo, alle Blocker behoben. Weiterschlafen!');
    });

  const runUpdate = () => {
    jiraService
      .search({
        jql: config.jql,
        fields: ['summary']
      })
      .then(({ issues }) => {
        itemEventEmitter.update(issues);
      })
      .catch(({ message }) => {
        console.error(message);
      })
      .finally(() => {
        setTimeout(runUpdate, config.interval * 1000);
      });
  };

  runUpdate();
}

module.exports = {
  run
};

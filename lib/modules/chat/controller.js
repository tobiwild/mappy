const commands = require('mappy-commands');
const { RTMClient, WebClient } = require('@slack/client');
const MessageManager = require('./message_manager');
const config = require('../../config/chat.json');

class ChatController {
  constructor() {
    const { slack, rules } = config;
    const { hiddenAnswer, apiToken } = slack;

    this.users = {};
    this.channels = {};
    this.hiddenAnswer = !!hiddenAnswer;

    this.messageManager = new MessageManager(rules);
    this.slackClient = new WebClient(apiToken);
    this.slackRTM = new RTMClient(apiToken);

    this.run.bind(this);
    this.handleMessage.bind(this);
    this.getChannelName.bind(this);
    this.getUserEmail.bind(this);

    this.slackRTM.start();
  }

  run() {
    this.slackRTM.on('message', async event => {
      const { user, channel, text } = event;

      if (this.users[user] === undefined) {
        this.users[user] = await this.getUserEmail(user);
      }
      const userName = this.users[user];

      if (this.channels[channel] === undefined) {
        this.channels[channel] = await this.getChannelName(channel);
      }
      const channelName = this.channels[channel];

      const data = {
        user: userName,
        room: channelName,
        // replace URLs in slack messages if message is present
        text: text ? text.replace(/<(.*\/\/.*)>/, '$1') : ''
      };

      const message = this.messageManager.getMessage(data);

      if (message) {
        this.handleMessage({
          message,
          channel,
          user
        });
      }
    });
  }

  handleMessage(options) {
    const { message, channel, user } = options;
    const command = commands.get(message.command);
    const commandReturn = command.run(message);

    if (typeof commandReturn === 'object') {
      commandReturn.then(output => {
        if (output === false) {
          return;
        }

        if (this.hiddenAnswer) {
          this.slackClient.chat
            .postEphemeral({
              channel,
              user,
              text: output
            })
            .catch(console.error);
        } else {
          this.slackRTM.sendMessage(output, channel).catch(console.error);
        }
      });
    }
  }

  getChannelName(id) {
    const params = { channel: id };

    if (id.match(/^G/)) {
      return this.slackClient.groups
        .info(params)
        .then(({ group }) => {
          this.channels[id] = group.name_normalized;
          return this.channel[id];
        })
        .catch(() => undefined);
    }

    return this.slackClient.channels
      .info(params)
      .then(({ channel }) => channel.name_normalized)
      .catch(() => undefined);
  }

  getUserEmail(id) {
    return this.slackClient.users
      .info({ user: id })
      .then(({ user }) => user.profile.email)
      .catch(() => undefined);
  }
}

const controller = new ChatController();

module.exports = controller;

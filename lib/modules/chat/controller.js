'use strict';

const commands = require('mappy-commands');
const config = require('app/config/chat.json');
const MessageManager = require('./message_manager');
const { RTMClient, WebClient } = require('@slack/client');

class ChatController {
    constructor() {
        const { slack } = config;

        this.users = {};
        this.channels = {};
        this.hiddenAnswer = !!slack.hiddenAnswer;

        this.messageManager = new MessageManager(config.rules);
        this.slackClient = new WebClient(slack.apiToken);
        this.slackRTM = new RTMClient(slack.apiToken);

        this.run.bind(this);
        this.handleMessage.bind(this);
        this.getChannelName.bind(this);
        this.getUserEmail.bind(this);

        this.slackRTM.start();
    }

    run() {
        this.slackRTM.on('message', async event => {
            const { user, channel, text } = event;

            if (!this.users.hasOwnProperty(user) && '' !== this.users[user]) {
                this.users[user] = await this.getUserEmail(user);
            }
            const userName = this.users[user];

            if (!this.channels.hasOwnProperty(channel) && '' !== this.channels[channel]) {
                this.channels[channel] = await this.getChannelName(channel);
            }
            const channelName = this.channels[channel];

            const data = {
                user: userName,
                room: channelName,
                // replace URLs in slack messages if message is present
                text: text ? text.replace(/<(.*\/\/.*)>/, '$1') : '',
            };

            const message = this.messageManager.getMessage(data);

            if (message) {
                this.handleMessage({
                    message: message,
                    channel: channel,
                    user: user
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
                if (false === output) {
                    return;
                }

                if (this.hiddenAnswer) {
                    this.slackClient.chat.postEphemeral({
                        channel: channel,
                        user: user,
                        text: output
                    }).catch(console.error);
                } else {
                    this.slackRTM.sendMessage(output, channel).catch(console.error);
                }
            });
        }
    }

    getChannelName(id) {
        const params = { channel: id };

        if (id.match(/^G/)) {
            return this.slackClient.groups.info(params)
                .then(info => this.channels[id] = info.group.name_normalized)
                .catch(() => '');

        }

        return this.slackClient.channels.info(params)
            .then(info => info.channel.name_normalized)
            .catch(() => '');
    }

    getUserEmail(id) {
        return this.slackClient.users.info({ user: id })
            .then(info => {
                return info.user.profile.email;
            })
            .catch(() => '');
    }
}

const controller = new ChatController();

module.exports = controller;

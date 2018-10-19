'use strict';

const commands = require('mappy-commands');
const config = require('app/config/chat.json');
const MessageManager = require('./message_manager');
const { RTMClient, WebClient } = require('@slack/client');

class ChatController {
    constructor() {
        this.users = {};
        this.channels = {};

        this.messageManager = new MessageManager(config.rules);
        this.slackClient = new WebClient(config.slack.apiToken);
        this.slackRTM = new RTMClient(config.slack.apiToken);

        this.run.bind(this);
        this.handleMessage.bind(this);
        this.getChannelName.bind(this);
        this.getUserEmail.bind(this);

        this.slackRTM.start();
    }

    run() {
        this.slackRTM.on('message', async event => {
            if (!this.users.hasOwnProperty(event.user) && '' !== this.users[event.user]) {
                this.users[event.user] = await this.getUserEmail(event.user);
            }
            const user = this.users[event.user];

            if (!this.channels.hasOwnProperty(event.channel) && '' !== this.channels[event.channel]) {
                this.channels[event.channel] = await this.getChannelName(event.channel);
            }
            const channel = this.channels[event.channel];

            const data = {
                user: user,
                room: channel,
                text: event.text.replace(/<(.*\/\/.*)>/, '$1'),
            };

            const message = this.messageManager.getMessage(data);

            if (message) {
                this.handleMessage({
                    message: message,
                    channel: event.channel,
                    user: event.user
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

                this.slackClient.chat.postEphemeral({
                    channel: channel,
                    user: user,
                    text: output
                }).catch(console.error);
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

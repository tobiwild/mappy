'use strict';

const commands = require("mappy-commands");
const config = require('app/config/chat.json');
const MessageManager = require('./message_manager');
const { RTMClient, WebClient } = require('@slack/client');

class ChatController {
    constructor() {
        this.messageManager = new MessageManager(config.rules);
        this.slackClient = new WebClient(config.slack.apiToken);
        this.slackRTM = new RTMClient(config.slack.apiToken);

        this.run.bind(this);
        this.handleMessage.bind(this);
        this.getChannelName.bind(this);
        this.getUserEmail.bind(this);

        this.slackRTM.start()
    }

    run() {
        this.slackRTM.on("message", async event => {
            const data = {
                user: await this.getUserEmail(event.user),
                room: await this.getChannelName(event.channel),
                text: event.text,
            };

            const message = this.messageManager.getMessage(data);

            if (message) {
                this.handleMessage(message, event.channel);
            }
        });
    }

    handleMessage(message, channel) {
        const command = commands.get(message.command);
        const commandReturn = command.run(message);

        if (typeof commandReturn === 'object') {
            commandReturn.then(output => {
                if (false === output) {
                    return;
                }

                this.slackRTM.sendMessage(output,channel).catch(error => console.log(error));
            });
        }
    }

    async getChannelName(id) {
        const params = { channel: id };
        if (id.match(/^G/)) {
            return await this.slackClient.groups.info(params)
                .then(info => info.group.name_normalized)
                .catch(() => "");

        }

        return await this.slackClient.channels.info(params)
            .then(info => info.channel.name_normalized)
            .catch(() => "");

    }

    async getUserEmail(id) {
        return await this.slackClient.users.info({ user: id })
            .then(info => {
                return info.user.profile.email;
            })
            .catch(() => '');
    }
}

const controller = new ChatController();

module.exports = controller;

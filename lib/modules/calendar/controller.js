'use strict';

const { google }= require('googleapis'),
    GoogleCalendarScheduler = require('./google_calendar_scheduler'),
    commands = require('mappy-commands'),
    config = require('app/config/calendar.json');

function run() {
    const { eventAudioFile, account, options } = config;
    const { email, keyFile } = account;

    const jwt = new google.auth.JWT(
        email,
        keyFile,
        null,
        ['https://www.googleapis.com/auth/calendar.readonly']
    );

    const calendar = google.calendar({
        version: 'v3',
        auth: jwt
    });

    const googleCalendarScheduler = new GoogleCalendarScheduler(calendar, options);

    googleCalendarScheduler.on('event', event => {
        commands.play(eventAudioFile);
        commands.say('Achtung, achtung, es findet nun statt');
        commands.say(event.summary);
    });

    jwt.authorize(() => googleCalendarScheduler.start());
}

module.exports = {
    run: run
};

'use strict';

var { google } = require('googleapis'),
    GoogleCalendarScheduler = require('./google_calendar_scheduler'),
    commands = require('mappy-commands'),
    config = require('app/config/calendar.json');

function run() {
    var oauth2Client = new google.auth.OAuth2(
      config.oauth.clientId,
      config.oauth.clientSecret
    );

    oauth2Client.setCredentials({
        refresh_token: config.oauth.refreshToken
    });

    var calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client
    });

    var googleCalendarScheduler = new GoogleCalendarScheduler(calendar, config.options);

    googleCalendarScheduler.on('event', function(ev) {
        commands.play(config.eventAudioFile);
        commands.say('Achtung, achtung, es findet nun statt');
        commands.say(ev.summary);
    });

    googleCalendarScheduler.start();
}

module.exports = {
    run: run
};

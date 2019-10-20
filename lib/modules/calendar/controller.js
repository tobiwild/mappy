const { google } = require('googleapis');
const commands = require('mappy-commands');
const config = require('../../config/calendar.json');
const GoogleCalendarScheduler = require('./google_calendar_scheduler');

function run() {
  const oauth2Client = new google.auth.OAuth2(config.oauth.clientId, config.oauth.clientSecret);

  oauth2Client.setCredentials({
    refresh_token: config.oauth.refreshToken
  });

  const calendar = google.calendar({
    version: 'v3',
    auth: oauth2Client
  });

  const googleCalendarScheduler = new GoogleCalendarScheduler(calendar, config.options);

  googleCalendarScheduler.on('event', ({ summary }) => {
    commands.play(config.eventAudioFile);
    commands.say('Achtung, achtung, es findet nun statt');
    commands.say(summary);
  });

  googleCalendarScheduler.start();
}

module.exports = {
  run
};

const commands = require('mappy-commands');
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const config = require('../../config/api.json');
const calendarConfig = require('../../config/calendar.json');

function run() {
  const api = express();

  api.use(bodyParser.json());

  // eslint-disable-next-line no-unused-vars
  api.use((err, req, res, next) => {
    if ('statusCode' in err) {
      res.status(err.statusCode).send({ error: err.message });
    } else {
      res.status(500).send({ error: 'Internal error' });
    }
  });

  api.param('command_name', (req, res, next, name) => {
    if (!(name in commands.commands)) {
      res.status(404).send({
        error: `command ${name} not available`
      });
    } else {
      req.command = commands.get(name);
      next();
    }
  });

  api.post('/command/:command_name', ({ command, body }, res) => {
    command.run(body).then(
      output => {
        res.status(200).send({ output });
      },
      output => {
        res.status(500).send({ output });
      }
    );
  });

  api.post('/say', ({ body }, res) => {
    commands.say(body.text);
    res.sendStatus(204);
  });

  api.post('/play', ({ body }, res) => {
    commands.play(body.file);
    res.sendStatus(204);
  });

  api.get('/calendar_auth', ({ headers }, res) => {
    const oauth2Client = new google.auth.OAuth2(
      calendarConfig.oauth.clientId,
      calendarConfig.oauth.clientSecret,
      `http://${headers.host}/calendar_auth_success`
    );
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events.readonly']
    });
    res.redirect(url);
  });

  api.get('/calendar_auth_success', ({ query }, res) => {
    res.send(`Add the following refresh token to lib/config/calendar.json: ${query.code}`);
  });

  api.listen(config.port);
}

module.exports = {
  run
};

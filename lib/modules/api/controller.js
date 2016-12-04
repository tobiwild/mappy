'use strict';

var commands = require('mappy-commands'),
    config = require('app/config/api.json'),
    express = require('express'),
    bodyParser = require('body-parser');

function run() {
    var api = express();

    api.use(bodyParser.json());

    // eslint-disable-next-line no-unused-vars
    api.use(function(err, req, res, next) {
        if ('statusCode' in err) {
            res.status(err.statusCode).send({error: err.message});
        } else {
            res.status(500).send({error: 'Internal error'});
        }
    });

    api.param('command_name', function(req, res, next, name) {
        if (! (name in commands.commands)) {
            res.status(404).send({error: 'command '+name+' not available'});
        } else {
            req.command = commands.get(name);
            next();
        }
    });

    api.post('/command/:command_name', function(req, res) {
        req.command.run(req.body).then(function(output) {
            res.status(200).send({output: output});
        }, function(output) {
            res.status(500).send({output: output});
        });
    });

    api.post('/say', function(req, res) {
        commands.say(req.body.text);
        res.sendStatus(204);
    });

    api.post('/play', function(req, res) {
        commands.play(req.body.file);
        res.sendStatus(204);
    });

    api.listen(config.port);
}

module.exports = {
    run: run
};

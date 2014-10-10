'use strict';

var request = require('request');
var Q = require('q');

var JiraService = function(url, username, password) {
    this.url      = url;
    this.username = username;
    this.password = password;
};

JiraService.prototype.search = function(fields) {
    return this.post('search', {}, fields);
};

JiraService.prototype.post = function(path, params, fields) {
    return this.request(path, 'POST', params, fields);
};

JiraService.prototype.get = function(path, params, fields) {
    return this.request(path, 'GET', params, fields);
};

JiraService.prototype.delete = function(path, params, fields) {
    return this.request(path, 'DELETE', params, fields);
};

JiraService.prototype.request = function(path, method, params, fields) {
    if (typeof path !== 'string') {
        path = path.join('/');
    }

    method = method || 'GET';
    params = params || {};
    fields = fields || {};

    var requestOptions = {
        rejectUnauthorized: false,
        uri: this.url + '/rest/api/2/' + path,
        auth: {
            user: this.username,
            pass: this.password
        },
        method: method,
        qs: params,
        json: fields
    };

    return Q.nfbind(request)(requestOptions).then(function(result) {
        var response = result[0];
        var body = response.body;
        var code = parseInt(response.statusCode);

        if (code >= 200 && code < 300) {
            return body;
        }

        var errorMessage = 'HTTP '+code;

        if ('errorMessages' in body) {
            errorMessage += ': ' + body.errorMessages.join(' ');
        }

        throw new Error(errorMessage);
    });
};

module.exports = JiraService;

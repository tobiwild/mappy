const request = require('request');
const Q = require('q');

class JiraService {
  constructor(url, username, password) {
    this.url = url;
    this.username = username;
    this.password = password;
  }

  search(fields) {
    return this.post('search', {}, fields);
  }

  post(path, params, fields) {
    return this.request(path, 'POST', params, fields);
  }

  get(path, params, fields) {
    return this.request(path, 'GET', params, fields);
  }

  delete(path, params, fields) {
    return this.request(path, 'DELETE', params, fields);
  }

  request(path, method, params, fields) {
    if (typeof path !== 'string') {
      path = path.join('/');
    }

    method = method || 'GET';
    params = params || {};
    fields = fields || {};

    const requestOptions = {
      rejectUnauthorized: false,
      uri: `${this.url}/rest/api/2/${path}`,
      auth: {
        user: this.username,
        pass: this.password
      },
      method,
      qs: params,
      json: fields
    };

    return Q.nfbind(request)(requestOptions).then(result => {
      const response = result[0];
      const { body } = response;
      const code = parseInt(response.statusCode, 10);

      if (code >= 200 && code < 300) {
        return body;
      }

      let errorMessage = `HTTP ${code}`;

      if ('errorMessages' in body) {
        errorMessage += `: ${body.errorMessages.join(' ')}`;
      }

      throw new Error(errorMessage);
    });
  }
}

module.exports = JiraService;

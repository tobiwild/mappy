const Q = require('q');
const request = require('request');

class Gitlab {
  constructor(config) {
    this.config = config;
  }

  getBuilds() {
    const promises = this.config.projects.map(project => {
      const baseUrl = `/projects/${encodeURIComponent(project)}/repository/`;

      return this.get(`${baseUrl}branches/master`)
        .then(({ commit }) => this.get(`${baseUrl}commits/${commit.id}`))
        .then(({ status, author_name }) => ({
          id: `gitlab${project}`,
          name: project,
          running: status === 'running',
          status,
          author: author_name
        }));
    });

    return Q.all(promises);
  }

  get(path) {
    const options = {
      uri: `${this.config.url}/api/v4${path}`,
      json: true,
      headers: {
        'PRIVATE-TOKEN': this.config.token
      }
    };

    return Q.nfcall(request, options).then(result => {
      const response = result[0];
      const { body } = response;
      const code = parseInt(response.statusCode, 10);

      if (code >= 200 && code < 300) {
        return body;
      }

      if ('message' in body) {
        throw new Error(body.message);
      }

      throw new Error(`HTTP ${code}`);
    });
  }
}

module.exports = Gitlab;

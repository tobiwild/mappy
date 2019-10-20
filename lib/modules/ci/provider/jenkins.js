const Q = require('q');
const _ = require('lodash');
const request = require('request');
const JenkinsRequest = require('jenkins');

class Jenkins {
  constructor(config) {
    this.config = config;
  }

  getBuilds() {
    const jenkins = JenkinsRequest({
      url: this.config.url,
      request: request.defaults(this.config.requestDefaults)
    });

    return Q.ninvoke(jenkins.job, 'list').then(jobs => {
      if (this.areJobsMissing(jobs)) {
        throw new Error('jenkins jobs are missing');
      }
      return this.parseJobs(jobs);
    });
  }

  parseJobs(jobs) {
    const result = [];

    jobs.forEach(({ name, color }) => {
      if (
        _.find(this.config.jobs, jobRegexString => {
          const regex = new RegExp(jobRegexString);
          return regex.test(name);
        })
      ) {
        result.push({
          id: `jenkins${name}`,
          name,
          running: /_anime$/.test(color),
          status: /^blue/.test(color) ? 'success' : 'failed',
          author: ''
        });
      }
    });

    return result;
  }

  areJobsMissing(jobs) {
    let result = false;

    _.each(this.config.jobs, jobName => {
      const job = _.find(jobs, ({ name }) => {
        const regex = new RegExp(jobName);
        return regex.test(name);
      });

      if (!job) {
        result = true;
        return false;
      }

      return true;
    });

    return result;
  }
}

module.exports = Jenkins;

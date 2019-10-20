# Mappy

[![Build Status](https://travis-ci.org/tobiwild/mappy.svg?branch=master)](https://travis-ci.org/tobiwild/mappy)
[![Dependency Status](https://david-dm.org/tobiwild/mappy.svg)](https://david-dm.org/tobiwild/mappy)
[![devDependency Status](https://david-dm.org/tobiwild/mappy/dev-status.svg)](https://david-dm.org/tobiwild/mappy#info=devDependencies)

The sheep for your office

## Modules

Mappy consists of several modules which can be enabled in `lib/config/global.json`

### CI

With the CI module, you can setup Mappy to notify about build failures. At moment the following provider are supported:

* Jenkins
* Gitlab

Mappy notifies about:

* the time a job enters fail state
* the time a job gets fixed
* a job that is still in fail state after one hour

### Jira

With the Jira module, you can setup Mappy to notify about Jira issues from a certain filter. Mappy notifies about:

* the first time, an issue is seen by the filter
* the time, an issue vanishes from the filter
* an issue which is still in the filter after one hour

### Chat

See https://github.com/tobiwild/mappy-chat

### Motion

Use some PIR motion sensor and play some random sounds when there's motion

### Calendar

With the Calendar module, you can setup Mappy to notify about Google calendar events

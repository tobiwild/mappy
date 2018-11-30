'use strict';

const events = require('events'),
    util = require('util'),
    scheduler = require('node-schedule');

const GoogleCalendarScheduler = function(calendar) {
    events.EventEmitter.call(this);

    this.calendar = calendar;
    
    this.opts = util._extend({
        calendarId: '',
        interval: 3600,
        notifyBefore: 60,
        debug: false
    }, arguments[1] || {});

    this.eventIds = {};
};

util.inherits(GoogleCalendarScheduler, events.EventEmitter);

GoogleCalendarScheduler.prototype.start = function() {
    setInterval(function() {
        this.startDate = new Date();
        this.update();
    }.bind(this), this.opts.interval * 1000);

    this.startDate = new Date();
    this.update();
};

GoogleCalendarScheduler.prototype.update = function() {
    const { debug, calendarId, notifyBefore, interval } = this.opts;

    let timeMin = this.startDate.getTime();
    timeMin += notifyBefore * 1000;

    const timeMax = timeMin + interval * 1000;

    const dateMin = (new Date(timeMin)).toISOString();
    const dateMax = (new Date(timeMax)).toISOString();

    if (debug) {
        console.log('Load events for %s between %s and %s', calendarId, dateMin, dateMax);
    }

    this.calendar.events.list({
        calendarId: calendarId,
        orderBy: 'startTime',
        singleEvents: true,
        timeMin: dateMin,
        timeMax: dateMax,
        fields: 'items(id,summary,start,end)'
    }, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }

        const { items } = result.data;

        if (debug) {
            console.log('found %d events', items.length);
        }

        for (let i=0; i < items.length; i++) {
            this._handleEvent(items[i], timeMin);
        }
    });
};

GoogleCalendarScheduler.prototype._handleEvent = function(ev, timeMin) {
    if (! ('dateTime' in ev.start)) {
        return;
    }

    if (ev.id in this.eventIds) {
        return;
    }

    const { notifyBefore, debug } = this.opts;

    let startTime = new Date(ev.start.dateTime).getTime();
    startTime -= notifyBefore * 1000;

    if (startTime < timeMin) {
        return;
    }

    this.eventIds[ev.id] = 1;

    const startDate = new Date(startTime);

    if (debug) {
        console.log('schedule event %s for %s', ev.summary, startDate);
    }

    scheduler.scheduleJob(startDate, () => {
        delete this.eventIds[ev.id];

        if (debug) {
            console.log('notify about event %s', ev.summary);
        }

        this.emit('event', ev);
    });
};

module.exports = GoogleCalendarScheduler;

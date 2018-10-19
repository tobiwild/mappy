'use strict';

const events = require('events'),
    util = require('util'),
    scheduler = require('node-schedule');

var GoogleCalendarScheduler = function(calendar) {
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
    let timeMin = this.startDate.getTime();
    timeMin += this.opts.notifyBefore * 1000;

    const timeMax = timeMin + this.opts.interval * 1000;

    const dateMin = (new Date(timeMin)).toISOString();
    const dateMax = (new Date(timeMax)).toISOString();

    if (this.opts.debug) {
        console.log('Load events for %s between %s and %s', this.opts.calendarId, dateMin, dateMax);
    }

    this.calendar.events.list({
        calendarId: this.opts.calendarId,
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

        const { data } = result;

        if (this.opts.debug) {
            console.log('found %d events', data.items.length);
        }

        for (let i=0; i<data.items.length; i++) {
            this._handleEvent(data.items[i], timeMin);
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

    let startTime = new Date(ev.start.dateTime).getTime();
    startTime -= this.opts.notifyBefore * 1000;

    if (startTime < timeMin) {
        return;
    }

    this.eventIds[ev.id] = 1;

    const startDate = new Date(startTime);

    if (this.opts.debug) {
        console.log('schedule event %s for %s', ev.summary, startDate);
    }

    scheduler.scheduleJob(startDate, () => {
        delete this.eventIds[ev.id];

        if (this.opts.debug) {
            console.log('notify about event %s', ev.summary);
        }

        this.emit('event', ev);
    });
};

module.exports = GoogleCalendarScheduler;

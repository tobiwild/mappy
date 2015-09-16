'use strict';

var events = require('events');
var util = require('util');
var scheduler = require('node-schedule');

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
    var timeMin = this.startDate.getTime();
    timeMin += this.opts.notifyBefore * 1000;

    var timeMax = timeMin + this.opts.interval * 1000;

    var dateMin = (new Date(timeMin)).toISOString();
    var dateMax = (new Date(timeMax)).toISOString();

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
    }, function(err, result) {
        if (err) {
            console.error(err);
            return;
        }

        if (this.opts.debug) {
            console.log('found %d events', result.items.length);
        }

        for (var i=0; i<result.items.length; i++) {
            this._handleEvent(result.items[i], timeMin);
        }
    }.bind(this));
};

GoogleCalendarScheduler.prototype._handleEvent = function(ev, timeMin) {
    if (ev.id in this.eventIds) {
        return;
    }

    var startDate = new Date(ev.start.dateTime);
    var startTime = startDate.getTime();

    startTime -= this.opts.notifyBefore * 1000;

    if (startTime < timeMin) {
        return;
    }

    this.eventIds[ev.id] = 1;

    if (this.opts.debug) {
        console.log('schedule event %s for %s', ev.summary, ev.start.dateTime);
    }

    scheduler.scheduleJob(new Date(startTime), function() {
        delete this.eventIds[ev.id];

        if (this.opts.debug) {
            console.log('notify about event %s', ev.summary);
        }

        this.emit('event', ev);
    }.bind(this));
};

module.exports = GoogleCalendarScheduler;

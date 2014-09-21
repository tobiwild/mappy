'use strict';

var events = require('events');
var util = require('util');
var _ = require('lodash');
var scheduler = require('node-schedule');

var GoogleCalendarScheduler = function(calendar) {
    events.EventEmitter.call(this);

    this.calendar = calendar;
    
    this.opts = _.extend({
        calendarId: '',
        interval: 3600,
        notifyBefore: 60,
        timeGap: 300,
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

    timeMin -= this.opts.timeGap * 1000;
    timeMax += this.opts.timeGap * 1000;

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
            return;
        }
        
        if (this.opts.debug) {
            console.log('found %d events', result.items.length);
        }

        _.each(result.items, function(ev) {
            if (ev.id in this.eventIds) {
                return;
            }

            this.eventIds[ev.id] = 1;

            if (this.opts.debug) {
                console.log('schedule event %s for %s', ev.summary, ev.start.dateTime);
            }
            
            scheduler.scheduleJob(new Date(ev.start.dateTime), function() {
                delete this.eventIds[ev.id];
                
                if (this.opts.debug) {
                    console.log('notify about event %s', ev.summary);
                }

                this.emit('event', ev);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

module.exports = GoogleCalendarScheduler;

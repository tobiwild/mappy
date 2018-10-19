'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire');


describe('GoogleCalendarScheduler', function() {

    var googleCalendarScheduler, calendar, scheduler,
        events, dates, calendarParams, schedulerCallbacks;


    beforeEach(function() {
        calendar = {
            events: {
                list: function(params, cb) {
                    calendarParams = params;
                    cb(null, {
                        data: {
                            items: events
                        }
                    });
                }
            }
        };

        calendarParams = null;
        dates = [];
        schedulerCallbacks = [];
        scheduler = {
            scheduleJob: function(date, cb) {
                dates.push(date);
                schedulerCallbacks.push(cb);
            },
            runCallbacks: function() {
                for (var i=0; i<schedulerCallbacks.length; i++) {
                    schedulerCallbacks[i]();
                }
            }
        };

        var GoogleCalendarScheduler = proxyquire('app/modules/calendar/google_calendar_scheduler', {
            'node-schedule': scheduler
        });

        googleCalendarScheduler = new GoogleCalendarScheduler(calendar, {
            interval: 3600,
            notifyBefore: 1800
        });
        googleCalendarScheduler.startDate = new Date('2014-09-15T08:00:00+02:00');
    });

    it('should notify on start date', function(done) {
        events = [{
            'id':'foobar',
            'summary':'Team Moa Stand-Up  ',
            'start':{'dateTime':'2014-09-15T11:40:00+02:00'},
            'end':{'dateTime':'2014-09-15T11:55:00+02:00'}
        }];

        googleCalendarScheduler.on('event', function(ev) {
            assert.equal(ev, events[0]);
            done();
        });

        googleCalendarScheduler.update();
        scheduler.runCallbacks();
        
        assert.equal(calendarParams.timeMin, '2014-09-15T06:30:00.000Z');
        assert.equal(calendarParams.timeMax, '2014-09-15T07:30:00.000Z');

        assert.equal(dates.length, 1);
        var expectedDate = new Date('2014-09-15T11:10:00+02:00');
        assert.equal(dates[0].toString(), expectedDate.toString());
    });

    it('should schedule multiple events', function() {
        events = [{
            'id':'foobar',
            'summary':'team moa stand-up  ',
            'start':{'dateTime':'2014-09-15T11:40:00+02:00'},
            'end':{'dateTime':'2014-09-15T11:55:00+02:00'}
        },{
            'id':'foobar2',
            'summary':'team moa stand-up  ',
            'start':{'dateTime':'2014-09-15T11:40:00+02:00'},
            'end':{'dateTime':'2014-09-15T11:55:00+02:00'}
        }];

        googleCalendarScheduler.update();
        googleCalendarScheduler.update();
        scheduler.runCallbacks();

        assert.equal(dates.length, 2);
    });

    it('should not schedule event with same id twice', function() {
        events = [{
            'id':'foobar',
            'summary':'Team Moa Stand-Up  ',
            'start':{'dateTime':'2014-09-15T11:40:00+02:00'},
            'end':{'dateTime':'2014-09-15T11:55:00+02:00'}
        }];

        googleCalendarScheduler.update();
        googleCalendarScheduler.update();
        scheduler.runCallbacks();

        assert.equal(dates.length, 1);
    });

    it('should schedule event with same id twice when first event already passed', function() {
        events = [{
            'id':'foobar',
            'summary':'Team Moa Stand-Up  ',
            'start':{'dateTime':'2014-09-15T11:40:00+02:00'},
            'end':{'dateTime':'2014-09-15T11:55:00+02:00'}
        }];

        googleCalendarScheduler.update();
        scheduler.runCallbacks();
        googleCalendarScheduler.update();
        scheduler.runCallbacks();

        assert.equal(dates.length, 2);
    });

    it('should not schedule events without timeDate attributes', function() {
        events = [{
            'id':'foobar',
            'summary':'Team Moa Stand-Up  ',
            'start': { 'date': '2016-01-24' },
            'end': { 'date': '2016-01-25' }
        }];

        googleCalendarScheduler.update();
        scheduler.runCallbacks();

        assert.equal(dates.length, 0);
    });


});

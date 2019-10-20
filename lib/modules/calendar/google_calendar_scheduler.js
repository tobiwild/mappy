const events = require('events');
const scheduler = require('node-schedule');

class GoogleCalendarScheduler extends events.EventEmitter {
  constructor(calendar, args = {}) {
    super();

    this.calendar = calendar;

    this.opts = {
      calendarId: '',
      interval: 3600,
      notifyBefore: 60,
      debug: false,
      ...args
    };

    this.eventIds = {};
  }

  start() {
    setInterval(() => {
      this.startDate = new Date();
      this.update();
    }, this.opts.interval * 1000);

    this.startDate = new Date();
    this.update();
  }

  update() {
    let timeMin = this.startDate.getTime();
    timeMin += this.opts.notifyBefore * 1000;

    const timeMax = timeMin + this.opts.interval * 1000;

    const dateMin = new Date(timeMin).toISOString();
    const dateMax = new Date(timeMax).toISOString();

    if (this.opts.debug) {
      console.log('Load events for %s between %s and %s', this.opts.calendarId, dateMin, dateMax);
    }

    this.calendar.events.list(
      {
        calendarId: this.opts.calendarId,
        orderBy: 'startTime',
        singleEvents: true,
        timeMin: dateMin,
        timeMax: dateMax,
        fields: 'items(id,summary,start,end)'
      },
      (err, { data }) => {
        if (err) {
          console.error(err);
          return;
        }

        const { items } = data;
        if (this.opts.debug) {
          console.log('found %d events', items.length);
        }

        for (let i = 0; i < items.length; i += 1) {
          this.handleEvent(items[i], timeMin);
        }
      }
    );
  }

  handleEvent(ev, timeMin) {
    if (!('dateTime' in ev.start)) {
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
  }
}

module.exports = GoogleCalendarScheduler;

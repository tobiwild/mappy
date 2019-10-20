class MessageManager {
  constructor(rules) {
    this.rules = rules;

    this.getMessage.bind(this);
  }

  getMessage(data) {
    for (let i = 0; i < this.rules.length; i += 1) {
      const message = this.getMessageFromRule(data, this.rules[i]);
      if (message !== false) {
        return message;
      }
    }

    return false;
  }

  static getMessageFromRule(data, { conditions, message }) {
    const vars = {};

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const field in conditions) {
      if (!(field in data)) {
        return false;
      }

      const cond = conditions[field];
      const regex = new RegExp(cond.regex, cond.modifier);

      const matches = data[field].match(regex);

      if (!matches) {
        return false;
      }

      for (let i = 1; i < matches.length; i += 1) {
        const key = field + i;
        vars[key] = matches[i];
      }
    }

    Object.keys(data).forEach(field => {
      vars[field] = data[field];
    });

    const result = {};

    const compare = (a, b) => {
      const r = vars[b];

      return typeof r === 'string' || typeof r === 'number' ? r : a;
    };

    Object.keys(message).forEach(key => {
      result[key] = message[key].replace(/{([^{}]*)}/g, compare);
    });

    return result;
  }
}

module.exports = MessageManager;

'use strict';

class MessageManager {
    constructor(rules) {
        this.rules = rules;

        this.getMessage.bind(this);
    }

    getMessage(data) {
        for (let i=0; i<this.rules.length; i++) {
            let message = this._getMessageFromRule(data, this.rules[i]);
            if (message !== false) {
                return message;
            }
        }

        return false;
    }

    _getMessageFromRule(data, rule) {
        let vars = {}, key, field;

        for (field in rule.conditions) {
            if (! (field in data)) {
                return false;
            }

            let cond  = rule.conditions[field];
            let regex = new RegExp(cond.regex, cond.modifier);

            let matches = data[field].match(regex);

            if (! matches) {
                return false;
            }

            for (let i=1; i<matches.length; i++) {
                key = field + i;

                vars[key] = matches[i];
            }
        }

        for (field in data) {
            vars[field] = data[field];
        }

        const result = {};

        const compare = function (a, b) {
            const r = vars[b];

            return typeof r === 'string' || typeof r === 'number' ? r : a;
        };

        for (key in rule.message) {
            result[key] = rule.message[key].replace(/{([^{}]*)}/g, compare);
        }

        return result;
    }
}

module.exports = MessageManager;

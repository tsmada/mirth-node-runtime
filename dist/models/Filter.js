import { Rule } from './Rule.js';
export class Filter {
    constructor() {
        this.rules = [];
    }
    getEnabledRules() {
        return this.rules.filter(rule => rule.enabled);
    }
    static fromXml(xmlObj) {
        const filter = new Filter();
        if (xmlObj && xmlObj.rules && xmlObj.rules.rule) {
            const rules = Array.isArray(xmlObj.rules.rule)
                ? xmlObj.rules.rule
                : [xmlObj.rules.rule];
            filter.rules = rules.map(Rule.fromXml);
        }
        return filter;
    }
}
//# sourceMappingURL=Filter.js.map
export var RuleOperator;
(function (RuleOperator) {
    RuleOperator["NONE"] = "NONE";
    RuleOperator["AND"] = "AND";
    RuleOperator["OR"] = "OR";
})(RuleOperator || (RuleOperator = {}));
export class Rule {
    constructor() {
        this.sequenceNumber = '0';
        this.name = '';
        this.data = new Map();
        this.type = 'JavaScript';
        this.script = '';
        this.operator = RuleOperator.NONE;
        this.enabled = true;
    }
    static fromXml(xmlObj) {
        const rule = new Rule();
        rule.sequenceNumber = xmlObj.sequenceNumber || '0';
        rule.name = xmlObj.name || '';
        rule.type = xmlObj.type || 'JavaScript';
        rule.script = xmlObj.script || '';
        rule.operator = xmlObj.operator || RuleOperator.NONE;
        rule.enabled = xmlObj.enabled !== 'false';
        // Parse data entries
        if (xmlObj.data && xmlObj.data.entry) {
            const entries = Array.isArray(xmlObj.data.entry)
                ? xmlObj.data.entry
                : [xmlObj.data.entry];
            entries.forEach((entry) => {
                if (entry.string && entry.string.length >= 2) {
                    rule.data.set(entry.string[0], entry.string[1]);
                }
            });
        }
        return rule;
    }
}
//# sourceMappingURL=Rule.js.map
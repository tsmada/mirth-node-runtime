export class Step {
    constructor() {
        this.sequenceNumber = '0';
        this.name = '';
        this.script = '';
        this.type = 'JavaScript';
        this.data = new Map();
        this.enabled = true;
    }
    static fromXml(xmlObj) {
        const step = new Step();
        step.sequenceNumber = xmlObj.sequenceNumber || '0';
        step.name = xmlObj.name || '';
        step.script = xmlObj.script || '';
        step.type = xmlObj.type || 'JavaScript';
        step.enabled = xmlObj.enabled !== 'false';
        // Parse data entries
        if (xmlObj.data && xmlObj.data.entry) {
            const entries = Array.isArray(xmlObj.data.entry)
                ? xmlObj.data.entry
                : [xmlObj.data.entry];
            entries.forEach((entry) => {
                if (entry.string && entry.string.length >= 2) {
                    step.data.set(entry.string[0], entry.string[1]);
                }
            });
        }
        return step;
    }
}
//# sourceMappingURL=Step.js.map
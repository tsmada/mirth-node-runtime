export enum RuleOperator {
  NONE = 'NONE',
  AND = 'AND',
  OR = 'OR'
}

export class Rule {
  sequenceNumber: string;
  name: string;
  data: Map<string, string>;
  type: string;
  script: string;
  operator: RuleOperator;
  enabled: boolean;

  constructor() {
    this.sequenceNumber = '0';
    this.name = '';
    this.data = new Map<string, string>();
    this.type = 'JavaScript';
    this.script = '';
    this.operator = RuleOperator.NONE;
    this.enabled = true;
  }

  static fromXml(xmlObj: any): Rule {
    const rule = new Rule();
    
    rule.sequenceNumber = xmlObj.sequenceNumber || '0';
    rule.name = xmlObj.name || '';
    rule.type = xmlObj.type || 'JavaScript';
    rule.script = xmlObj.script || '';
    rule.operator = (xmlObj.operator as RuleOperator) || RuleOperator.NONE;
    rule.enabled = xmlObj.enabled !== 'false';
    
    // Parse data entries
    if (xmlObj.data && xmlObj.data.entry) {
      const entries = Array.isArray(xmlObj.data.entry) 
        ? xmlObj.data.entry 
        : [xmlObj.data.entry];
      
      entries.forEach((entry: any) => {
        if (entry.string && entry.string.length >= 2) {
          rule.data.set(entry.string[0], entry.string[1]);
        }
      });
    }
    
    return rule;
  }
} 
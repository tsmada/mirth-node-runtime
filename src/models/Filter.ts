import { Rule } from './Rule.js';

export class Filter {
  rules: Rule[];

  constructor() {
    this.rules = [];
  }

  getEnabledRules(): Rule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  static fromXml(xmlObj: any): Filter {
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
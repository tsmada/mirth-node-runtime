import { Rule } from './Rule.js';
export declare class Filter {
    rules: Rule[];
    constructor();
    getEnabledRules(): Rule[];
    static fromXml(xmlObj: any): Filter;
}

export declare enum RuleOperator {
    NONE = "NONE",
    AND = "AND",
    OR = "OR"
}
export declare class Rule {
    sequenceNumber: string;
    name: string;
    data: Map<string, string>;
    type: string;
    script: string;
    operator: RuleOperator;
    enabled: boolean;
    constructor();
    static fromXml(xmlObj: any): Rule;
}

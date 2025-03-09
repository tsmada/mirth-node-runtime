export declare class Step {
    sequenceNumber: string;
    name: string;
    script: string;
    type: string;
    data: Map<string, string>;
    enabled: boolean;
    constructor();
    static fromXml(xmlObj: any): Step;
}

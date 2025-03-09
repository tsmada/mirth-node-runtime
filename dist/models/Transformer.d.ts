import { Step } from './Step.js';
import { DataTypeProperties } from './DataTypeProperties.js';
export declare class Transformer {
    steps: Step[];
    inboundTemplate: string;
    outboundTemplate: string;
    inboundDataType: string;
    outboundDataType: string;
    inboundProperties: DataTypeProperties | null;
    outboundProperties: DataTypeProperties | null;
    constructor();
    getEnabledSteps(): Step[];
    static fromXml(xmlObj: any): Transformer;
}

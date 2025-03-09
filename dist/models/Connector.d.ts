import { Filter } from './Filter.js';
import { Transformer } from './Transformer.js';
import { ConnectorProperties } from './ConnectorProperties.js';
export declare enum ConnectorMode {
    SOURCE = "SOURCE",
    DESTINATION = "DESTINATION"
}
export declare class Connector {
    metaDataId: number | null;
    name: string;
    properties: ConnectorProperties | null;
    transformer: Transformer;
    responseTransformer: Transformer;
    filter: Filter;
    transportName: string;
    mode: ConnectorMode;
    enabled: boolean;
    waitForPrevious: boolean;
    constructor(name: string);
    static fromXml(xmlObj: any): Connector;
}

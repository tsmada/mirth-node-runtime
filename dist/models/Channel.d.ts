import { Connector } from './Connector.js';
import { ChannelProperties } from './ChannelProperties.js';
export declare class Channel {
    id: string;
    nextMetaDataId: number;
    name: string;
    description: string;
    enabled: boolean;
    revision: number;
    sourceConnector: Connector;
    destinationConnectors: Connector[];
    preprocessingScript: string;
    postprocessingScript: string;
    deployScript: string;
    undeployScript: string;
    properties: ChannelProperties;
    constructor(id: string);
    addDestination(destinationConnector: Connector): void;
    getEnabledDestinationConnectors(): Connector[];
    static fromXml(xmlObj: any): Channel;
}

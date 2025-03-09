import { Connector } from './Connector.js';
import { ChannelProperties } from './ChannelProperties.js';

export class Channel {
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

  constructor(id: string) {
    this.id = id;
    this.nextMetaDataId = 0;
    this.name = '';
    this.description = '';
    this.enabled = true;
    this.revision = 0;
    this.sourceConnector = new Connector('sourceConnector');
    this.destinationConnectors = [];
    this.preprocessingScript = '';
    this.postprocessingScript = '';
    this.deployScript = '';
    this.undeployScript = '';
    this.properties = new ChannelProperties();
  }

  addDestination(destinationConnector: Connector): void {
    this.destinationConnectors.push(destinationConnector);
  }

  getEnabledDestinationConnectors(): Connector[] {
    return this.destinationConnectors.filter(connector => connector.enabled);
  }

  static fromXml(xmlObj: any): Channel {
    const channel = new Channel(xmlObj.id);
    channel.nextMetaDataId = parseInt(xmlObj.nextMetaDataId || '0', 10);
    channel.name = xmlObj.name || '';
    channel.description = xmlObj.description || '';
    channel.enabled = xmlObj.enabled === 'true';
    channel.revision = parseInt(xmlObj.revision || '0', 10);
    
    // Parse source connector
    if (xmlObj.sourceConnector) {
      channel.sourceConnector = Connector.fromXml(xmlObj.sourceConnector);
    }
    
    // Parse destination connectors
    if (xmlObj.destinationConnectors && xmlObj.destinationConnectors.connector) {
      const connectors = Array.isArray(xmlObj.destinationConnectors.connector) 
        ? xmlObj.destinationConnectors.connector 
        : [xmlObj.destinationConnectors.connector];
      
      channel.destinationConnectors = connectors.map(Connector.fromXml);
    }
    
    // Parse scripts
    channel.preprocessingScript = xmlObj.preprocessingScript || '';
    channel.postprocessingScript = xmlObj.postprocessingScript || '';
    channel.deployScript = xmlObj.deployScript || '';
    channel.undeployScript = xmlObj.undeployScript || '';
    
    return channel;
  }
} 
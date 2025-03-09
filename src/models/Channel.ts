import { Connector } from './Connector.js';
import { ChannelProperties } from './ChannelProperties.js';
import { XMLBuilder } from 'fast-xml-parser';
import { ConnectorMode } from '../models/Connector.js';

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

  /**
   * Convert the channel to XML
   */
  toXml(): string {
    const channelObj = {
      channel: {
        id: this.id,
        nextMetaDataId: this.nextMetaDataId.toString(),
        name: this.name,
        description: this.description,
        enabled: this.enabled ? 'true' : 'false',
        revision: this.revision.toString(),
        sourceConnector: this.connectorToObject(this.sourceConnector),
        destinationConnectors: {
          connector: this.destinationConnectors.map(conn => this.connectorToObject(conn))
        },
        preprocessingScript: this.preprocessingScript,
        postprocessingScript: this.postprocessingScript,
        deployScript: this.deployScript,
        undeployScript: this.undeployScript,
        properties: this.properties
      }
    };
    
    // Convert to XML
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: false,
      suppressEmptyNode: true
    });
    
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(channelObj);
  }
  
  /**
   * Convert a connector to a plain object for XML conversion
   */
  private connectorToObject(connector: Connector): any {
    const result: any = {
      name: connector.name,
      transportName: connector.transportName,
      mode: connector.mode === ConnectorMode.SOURCE ? 'SOURCE' : 'DESTINATION',
      enabled: connector.enabled ? 'true' : 'false',
      properties: connector.properties || {}
    };
    
    if (connector.filter && connector.filter.rules.length > 0) {
      result.filter = {
        rules: {
          rule: connector.filter.rules.map(rule => ({
            name: rule.name,
            type: rule.type,
            script: rule.script,
            enabled: rule.enabled ? 'true' : 'false'
          }))
        }
      };
    }
    
    if (connector.transformer && connector.transformer.steps.length > 0) {
      result.transformer = {
        steps: {
          step: connector.transformer.steps.map(step => ({
            name: step.name,
            type: step.type,
            script: step.script,
            enabled: step.enabled ? 'true' : 'false'
          }))
        }
      };
    }
    
    return result;
  }
} 
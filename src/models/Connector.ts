import { Filter } from './Filter.js';
import { Transformer } from './Transformer.js';
import { ConnectorProperties } from './ConnectorProperties.js';

export enum ConnectorMode {
  SOURCE = 'SOURCE',
  DESTINATION = 'DESTINATION'
}

export class Connector {
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

  constructor(name: string) {
    this.metaDataId = null;
    this.name = name;
    this.properties = null;
    this.transformer = new Transformer();
    this.responseTransformer = new Transformer();
    this.filter = new Filter();
    this.transportName = '';
    this.mode = ConnectorMode.DESTINATION;
    this.enabled = true;
    this.waitForPrevious = true;
  }

  static fromXml(xmlObj: any): Connector {
    const connector = new Connector(xmlObj.name || 'Connector');
    
    connector.metaDataId = xmlObj.metaDataId ? parseInt(xmlObj.metaDataId, 10) : null;
    connector.transportName = xmlObj.transportName || '';
    connector.mode = (xmlObj.mode === 'SOURCE') ? ConnectorMode.SOURCE : ConnectorMode.DESTINATION;
    connector.enabled = xmlObj.enabled === 'true';
    connector.waitForPrevious = xmlObj.waitForPrevious !== 'false';
    
    // Parse transformer
    if (xmlObj.transformer) {
      connector.transformer = Transformer.fromXml(xmlObj.transformer);
    }
    
    // Parse response transformer
    if (xmlObj.responseTransformer) {
      connector.responseTransformer = Transformer.fromXml(xmlObj.responseTransformer);
    }
    
    // Parse filter
    if (xmlObj.filter) {
      connector.filter = Filter.fromXml(xmlObj.filter);
    }
    
    // Parse properties - this would be connector-specific
    // For simplicity, we're just storing the raw properties object
    if (xmlObj.properties) {
      connector.properties = xmlObj.properties;
    }
    
    return connector;
  }
} 
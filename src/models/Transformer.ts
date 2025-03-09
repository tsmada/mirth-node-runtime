import { Step } from './Step.js';
import { DataTypeProperties } from './DataTypeProperties.js';

export class Transformer {
  steps: Step[];
  inboundTemplate: string;
  outboundTemplate: string;
  inboundDataType: string;
  outboundDataType: string;
  inboundProperties: DataTypeProperties | null;
  outboundProperties: DataTypeProperties | null;

  constructor() {
    this.steps = [];
    this.inboundTemplate = '';
    this.outboundTemplate = '';
    this.inboundDataType = 'HL7V2';
    this.outboundDataType = 'HL7V2';
    this.inboundProperties = null;
    this.outboundProperties = null;
  }

  getEnabledSteps(): Step[] {
    return this.steps.filter(step => step.enabled);
  }

  static fromXml(xmlObj: any): Transformer {
    const transformer = new Transformer();
    
    transformer.inboundTemplate = xmlObj.inboundTemplate || '';
    transformer.outboundTemplate = xmlObj.outboundTemplate || '';
    transformer.inboundDataType = xmlObj.inboundDataType || 'HL7V2';
    transformer.outboundDataType = xmlObj.outboundDataType || 'HL7V2';
    
    // Parse steps
    if (xmlObj.steps && xmlObj.steps.step) {
      const steps = Array.isArray(xmlObj.steps.step) 
        ? xmlObj.steps.step 
        : [xmlObj.steps.step];
      
      transformer.steps = steps.map(Step.fromXml);
    }
    
    // For simplicity, we're just storing the raw properties objects
    if (xmlObj.inboundProperties) {
      transformer.inboundProperties = xmlObj.inboundProperties;
    }
    
    if (xmlObj.outboundProperties) {
      transformer.outboundProperties = xmlObj.outboundProperties;
    }
    
    return transformer;
  }
} 
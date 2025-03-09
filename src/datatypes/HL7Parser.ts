/**
 * HL7Parser parses HL7 messages into XML format
 */
export class HL7Parser {
  /**
   * Parse an HL7 message into an XML object
   */
  static parseToXml(hl7Message: string): any {
    // Remove any MLLP frame characters
    const cleanedMessage = this.removeMllpFraming(hl7Message);
    
    // Split the message into segments
    const segments = cleanedMessage.split('\r').filter(segment => segment.trim().length > 0);
    
    // Create the XML structure
    const xmlObj: any = { HL7Message: {} };
    
    // Process each segment
    for (const segment of segments) {
      const segmentName = segment.substring(0, 3);
      const fields = segment.split('|');
      
      // Create segment object
      const segmentObj: any = {};
      
      // Process fields
      for (let i = 0; i < fields.length; i++) {
        const fieldName = `${segmentName}.${i}`;
        const fieldValue = fields[i];
        
        // Handle components
        if (fieldValue.includes('^')) {
          const components = fieldValue.split('^');
          const componentObj: any = {};
          
          for (let j = 0; j < components.length; j++) {
            componentObj[`${fieldName}.${j + 1}`] = components[j];
          }
          
          segmentObj[fieldName] = componentObj;
        } else {
          segmentObj[fieldName] = fieldValue;
        }
      }
      
      // Add segment to XML object
      xmlObj.HL7Message[segmentName] = segmentObj;
    }
    
    return xmlObj;
  }
  
  /**
   * Convert an XML object back to an HL7 message
   */
  static convertToHl7(xmlObj: any): string {
    if (!xmlObj || !xmlObj.HL7Message) {
      return '';
    }
    
    const segments: string[] = [];
    
    // Process each segment
    for (const segmentName in xmlObj.HL7Message) {
      if (Object.prototype.hasOwnProperty.call(xmlObj.HL7Message, segmentName)) {
        const segmentObj = xmlObj.HL7Message[segmentName];
        const fields: string[] = [];
        
        // Get the maximum field index
        const fieldIndices = Object.keys(segmentObj)
          .map(key => parseInt(key.split('.')[1], 10))
          .filter(index => !isNaN(index));
        
        const maxFieldIndex = Math.max(...fieldIndices, 0);
        
        // Process fields
        for (let i = 0; i <= maxFieldIndex; i++) {
          const fieldName = `${segmentName}.${i}`;
          const fieldValue = segmentObj[fieldName];
          
          if (typeof fieldValue === 'object') {
            // Handle components
            const components: string[] = [];
            
            // Get the maximum component index
            const componentIndices = Object.keys(fieldValue)
              .map(key => parseInt(key.split('.')[2], 10))
              .filter(index => !isNaN(index));
            
            const maxComponentIndex = Math.max(...componentIndices, 0);
            
            // Process components
            for (let j = 1; j <= maxComponentIndex; j++) {
              const componentName = `${fieldName}.${j}`;
              components.push(fieldValue[componentName] || '');
            }
            
            fields.push(components.join('^'));
          } else {
            fields.push(fieldValue || '');
          }
        }
        
        segments.push(fields.join('|'));
      }
    }
    
    return segments.join('\r');
  }
  
  /**
   * Remove MLLP framing characters from an HL7 message
   */
  static removeMllpFraming(message: string): string {
    // Remove leading VT (0x0B) and trailing FS (0x1C) CR (0x0D)
    return message.replace(/^\x0B/, '').replace(/\x1C\x0D$/, '');
  }
  
  /**
   * Add MLLP framing characters to an HL7 message
   */
  static addMllpFraming(message: string): string {
    // Add leading VT (0x0B) and trailing FS (0x1C) CR (0x0D)
    return `\x0B${message}\x1C\x0D`;
  }
} 
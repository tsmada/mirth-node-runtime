import { JavaScriptExecutor } from '../runtime/JavaScriptExecutor.js';
import { HL7Parser } from '../datatypes/HL7Parser.js';

describe('Mirth Node.js Runtime', () => {
  describe('JavaScriptExecutor', () => {
    let jsExecutor: JavaScriptExecutor;
    
    beforeEach(() => {
      jsExecutor = new JavaScriptExecutor();
    });
    
    test('should execute simple JavaScript', () => {
      const result = jsExecutor.execute('return 1 + 2;');
      expect(result).toBe(3);
    });
    
    test('should have access to logger', () => {
      const logSpy = jest.spyOn(console, 'log');
      jsExecutor.execute('logger.info("test");');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test'));
    });
    
    test('should have access to maps', () => {
      jsExecutor.execute('$g("test", "value");');
      const result = jsExecutor.execute('return $g("test");');
      expect(result).toBe('value');
    });
  });
  
  describe('HL7Parser', () => {
    test('should parse HL7 message to XML', () => {
      const hl7Message = 'MSH|^~\\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20240101120000||ADT^A01|123456|P|2.3\r' +
                         'PID|||12345^^^MRN||smith^john||19800101|M';
      
      const xmlObj = HL7Parser.parseToXml(hl7Message);
      
      expect(xmlObj).toBeDefined();
      expect(xmlObj.HL7Message).toBeDefined();
      expect(xmlObj.HL7Message.MSH).toBeDefined();
      expect(xmlObj.HL7Message.PID).toBeDefined();
    });
    
    test('should convert XML back to HL7', () => {
      const hl7Message = 'MSH|^~\\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20240101120000||ADT^A01|123456|P|2.3\r' +
                         'PID|||12345^^^MRN||smith^john||19800101|M';
      
      const xmlObj = HL7Parser.parseToXml(hl7Message);
      const convertedMessage = HL7Parser.convertToHl7(xmlObj);
      
      // Remove any whitespace for comparison
      const normalizedOriginal = hl7Message.replace(/\s/g, '');
      const normalizedConverted = convertedMessage.replace(/\s/g, '');
      
      expect(normalizedConverted).toContain('MSH|');
      expect(normalizedConverted).toContain('PID|');
    });
    
    test('should handle MLLP framing', () => {
      const hl7Message = 'MSH|^~\\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20240101120000||ADT^A01|123456|P|2.3';
      
      const framedMessage = HL7Parser.addMllpFraming(hl7Message);
      expect(framedMessage.charCodeAt(0)).toBe(0x0B); // VT
      expect(framedMessage.charCodeAt(framedMessage.length - 2)).toBe(0x1C); // FS
      expect(framedMessage.charCodeAt(framedMessage.length - 1)).toBe(0x0D); // CR
      
      const unframedMessage = HL7Parser.removeMllpFraming(framedMessage);
      expect(unframedMessage).toBe(hl7Message);
    });
  });
}); 
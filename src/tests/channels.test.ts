import { SampleChannel } from '../channels/SampleChannel';
import { Logger } from '../utils/Logger';

describe('SampleChannel', () => {
  const logger = new Logger();
  
  // Mock the logger to avoid console output during tests
  logger.info = jest.fn();
  logger.error = jest.fn();
  
  describe('sourceFilter', () => {
    it('should pass messages with MSH segment', () => {
      const message = {
        HL7Message: {
          MSH: {
            'MSH.1': 'Test'
          }
        }
      };
      
      const result = SampleChannel.sourceFilter!(message, logger);
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Message has MSH segment, passing filter');
    });
    
    it('should filter out messages without MSH segment', () => {
      const message = {
        HL7Message: {
          PID: {
            'PID.1': 'Test'
          }
        }
      };
      
      const result = SampleChannel.sourceFilter!(message, logger);
      expect(result).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Message does not have MSH segment, filtering out');
    });
  });
  
  describe('sourceTransformer', () => {
    it('should add a custom field to the message', () => {
      const message = {
        HL7Message: {
          MSH: {
            'MSH.1': 'Test'
          }
        }
      };
      
      const result = SampleChannel.sourceTransformer!(message, logger);
      expect(result.HL7Message.MSH['MSH.CustomField']).toBe('Processed by TypeScript Channel');
      expect(logger.info).toHaveBeenCalledWith('Transforming source message');
    });
  });
  
  describe('preprocessor', () => {
    it('should add metadata to the message', () => {
      const message = {
        HL7Message: {
          MSH: {
            'MSH.1': 'Test'
          }
        }
      };
      
      const result = SampleChannel.preprocessor!(message, logger);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.channelName).toBe('Sample TypeScript Channel');
      expect(logger.info).toHaveBeenCalledWith('Preprocessing message');
    });
  });
  
  describe('destination transformer', () => {
    it('should add a destination-specific field', () => {
      const message = {
        HL7Message: {
          MSH: {
            'MSH.1': 'Test'
          }
        }
      };
      
      const destination = SampleChannel.destinations!['Destination 1'];
      const result = destination.transformer!(message, logger);
      expect(result.HL7Message.MSH['MSH.DestinationField']).toBe('Processed for Destination 1');
      expect(logger.info).toHaveBeenCalledWith('Transforming message for destination');
    });
  });
}); 
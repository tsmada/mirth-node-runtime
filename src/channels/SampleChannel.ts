import { ChannelDefinition } from '../models/ChannelDefinition.js';
import { Logger } from '../utils/Logger.js';

/**
 * Sample channel implementation
 */
export const SampleChannel: ChannelDefinition = {
  name: 'Sample TypeScript Channel',
  description: 'A sample channel written in TypeScript',
  
  sourceFilter: (msg: any, logger: Logger): boolean => {
    if (msg.HL7Message && msg.HL7Message.MSH) {
      logger.info('Message has MSH segment, passing filter');
      return true;
    }
    
    logger.info('Message does not have MSH segment, filtering out');
    return false;
  },
  
  sourceTransformer: (msg: any, logger: Logger): any => {
    logger.info('Transforming source message');
    
    // Add a custom field to demonstrate transformation
    if (msg.HL7Message && msg.HL7Message.MSH) {
      msg.HL7Message.MSH['MSH.CustomField'] = 'Processed by TypeScript Channel';
    }
    
    return msg;
  },
  
  preprocessor: (msg: any, logger: Logger): any => {
    logger.info('Preprocessing message');
    
    // Add metadata to the message
    msg.metadata = {
      processedAt: new Date().toISOString(),
      channelName: 'Sample TypeScript Channel'
    };
    
    return msg;
  },
  
  postprocessor: (msg: any, logger: Logger): void => {
    logger.info('Postprocessing message');
    logger.info(`Message processed at: ${msg.metadata?.processedAt}`);
  },
  
  onDeploy: (logger: Logger): void => {
    logger.info('Sample TypeScript Channel deployed');
  },
  
  onUndeploy: (logger: Logger): void => {
    logger.info('Sample TypeScript Channel undeployed');
  },
  
  destinations: {
    'Destination 1': {
      filter: (msg: any, logger: Logger): boolean => {
        logger.info('Checking destination filter');
        return true;
      },
      
      transformer: (msg: any, logger: Logger): any => {
        logger.info('Transforming message for destination');
        
        // Add destination-specific field
        if (msg.HL7Message && msg.HL7Message.MSH) {
          msg.HL7Message.MSH['MSH.DestinationField'] = 'Processed for Destination 1';
        }
        
        return msg;
      }
    }
  },
  
  sourceProperties: {
    type: 'TCP Listener',
    properties: {
      listenerConnectorProperties: {
        host: '0.0.0.0',
        port: '6661'
      }
    }
  }
};

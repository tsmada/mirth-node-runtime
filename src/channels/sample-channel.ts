/**
 * Type declarations for Mirth global variables
 */
declare const logger: {
  info: (message: any) => void;
  error: (message: any) => void;
  warn: (message: any) => void;
  debug: (message: any) => void;
  trace: (message: any) => void;
};

declare const msg: any;
declare const message: any;
declare const $g: (key: string, value?: any) => any;
declare const $gc: (key: string, value?: any) => any;
declare const $c: (key: string, value?: any) => any;
declare const $co: (key: string, value?: any) => any;
declare const $r: (key: string, value?: any) => any;

/**
 * Sample Mirth Channel in TypeScript
 */
export const channel = {
  id: "sample-channel-ts",
  name: "Sample TypeScript Channel",
  description: "A sample channel created in TypeScript",
  
  /**
   * Preprocessor script
   */
  preprocessor() {
    // This script executes once when a message is received
    logger.info("Preprocessing message");
    return message;
  },
  
  /**
   * Source filter
   */
  sourceFilter() {
    if (msg['MSH'] != '') {
      logger.info('Message has MSH segment, passing filter');
      return true;
    }
    
    logger.info('Message does not have MSH segment, filtering out');
    return false;
  },
  
  /**
   * Source transformer
   */
  sourceTransformer() {
    logger.info("Transforming source message");
    logger.info(msg);
    return msg;
  },
  
  /**
   * Destination configurations
   */
  destinations: [
    {
      name: "File Writer",
      
      /**
       * Destination filter
       */
      filter() {
        logger.info("Checking destination filter");
        return true;
      },
      
      /**
       * Destination transformer
       */
      transformer() {
        logger.info("Transforming for destination");
        return msg;
      }
    }
  ],
  
  /**
   * Postprocessor script
   */
  postprocessor() {
    // This script executes once after a message has been processed
    logger.info("Postprocessing message");
    return;
  },
  
  /**
   * Deploy script
   */
  deploy() {
    // This script executes once when the channel is deployed
    logger.info("Deploying channel");
    $gc('deployTime', new Date().toISOString());
    return;
  },
  
  /**
   * Undeploy script
   */
  undeploy() {
    // This script executes once when the channel is undeployed
    logger.info("Undeploying channel");
    return;
  }
}; 
import { Logger } from '../utils/Logger.js';

/**
 * Interface for channel components written in TypeScript
 */
export interface ChannelDefinition {
  /**
   * Channel name
   */
  name: string;
  
  /**
   * Channel description
   */
  description?: string;
  
  /**
   * Source filter function
   * @param message The incoming message
   * @param logger Logger instance
   * @returns true if the message should be processed, false to filter it out
   */
  sourceFilter?: (message: any, logger: Logger) => boolean;
  
  /**
   * Source transformer function
   * @param message The incoming message
   * @param logger Logger instance
   * @returns The transformed message
   */
  sourceTransformer?: (message: any, logger: Logger) => any;
  
  /**
   * Preprocessor script
   * @param message The incoming message
   * @param logger Logger instance
   * @returns The preprocessed message
   */
  preprocessor?: (message: any, logger: Logger) => any;
  
  /**
   * Postprocessor script
   * @param message The processed message
   * @param logger Logger instance
   */
  postprocessor?: (message: any, logger: Logger) => void;
  
  /**
   * Deploy script
   * @param logger Logger instance
   */
  onDeploy?: (logger: Logger) => void;
  
  /**
   * Undeploy script
   * @param logger Logger instance
   */
  onUndeploy?: (logger: Logger) => void;
  
  /**
   * Destination connectors
   */
  destinations?: {
    [name: string]: {
      /**
       * Destination filter function
       * @param message The incoming message
       * @param logger Logger instance
       * @returns true if the message should be processed, false to filter it out
       */
      filter?: (message: any, logger: Logger) => boolean;
      
      /**
       * Destination transformer function
       * @param message The incoming message
       * @param logger Logger instance
       * @returns The transformed message
       */
      transformer?: (message: any, logger: Logger) => any;
      
      /**
       * Destination connector type
       */
      type?: string;
      
      /**
       * Destination connector properties
       */
      properties?: Record<string, any>;
    }
  };
  
  /**
   * Source connector properties
   */
  sourceProperties?: {
    /**
     * Source connector type
     */
    type?: string;
    
    /**
     * Source connector properties
     */
    properties?: Record<string, any>;
  };
} 
import { Logger } from '../utils/Logger.js';

/**
 * MirthContext provides a JavaScript execution context similar to Mirth Connect's Rhino context
 */
export class MirthContext {
  private logger: Logger;
  
  // Static maps to ensure they're shared across all instances (like Mirth's global maps)
  private static globalMap: Map<string, any> = new Map();
  private static globalChannelMap: Map<string, any> = new Map();
  
  // Channel-specific maps
  private channelMap: Map<string, any>;
  private responseMap: Map<string, any>;
  private channelId: string;
  private channelName: string;
  
  // Execution control
  private running: boolean = true;
  private instructionCount: number = 0;
  private readonly INSTRUCTION_THRESHOLD = 1000000; // Limit to prevent infinite loops
  
  constructor(channelId: string, channelName: string) {
    this.logger = new Logger();
    this.channelId = channelId;
    this.channelName = channelName;
    this.channelMap = new Map();
    this.responseMap = new Map();
  }
  
  /**
   * Get the JavaScript execution context with all required variables
   */
  getContext(message: any = null, phase: string = ''): Record<string, any> {
    const context: Record<string, any> = {
      // Logger
      logger: this.logger,
      
      // Maps
      $g: this.createMapAccessor(MirthContext.globalMap),
      $gc: this.createMapAccessor(MirthContext.globalChannelMap),
      $c: this.createMapAccessor(this.channelMap),
      $r: this.createMapAccessor(this.responseMap),
      
      // Channel info
      $co: {
        id: this.channelId,
        name: this.channelName
      },
      
      // Utility functions
      $: {
        channel: {
          id: this.channelId,
          name: this.channelName
        },
        message: message,
        phase: phase
      }
    };
    
    // Add message if provided
    if (message) {
      context.msg = message;
      context.message = message;
    }
    
    return context;
  }
  
  /**
   * Create a function to access a map with get/put semantics like Mirth
   */
  private createMapAccessor(map: Map<string, any>): (key: string, value?: any) => any {
    return (key: string, value?: any) => {
      if (value === undefined) {
        // Get operation
        return map.get(key);
      } else {
        // Put operation
        map.set(key, value);
        return value;
      }
    };
  }
  
  /**
   * Clear channel-specific maps
   */
  clearChannelMaps(): void {
    this.channelMap.clear();
    this.responseMap.clear();
  }
  
  /**
   * Clear all maps including global ones
   */
  static clearAllMaps(): void {
    MirthContext.globalMap.clear();
    MirthContext.globalChannelMap.clear();
  }
  
  /**
   * Set the running state
   */
  setRunning(running: boolean): void {
    this.running = running;
  }
  
  /**
   * Check if the context is still running
   */
  isRunning(): boolean {
    return this.running;
  }
  
  /**
   * Increment instruction count and check for threshold
   */
  incrementInstructionCount(count: number = 1): void {
    this.instructionCount += count;
    if (this.instructionCount > this.INSTRUCTION_THRESHOLD) {
      this.logger.error(`Script execution exceeded instruction threshold of ${this.INSTRUCTION_THRESHOLD}`);
      this.running = false;
      throw new Error('Script execution exceeded maximum allowed instructions');
    }
  }
  
  /**
   * Reset instruction count
   */
  resetInstructionCount(): void {
    this.instructionCount = 0;
  }
} 
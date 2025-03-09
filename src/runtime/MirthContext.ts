import { Logger } from '../utils/Logger.js';

/**
 * MirthContext represents the JavaScript execution context in Mirth Connect.
 * It provides access to global variables, maps, and utility functions.
 */
export class MirthContext {
  // Maps
  private static globalMap: Map<string, any> = new Map<string, any>();
  private static globalChannelMap: Map<string, any> = new Map<string, any>();
  private channelMap: Map<string, any>;
  private connectorMap: Map<string, any>;
  private responseMap: Map<string, any>;
  
  // Logger
  public logger: Logger;
  
  // Message data
  private message: any;
  private connectorMessage: any;
  
  constructor() {
    this.channelMap = new Map<string, any>();
    this.connectorMap = new Map<string, any>();
    this.responseMap = new Map<string, any>();
    this.logger = new Logger();
    this.message = null;
    this.connectorMessage = null;
  }
  
  /**
   * Initialize the context with a message
   */
  public initializeWithMessage(message: any, connectorMessage: any): void {
    this.message = message;
    this.connectorMessage = connectorMessage;
  }
  
  /**
   * Clear channel-specific maps
   */
  public clearChannelMaps(): void {
    this.channelMap.clear();
    this.connectorMap.clear();
    this.responseMap.clear();
  }
  
  /**
   * Get the JavaScript context object with all Mirth variables and functions
   */
  public getContext(): Record<string, any> {
    return {
      // Maps
      globalMap: this.createMapProxy(MirthContext.globalMap),
      globalChannelMap: this.createMapProxy(MirthContext.globalChannelMap),
      channelMap: this.createMapProxy(this.channelMap),
      connectorMap: this.createMapProxy(this.connectorMap),
      responseMap: this.createMapProxy(this.responseMap),
      
      // Map accessor functions
      $g: (key: string, value?: any) => this.mapAccessor(MirthContext.globalMap, key, value),
      $gc: (key: string, value?: any) => this.mapAccessor(MirthContext.globalChannelMap, key, value),
      $c: (key: string, value?: any) => this.mapAccessor(this.channelMap, key, value),
      $co: (key: string, value?: any) => this.mapAccessor(this.connectorMap, key, value),
      $r: (key: string, value?: any) => this.mapAccessor(this.responseMap, key, value),
      
      // Logger
      logger: this.logger,
      
      // Message data
      msg: this.message,
      message: this.message,
      connectorMessage: this.connectorMessage,
      
      // Utility functions
      validate: this.validate.bind(this),
      createSegment: this.createSegment.bind(this),
      createSegmentAfter: this.createSegmentAfter.bind(this),
      getArrayOrXmlLength: this.getArrayOrXmlLength.bind(this),
      
      // XML handling
      XML: this.xmlConstructor.bind(this),
      XMLList: this.xmlListConstructor.bind(this),
      
      // String conversion helpers
      new: {
        String: (value: any) => String(value),
        Boolean: (value: any) => Boolean(value),
        Number: (value: any) => Number(value)
      },
      
      // Type conversion helpers
      newStringOrUndefined: this.newStringOrUndefined.bind(this),
      newBooleanOrUndefined: this.newBooleanOrUndefined.bind(this),
      newNumberOrUndefined: this.newNumberOrUndefined.bind(this)
    };
  }
  
  /**
   * Create a proxy for a Map to make it behave like a JavaScript object
   */
  private createMapProxy(map: Map<string, any>): any {
    return new Proxy(map, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          if (prop === 'get') {
            return (key: string) => target.get(key);
          } else if (prop === 'put') {
            return (key: string, value: any) => {
              target.set(key, value);
              return value;
            };
          } else if (prop === 'clear') {
            return () => target.clear();
          } else {
            return target.get(prop);
          }
        }
        return undefined;
      },
      set: (target, prop, value) => {
        if (typeof prop === 'string') {
          target.set(prop, value);
        }
        return true;
      }
    });
  }
  
  /**
   * Map accessor function for $g, $gc, $c, $co, $r
   */
  private mapAccessor(map: Map<string, any>, key: string, value?: any): any {
    if (arguments.length === 2) {
      return map.get(key);
    } else {
      map.set(key, value);
      return value;
    }
  }
  
  /**
   * Validate function from Mirth
   */
  private validate(mapping: any, defaultValue?: any, replacement?: [string, string][]): any {
    let result = mapping;
    
    if (result === undefined || result === null || result.toString().length === 0) {
      result = defaultValue !== undefined ? defaultValue : '';
    }
    
    if (typeof result === 'string' || result instanceof String) {
      result = String(result);
      
      if (replacement !== undefined) {
        for (const [from, to] of replacement) {
          result = result.replace(new RegExp(from, 'g'), to);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Create a new XML segment
   */
  private createSegment(name: string, msgObj?: any, index?: number): any {
    if (arguments.length === 1) {
      return this.xmlConstructor(`<${name}></${name}>`);
    }
    
    if (arguments.length === 2) {
      index = 0;
    }
    
    if (!msgObj[name]) {
      msgObj[name] = [];
    }
    
    msgObj[name][index as number] = this.xmlConstructor(`<${name}></${name}>`);
    return msgObj[name][index as number];
  }
  
  /**
   * Create a segment after another segment
   */
  private createSegmentAfter(name: string, segment: any): any {
    // This is a simplified implementation
    return this.xmlConstructor(`<${name}></${name}>`);
  }
  
  /**
   * Get the length of an array or XML object
   */
  private getArrayOrXmlLength(obj: any): number {
    if (typeof obj === 'string' || (obj && typeof obj.length === 'function')) {
      return obj.length();
    } else if (obj !== undefined && obj !== null) {
      return obj.length || 0;
    }
    return 0;
  }
  
  /**
   * XML constructor function
   */
  private xmlConstructor(xml: string): any {
    // In a real implementation, this would parse XML and return an E4X-like object
    // For simplicity, we're using a basic implementation
    try {
      return { 
        _xml: xml,
        toString: () => xml,
        toXMLString: () => xml
      };
    } catch (e) {
      this.logger.error('Error creating XML: ' + e);
      return { _xml: '', toString: () => '', toXMLString: () => '' };
    }
  }
  
  /**
   * XMLList constructor function
   */
  private xmlListConstructor(): any {
    // Simplified implementation
    return [];
  }
  
  /**
   * Create a new String but leave undefined/null values alone
   */
  private newStringOrUndefined(value: any): string | undefined | null {
    if (value !== undefined && value !== null) {
      return String(value);
    }
    return value;
  }
  
  /**
   * Create a new Boolean but leave undefined/null values alone
   */
  private newBooleanOrUndefined(value: any): boolean | undefined | null {
    if (value !== undefined && value !== null) {
      return Boolean(value);
    }
    return value;
  }
  
  /**
   * Create a new Number but leave undefined/null values alone
   */
  private newNumberOrUndefined(value: any): number | undefined | null {
    if (value !== undefined && value !== null) {
      return Number(value);
    }
    return value;
  }
} 
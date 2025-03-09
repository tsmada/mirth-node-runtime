import { MirthContext } from './MirthContext.js';
import { Logger } from '../utils/Logger.js';
import { JavaScriptExecutor, JavaScriptExecutorException } from './JavaScriptExecutor.js';

/**
 * JavaScriptTask represents a task that executes JavaScript code
 * similar to Mirth Connect's JavaScriptTask
 */
export abstract class JavaScriptTask<T> {
  protected logger: Logger;
  protected channelId: string;
  protected channelName: string;
  protected metaDataId?: number;
  protected destinationName?: string;
  protected context: MirthContext;
  protected executor: JavaScriptExecutor;
  
  constructor(
    channelId: string,
    channelName: string,
    metaDataId?: number,
    destinationName?: string
  ) {
    this.logger = new Logger();
    this.channelId = channelId;
    this.channelName = channelName;
    this.metaDataId = metaDataId;
    this.destinationName = destinationName;
    this.context = new MirthContext(channelId, channelName);
    this.executor = new JavaScriptExecutor();
  }
  
  /**
   * Execute the task
   */
  public async call(): Promise<T> {
    try {
      // Reset instruction count before execution
      this.context.resetInstructionCount();
      
      // Execute the task
      return await this.doCall();
    } catch (error) {
      this.logger.error(`Error executing JavaScript task: ${error}`);
      throw new JavaScriptExecutorException(`Error executing JavaScript task: ${error}`, error);
    }
  }
  
  /**
   * Execute JavaScript code
   */
  protected executeScript(script: string, message: any = null, phase: string = ''): any {
    return this.executor.execute(script, message, this.channelId, this.channelName, phase);
  }
  
  /**
   * Abstract method to be implemented by subclasses
   */
  public abstract doCall(): Promise<T>;
}

/**
 * FilterTransformerTask executes a filter or transformer script
 */
export class FilterTransformerTask extends JavaScriptTask<any> {
  private script: string;
  private message: any;
  private isFilter: boolean;
  
  constructor(
    channelId: string,
    channelName: string,
    script: string,
    message: any,
    isFilter: boolean,
    metaDataId?: number,
    destinationName?: string
  ) {
    super(channelId, channelName, metaDataId, destinationName);
    this.script = script;
    this.message = message;
    this.isFilter = isFilter;
  }
  
  public async doCall(): Promise<any> {
    const phase = this.isFilter ? 'filter' : 'transformer';
    return this.executeScript(this.script, this.message, phase);
  }
}

/**
 * PreprocessorTask executes a preprocessor script
 */
export class PreprocessorTask extends JavaScriptTask<any> {
  private script: string;
  private message: any;
  
  constructor(
    channelId: string,
    channelName: string,
    script: string,
    message: any
  ) {
    super(channelId, channelName);
    this.script = script;
    this.message = message;
  }
  
  public async doCall(): Promise<any> {
    return this.executeScript(this.script, this.message, 'preprocessor');
  }
}

/**
 * PostprocessorTask executes a postprocessor script
 */
export class PostprocessorTask extends JavaScriptTask<any> {
  private script: string;
  private message: any;
  private response: any;
  
  constructor(
    channelId: string,
    channelName: string,
    script: string,
    message: any,
    response: any = null
  ) {
    super(channelId, channelName);
    this.script = script;
    this.message = message;
    this.response = response;
  }
  
  public async doCall(): Promise<any> {
    // Create context with message and response
    const context = this.context.getContext(this.message, 'postprocessor');
    if (this.response) {
      context.response = this.response;
    }
    
    return this.executeScript(this.script, this.message, 'postprocessor');
  }
}

/**
 * ResponseTransformerTask executes a response transformer script
 */
export class ResponseTransformerTask extends JavaScriptTask<any> {
  private script: string;
  private response: any;
  private message: any;
  
  constructor(
    channelId: string,
    channelName: string,
    script: string,
    response: any,
    message: any
  ) {
    super(channelId, channelName);
    this.script = script;
    this.response = response;
    this.message = message;
  }
  
  public async doCall(): Promise<any> {
    return this.executor.executeResponseTransformer(
      this.script,
      this.response,
      this.message,
      this.channelId,
      this.channelName
    );
  }
} 
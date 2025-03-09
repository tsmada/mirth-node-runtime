import { Logger } from '../utils/Logger.js';

/**
 * ChannelTaskHandler handles channel task events
 */
export class ChannelTaskHandler {
  protected logger: Logger;
  
  constructor() {
    this.logger = new Logger();
  }
  
  /**
   * Called when a task is started
   */
  taskStarted(channelId: string, metaDataId?: number): void {}
  
  /**
   * Called when a task is completed
   */
  taskCompleted(channelId: string, metaDataId?: number): void {}
  
  /**
   * Called when a task errors
   */
  taskErrored(channelId: string, metaDataId: number | undefined, error: Error): void {}
  
  /**
   * Called when a task is cancelled
   */
  taskCancelled(channelId: string, metaDataId: number | undefined, error: Error): void {}
}

/**
 * LoggingTaskHandler logs task events
 */
export class LoggingTaskHandler extends ChannelTaskHandler {
  /**
   * Called when a task errors
   */
  override taskErrored(channelId: string, metaDataId: number | undefined, error: Error): void {
    this.logger.error(`Task errored for channel ${channelId}: ${error.message}`);
  }
  
  /**
   * Called when a task is cancelled
   */
  override taskCancelled(channelId: string, metaDataId: number | undefined, error: Error): void {
    this.logger.warn(`Task cancelled for channel ${channelId}: ${error.message}`);
  }
}

/**
 * ErrorTaskHandler tracks errors in tasks
 */
export class ErrorTaskHandler extends LoggingTaskHandler {
  private error?: Error;
  
  /**
   * Get the error
   */
  getError(): Error | undefined {
    return this.error;
  }
  
  /**
   * Check if an error occurred
   */
  isErrored(): boolean {
    return !!this.error;
  }
  
  /**
   * Called when a task errors
   */
  override taskErrored(channelId: string, metaDataId: number | undefined, error: Error): void {
    super.taskErrored(channelId, metaDataId, error);
    this.error = error;
  }
  
  /**
   * Called when a task is cancelled
   */
  override taskCancelled(channelId: string, metaDataId: number | undefined, error: Error): void {
    super.taskCancelled(channelId, metaDataId, error);
    this.error = error;
  }
}

/**
 * ChannelTask represents a task that can be executed for a channel
 */
export abstract class ChannelTask {
  protected channelId: string;
  protected metaDataId?: number;
  protected handler?: ChannelTaskHandler;
  protected logger: Logger;
  
  constructor(channelId: string, metaDataId?: number) {
    this.channelId = channelId;
    this.metaDataId = metaDataId;
    this.logger = new Logger();
  }
  
  /**
   * Get the channel ID
   */
  getChannelId(): string {
    return this.channelId;
  }
  
  /**
   * Get the metadata ID
   */
  getMetaDataId(): number | undefined {
    return this.metaDataId;
  }
  
  /**
   * Get the handler
   */
  getHandler(): ChannelTaskHandler | undefined {
    return this.handler;
  }
  
  /**
   * Set the handler
   */
  setHandler(handler: ChannelTaskHandler): void {
    this.handler = handler;
  }
  
  /**
   * Submit the task to an executor
   */
  submitTo(executor: any): ChannelFuture {
    const future = executor.submit(this);
    return new ChannelFuture(this.channelId, this.metaDataId, future, this.handler);
  }
  
  /**
   * Execute the task
   */
  async call(): Promise<void> {
    try {
      if (this.handler) {
        this.handler.taskStarted(this.channelId, this.metaDataId);
      }
      
      await this.execute();
      
      if (this.handler) {
        this.handler.taskCompleted(this.channelId, this.metaDataId);
      }
    } catch (error) {
      if (this.handler) {
        this.handler.taskErrored(this.channelId, this.metaDataId, error as Error);
      }
      throw error;
    }
  }
} 
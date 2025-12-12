/**
 * Semaphore for concurrency control
 * Limits simultaneous video generation jobs
 */

class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next();
    }
  }

  getStatus(): { running: number; queued: number; max: number } {
    return {
      running: this.running,
      queued: this.queue.length,
      max: this.maxConcurrent,
    };
  }
}

export default Semaphore;

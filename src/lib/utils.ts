class TaskRunner {
  todoGroup: Function[] = [];
  limit: number;
  running: number = 0;
  errors: any[] = [];
  // 执行过或执行中的promise
  inprogressGroup: Promise<any>[] = [];
  constructor(limit: number) {
    this.limit = limit;
  }

  add(...task: Function[]) {
    this.todoGroup.push(...task);
  }

  private async executeTask(task: Function) {
    try {
      if (task.constructor.name === "AsyncFunction") {
        // 待执行任务本身是异步函数
        await task();
      } else {
        // 待执行任务本身是同步函数
        task();
      }
    } catch (error) {
      this.errors.push(error);
    } finally {
      this.running--;
    }
  }

  async run() {
    while (this.todoGroup.length > 0 || this.running > 0) {
      if (this.running < this.limit && this.todoGroup.length > 0) {
        const task = this.todoGroup.shift()!;
        this.running++;
        const taskPromise = this.executeTask(task);
        this.inprogressGroup.push(taskPromise);

        taskPromise.then(() => {
          this.inprogressGroup = this.inprogressGroup.filter(
            (p) => p !== taskPromise
          );
        });
      } else {
        await Promise.race(this.inprogressGroup);
      }
    }

    await Promise.all(this.inprogressGroup);

    return this.errors;
  }
}

export { TaskRunner };

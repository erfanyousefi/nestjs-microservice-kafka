import {Controller} from "@nestjs/common";
import {MessagePattern, Payload} from "@nestjs/microservices";
import {ITaskDto} from "./interface/task.interface";
import {TaskService} from "./task.service";

@Controller("task")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @MessagePattern("create_task")
  create(@Payload() taskDto: ITaskDto) {
    return this.taskService.create(taskDto);
  }
  @MessagePattern("user_tasks")
  findUserTasks(@Payload() {userId}: {userId: string}) {
    return this.taskService.findUserTask(userId);
  }
}

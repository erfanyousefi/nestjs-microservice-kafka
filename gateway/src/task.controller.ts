import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  OnModuleInit,
  Post,
  Req,
} from "@nestjs/common";
import {ClientKafka} from "@nestjs/microservices";
import {ApiConsumes, ApiTags} from "@nestjs/swagger";
import {Request} from "express";
import {Authorization} from "./decorators/auth.decorator";
import {TaskDto} from "./dto/task.dto";

@Controller("/task")
@ApiTags("Task")
export class TaskController implements OnModuleInit {
  constructor(@Inject("TASK_SERVICE") private taskClientService: ClientKafka) {}

  async onModuleInit() {
    this.taskClientService.subscribeToResponseOf("create_task");
    this.taskClientService.subscribeToResponseOf("user_tasks");
    await this.taskClientService.connect();
  }
  @Post("create")
  @ApiConsumes("application/x-www-form-urlencoded")
  @Authorization()
  async createTask(@Body() createDto: TaskDto, @Req() req: Request) {
    const response: any = await new Promise((resolve, reject) => {
      this.taskClientService
        .send("create_task", {
          title: createDto.title,
          content: createDto.content,
          userId: req.user._id,
        })
        .subscribe((data) => resolve(data));
    });
    if (response?.error) {
      throw new HttpException(response?.message, response?.status ?? 500);
    }
    return {
      message: response?.message,
      data: response?.data,
    };
  }
  @Get("user")
  @Authorization()
  async userTasks(@Req() req: Request) {
    const response: any = await new Promise((resolve, reject) => {
      this.taskClientService
        .send("user_tasks", {userId: req.user?._id})
        .subscribe((data) => resolve(data));
    });
    return response?.data ?? {tasks: []};
  }
}

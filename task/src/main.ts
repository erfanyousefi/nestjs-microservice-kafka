import {NestFactory} from "@nestjs/core";
import {KafkaOptions, Transport} from "@nestjs/microservices";
import {TaskModule} from "./task.module";

async function bootstrap() {
  const app = await NestFactory.createMicroservice(TaskModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "task",
        brokers: ["localhost:29092"],
      },
      consumer: {
        groupId: "task-consumer",
      },
    },
  } as KafkaOptions);
  await app.listen();
  console.log("task service run");
}
bootstrap();

import {NestFactory} from "@nestjs/core";
import {KafkaOptions, Transport} from "@nestjs/microservices";
import {UserModule} from "./user.module";

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "user",
        brokers: ["localhost:29092"],
      },
      consumer: {
        groupId: "user-consumer",
      },
    },
  } as KafkaOptions);
  await app.listen();
  console.log("user service is run");
}
bootstrap();

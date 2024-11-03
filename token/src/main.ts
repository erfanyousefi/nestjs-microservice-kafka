import {NestFactory} from "@nestjs/core";
import {KafkaOptions, Transport} from "@nestjs/microservices";
import {TokenModule} from "./token.module";

async function bootstrap() {
  const app = await NestFactory.createMicroservice(TokenModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "token",
        brokers: ["localhost:29092"],
      },
      consumer: {
        groupId: "token-consumer",
      },
    },
  } as KafkaOptions);
  await app.listen();
  console.log("token Service is run");
}
bootstrap();

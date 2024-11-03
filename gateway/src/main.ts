import {NestFactory} from "@nestjs/core";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {GatewayModule} from "./gateway.module";

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const options = new DocumentBuilder()
    .setTitle("NestJs-Microservice")
    .setVersion("v1")
    .addBearerAuth(
      {
        type: "http",
        bearerFormat: "JWT",
        in: "header",
        scheme: "bearer",
      },
      "Authorization"
    )
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("/", app, document);
  await app.listen(6500, () => {
    console.log("gateway: http://localhost:6500");
  });
}
bootstrap();

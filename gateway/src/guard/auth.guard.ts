import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {HttpArgumentsHost, OnModuleInit} from "@nestjs/common/interfaces";
import {ClientKafka} from "@nestjs/microservices";
import {Request} from "express";

@Injectable()
export class AuthGuard implements CanActivate, OnModuleInit {
  constructor(
    @Inject("USER_SERVICE") private userClientService: ClientKafka,
    @Inject("TOKEN_SERVICE") private tokenClientService: ClientKafka
  ) {}
  async onModuleInit() {
    this.userClientService.subscribeToResponseOf("get_user_by_id");
    this.tokenClientService.subscribeToResponseOf("verify_token");
    await Promise.all([
      this.tokenClientService.connect(),
      this.userClientService.connect(),
    ]);
  }
  async canActivate(context: ExecutionContext) {
    const httpContext: HttpArgumentsHost = context.switchToHttp();
    const request: Request = httpContext.getRequest();
    const {authorization = undefined} = request?.headers;
    if (!authorization)
      throw new UnauthorizedException("authorization header is required");
    const [bearer, token] = authorization?.split(" ");
    if (!bearer || bearer?.toLowerCase() !== "bearer")
      throw new UnauthorizedException("bearer token is incorrect");
    if (!token) throw new UnauthorizedException("token is required");
    const verifyTokenResponse: any = await new Promise((resolve, reject) => {
      this.tokenClientService
        .send("verify_token", {token})
        .subscribe((data) => resolve(data));
    });
    if (!verifyTokenResponse || verifyTokenResponse?.error) {
      throw new HttpException(
        verifyTokenResponse?.message,
        verifyTokenResponse?.status
      );
    }
    const {data} = verifyTokenResponse;
    if (!data || !data?.userId)
      throw new UnauthorizedException("not found user account");
    const userResponse: any = await new Promise((resolve, reject) => {
      this.userClientService
        .send("get_user_by_id", {userId: data?.userId})
        .subscribe((data) => resolve(data));
    });
    if (userResponse?.error) {
      throw new HttpException(userResponse?.message, userResponse?.status);
    }
    if (!userResponse?.data?.user) {
      throw new UnauthorizedException("not found user account");
    }
    request.user = userResponse?.data?.user;
    return true;
  }
}

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  OnModuleInit,
  Post,
  Req,
} from "@nestjs/common";
import {ClientKafka} from "@nestjs/microservices";
import {ApiConsumes, ApiTags} from "@nestjs/swagger";
import {Request} from "express";
import {lastValueFrom} from "rxjs";
import {Authorization} from "./decorators/auth.decorator";
import {LoginDto, UserSignupDto} from "./dto/user.dto";

@Controller("/user")
@ApiTags("user")
export class UserController implements OnModuleInit {
  constructor(
    @Inject("USER_SERVICE") private userClientService: ClientKafka,
    @Inject("TOKEN_SERVICE") private tokenClientService: ClientKafka
  ) {}
  async onModuleInit() {
    this.userClientService.subscribeToResponseOf("signup");
    this.userClientService.subscribeToResponseOf("login");
    this.tokenClientService.subscribeToResponseOf("token_destroy");
    this.tokenClientService.subscribeToResponseOf("create_user_token");
    await Promise.all([
      this.userClientService.connect(),
      this.tokenClientService.connect(),
    ]);
  }
  @Post("signup")
  @ApiConsumes("application/x-www-form-urlencoded")
  async signup(@Body() signupDto: UserSignupDto) {
    const response: any = await new Promise((resolve, reject) => {
      this.userClientService
        .send("signup", signupDto)
        .subscribe((data) => resolve(data));
    });
    if (response?.error) {
      throw new HttpException(response?.message, response?.status ?? 500);
    }
    if (response?.data?.userId) {
      const tokenResponse: any = await new Promise((resolve, reject) => {
        this.tokenClientService
          .send("create_user_token", {
            userId: response?.data?.userId,
          })
          .subscribe((data) => resolve(data));
      });
      if (tokenResponse?.data?.token) {
        return {
          token: tokenResponse?.data?.token,
        };
      }
    }
    throw new InternalServerErrorException("some service is missing");
  }
  @Post("login")
  @ApiConsumes("application/x-www-form-urlencoded")
  async login(@Body() loginDto: LoginDto) {
    const response: any = await new Promise((resolve, reject) => {
      this.userClientService
        .send("login", loginDto)
        .subscribe((data) => resolve(data));
    });
    if (response?.error) {
      throw new HttpException(response?.message, response?.status ?? 500);
    }
    if (response?.data?.userId) {
      const tokenResponse = await lastValueFrom(
        this.tokenClientService.send("create_user_token", {
          userId: response?.data?.userId,
        })
      );
      if (tokenResponse?.data?.token) {
        return {
          token: tokenResponse?.data?.token,
        };
      }
    }
    throw new InternalServerErrorException("some service is missing");
  }
  @Get("check-login")
  @Authorization()
  async checkLogin(@Req() req: Request) {
    return req?.user;
  }
  @Get("logout")
  @Authorization()
  async logout(@Req() req: Request) {
    const {_id} = req?.user;
    const response: any = await new Promise((resolve, reject) => {
      this.tokenClientService
        .send("token_destroy", {userId: _id})
        .subscribe((data) => resolve(data));
    });
    if (response?.error) {
      throw new HttpException(
        response?.message,
        response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    return {
      message: response?.message,
    };
  }
}

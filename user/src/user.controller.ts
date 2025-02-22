import {Controller} from "@nestjs/common";
import {MessagePattern, Payload} from "@nestjs/microservices";
import {ILogin, ISignup} from "./interface/user.interface";
import {UserService} from "./user.service";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern("signup")
  signup(@Payload() signupDto: ISignup) {
    return this.userService.signup(signupDto);
  }
  @MessagePattern("login")
  login(@Payload() loginDto: ILogin) {
    return this.userService.login(loginDto);
  }
  @MessagePattern("get_user_by_id")
  getUserById(@Payload() data: {userId: string}) {
    return this.userService.getById(data);
  }
}

// src/user/user.controller.ts

import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { 
  GetStartedDto, 
  VerifyCodeDto, 
  ResendCodeDto, 
  SignUpDto, 
  LoginDto,           
  ForgotPasswordDto,  
  AuthResponseDto 
} from './user.dto';

@Controller('api')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('get-started')
  @UsePipes(new ValidationPipe())
  async getStarted(@Body() dto: GetStartedDto): Promise<AuthResponseDto> {
    return this.userService.getStarted(dto);
  }

  @Post('verify-code')
  @UsePipes(new ValidationPipe())
  async verifyCode(@Body() dto: VerifyCodeDto): Promise<AuthResponseDto> {
    return this.userService.verifyCode(dto);
  }

  @Post('resend-code')
  @UsePipes(new ValidationPipe())
  async resendCode(@Body() dto: ResendCodeDto): Promise<AuthResponseDto> {
    return this.userService.resendCode(dto);
  }

  @Post('signup')
  @UsePipes(new ValidationPipe())
  async signup(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.userService.signUp(dto);
  }

  // 👇 NEW: Login endpoint
  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.userService.login(dto);
  }

  // 👇 NEW: Forgot password endpoint
  @Post('forgot-password')
  @UsePipes(new ValidationPipe())
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<AuthResponseDto> {
    return this.userService.forgotPassword(dto);
  }
}
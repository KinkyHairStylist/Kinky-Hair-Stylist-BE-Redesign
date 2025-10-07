import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Req,
  Res,
  Get,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserService } from './user.service';
import {
  GetStartedDto,
  VerifyCodeDto,
  ResendCodeDto,
  SignUpDto,
  LoginDto,
  ForgotPasswordDto,
  AuthResponseDto,
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

  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.userService.login(dto);

    if (result.user) {
      req.session.userId = result.user.id;
      req.session.isAuthenticated = true;
    } else {
      // Clear any existing session data if login was not successful
      req.session.userId = undefined;
      req.session.isAuthenticated = false;
    }

    return result;
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        if (err) {
          resolve({ message: 'Logout failed' });
        } else {
          res.clearCookie('connect.sid');
          resolve({ message: 'Logged out successfully' });
        }
      });
    });
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    if (!req.session.userId) {
      return { isAuthenticated: false };
    }

    const user = await this.userService.findById(req.session.userId);
    return {
      isAuthenticated: true,
      user: user ? this.userService.sanitizeUser(user) : null,
    };
  }

  @Post('forgot-password')
  @UsePipes(new ValidationPipe())
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<AuthResponseDto> {
    return this.userService.forgotPassword(dto);
  }
}

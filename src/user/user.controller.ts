// src/user/user.controller.ts

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
import { Session } from 'express-session';
import { UserService } from './user.service';
import {
  GetStartedDto,
  VerifyCodeDto,
  ResendCodeDto,
  SignUpDto,
  LoginDto,
  ResetPasswordStartDto,
  ResetPasswordVerifyDto,
  ResetPasswordFinishDto,
  AuthResponseDto,
} from './user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

interface RequestWithSession extends Request {
  session: Session & {
    userId?: string;
    isAuthenticated?: boolean;
  };
}

@ApiTags('User') // 👈 Groups all endpoints under 'User' in Swagger
@Controller('api')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('get-started')
  @ApiOperation({
    summary: 'Start authentication by sending verification code',
  })
  @ApiBody({ type: GetStartedDto })
  @ApiResponse({
    status: 201,
    description: 'Verification code sent',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async getStarted(@Body() dto: GetStartedDto): Promise<AuthResponseDto> {
    return this.userService.getStarted(dto);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Verify user email or phone with a code' })
  @ApiBody({ type: VerifyCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Verification successful',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async verifyCode(@Body() dto: VerifyCodeDto): Promise<AuthResponseDto> {
    return this.userService.verifyCode(dto);
  }

  @Post('resend-code')
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiBody({ type: ResendCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Verification code resent',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async resendCode(@Body() dto: ResendCodeDto): Promise<AuthResponseDto> {
    return this.userService.resendCode(dto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async signup(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.userService.signUp(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and start session' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async login(
    @Body() dto: LoginDto,
    @Req() req: RequestWithSession,
  ): Promise<AuthResponseDto> {
    const result = await this.userService.login(dto);

    if (result.user) {
      req.session.userId = result.user.id;
      req.session.isAuthenticated = true;
    }

    return result;
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout user and destroy session' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    return new Promise((resolve) => {
      req.session.destroy((err: any) => {
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
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user data or unauthenticated status',
  })
  async getCurrentUser(@Req() req: RequestWithSession) {
    if (!req.session.userId) {
      return { isAuthenticated: false };
    }

    const user = await this.userService.findById(req.session.userId);
    return {
      isAuthenticated: true,
      user: user ? this.userService.sanitizeUser(user) : null,
    };
  }

  // 👇 Password Reset Endpoints

  @Post('reset-password/start')
  @ApiOperation({
    summary: 'Start password reset by sending code to email/phone',
  })
  @ApiBody({ type: ResetPasswordStartDto })
  @ApiResponse({
    status: 200,
    description: 'Reset code sent',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async startResetPassword(
    @Body() dto: ResetPasswordStartDto,
  ): Promise<AuthResponseDto> {
    return this.userService.startResetPassword(dto);
  }

  @Post('reset-password/verify')
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiBody({ type: ResetPasswordVerifyDto })
  @ApiResponse({
    status: 200,
    description: 'Reset code verified',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async verifyResetCode(
    @Body() dto: ResetPasswordVerifyDto,
  ): Promise<AuthResponseDto> {
    return this.userService.verifyResetCode(dto);
  }

  @Post('reset-password/finish')
  @ApiOperation({ summary: 'Complete password reset with new password' })
  @ApiBody({ type: ResetPasswordFinishDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    type: AuthResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async finishResetPassword(
    @Body() dto: ResetPasswordFinishDto,
  ): Promise<AuthResponseDto> {
    return this.userService.finishResetPassword(dto);
  }
}

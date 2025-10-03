import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/AuthService';
import { RegisterUserDto } from '../dtos/RegisterUserDto';
import { Public } from '../decorators/public.decorator';
import { JwtAuthService } from '../services/JwtService';
import { UserDocument } from '../types/types';
import { AuthGuard } from '../guards/auth.guard';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.authService.register(registerUserDto);
    const tokens = this.jwtAuthService.generateTokens(user as UserDocument);
    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          surname: user.surname,
          phoneNumber: user.phoneNumber,
          gender: user.gender,
          isVerified: user.isVerified,
        },
        ...tokens,
      },
    };
  }
}

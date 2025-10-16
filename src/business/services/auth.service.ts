import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { PasswordUtil } from '../utils/password.util';
import { LoginDto } from '../dtos/requests/LoginDto';
import { ForgotPasswordDto } from '../dtos/requests/ForgotPasswordDto';
import { ResetPasswordDto } from '../dtos/requests/ResetPasswordDto';
import { OtpService } from './otp.service';
import { VerifyPasswordOtpDto } from '../dtos/requests/VerifyPasswordOtpDto';

// Import entities
import { UserEntity } from '../entities/user.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private refreshTokenRepository: Repository<RefreshTokenEntity>,
    private jwtService: JwtService,
    private readonly passwordUtil: PasswordUtil,
    private readonly otpService: OtpService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, phone, verificationToken } = createUserDto;

    let verifiedEmail: string;

    try {
      const payload = await this.jwtService.verifyAsync(verificationToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      if (payload.email.toLowerCase() !== email.toLowerCase()) {
        throw new BadRequestException(
          'Token email mismatch. Registration aborted.',
        );
      }
      verifiedEmail = payload.email;
    } catch (e) {
      throw new UnauthorizedException(
        `Invalid or expired verification token. Please verify your email again. ${e}`,
      );
    }

    await this.checkExistingUser(verifiedEmail, phone);
    this.passwordUtil.validatePasswordStrength(password);
    const user = await this.createUser(createUserDto);
    return await this.getTokens(user.id, user.email);
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch (e) {
      throw new UnauthorizedException(`Invalid or expired refresh token. ${e}`);
    }

    const userId = payload.sub;
    const user = await this.findOneById(userId);

    if (!user) {
      throw new UnauthorizedException('User associated with token not found.');
    }

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { userId },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalidated refresh token.');
    }

    const hashMatch = await this.passwordUtil.comparePassword(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!hashMatch) {
      await this.refreshTokenRepository.delete({ userId });
      throw new UnauthorizedException(
        'Token mismatch. All tokens for this user revoked.',
      );
    }
    await this.refreshTokenRepository.delete({ id: storedToken.id });
    return this.getTokens(user.id, user.email);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    const user = await this.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Account is not verified. Please verify your email.',
      );
    }

    const passwordMatch = await this.passwordUtil.comparePassword(
      password,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.getTokens(user.id, user.email);
  }

  private async createUser(
    createUserDto: CreateUserDto,
  ): Promise<UserEntity> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await this.passwordUtil.hashPassword(password);
    
    const user = this.userRepository.create({
      ...rest,
      password: hashedPassword,
      isVerified: true,
    });
    
    return this.userRepository.save(user);
  }

  private async checkExistingUser(email: string, phone: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.phone === phone) {
        throw new ConflictException(
          'User with this phone number already exists',
        );
      }
    }
  }

  async findOneById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isVerified: true });
  }

  async getTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '7d',
      }),
    ]);

    const tokenHash = await this.passwordUtil.hashPassword(refreshToken);
    await this.refreshTokenRepository.delete({ userId });

    const newRefreshToken = this.refreshTokenRepository.create({
      userId,
      tokenHash: tokenHash,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async requestPasswordReset(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return {
        message:
          'If a user with that email exists, an OTP code has been sent to their email.',
      };
    }

    try {
      await this.otpService.requestOtpForPasswordReset(email);
    } catch (error) {
      console.error(`Failed to generate/send OTP for ${user.email}:`, error);
    }

    return {
      message:
        'If a user with that email exists, an OTP code has been sent to their email.',
    };
  }

  async verifyPasswordOtp(
    verifyPasswordOtpDto: VerifyPasswordOtpDto,
  ): Promise<{ resetToken: string }> {
    const { email, otp } = verifyPasswordOtpDto;

    const isOtpValid = await this.otpService.verifyOtp(email, otp);

    if (!isOtpValid) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      purpose: 'password-reset',
    };
    const resetToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    await this.otpService.deleteOtp(email);

    return { resetToken };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const hashedPassword = await this.passwordUtil.hashPassword(newPassword);

    const updateResult = await this.userRepository.update(
      { id: payload.sub },
      { password: hashedPassword },
    );

    if (updateResult.affected === 0) {
      throw new NotFoundException(
        'User not found or password was not updated.',
      );
    }

    await this.refreshTokenRepository.delete({ userId: payload.sub });

    return {
      message:
        'Password has been successfully reset. Please log in with your new password.',
    };
  }
}
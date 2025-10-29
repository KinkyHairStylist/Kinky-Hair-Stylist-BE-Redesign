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
import { User } from '../../all_user_entities/user.entity';
import { RefreshToken } from '../entities/refresh.token.entity';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { LoginDto } from '../dtos/requests/LoginDto';
import { ForgotPasswordDto } from '../dtos/requests/ForgotPasswordDto';
import { ResetPasswordDto } from '../dtos/requests/ResetPasswordDto';
import { VerifyPasswordOtpDto } from '../dtos/requests/VerifyPasswordOtpDto';
import { PasswordUtil } from '../utils/password.util';
import { OtpService } from './otp.service';
import { Gender } from '../types/constants';
import { VerifyResetTokenDto } from '../dtos/requests/VerifyResetTokenDto';
import { RequestPhoneOtpDto } from '../dtos/requests/RequestPhoneOtpDto';
import { VerifyPhoneOtpDto } from '../dtos/requests/VerifyPhoneOtpDto';


export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    private readonly jwtService: JwtService,
    private readonly passwordUtil: PasswordUtil,
    private readonly otpService: OtpService,

  ) {}

  async register(createUserDto: CreateUserDto): Promise<TokenPair> {
    const { email, password, phone, verificationToken } = createUserDto;

    let verifiedEmail: string;
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(verificationToken, {
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
        `Invalid or expired verification token. ${e}`,
      );
    }

    if (createUserDto.gender) {
      const genderValue = createUserDto.gender.toUpperCase();
      if (!(genderValue in Gender)) {
        throw new BadRequestException(
          `Invalid gender value: ${createUserDto.gender}`,
        );
      }
      createUserDto.gender = Gender[genderValue as keyof typeof Gender];
    }

    await this.checkExistingUser(verifiedEmail, phone);
    this.passwordUtil.validatePasswordStrength(password);

    const user = await this.createUser(createUserDto);

    // const user = await this.userRepo.save(newUser);
    return this.getTokens(user.id, user.email);
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

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User associated with token not found.');
    }

    const storedToken = await this.refreshTokenRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalidated refresh token.');
    }

    const hashMatch = await this.passwordUtil.comparePassword(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!hashMatch) {
      await this.refreshTokenRepo.delete({ user: { id: user.id } });
      throw new UnauthorizedException('Token mismatch. All tokens revoked.');
    }

    await this.refreshTokenRepo.delete(storedToken.id);
    return this.getTokens(user.id, user.email);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;

    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'isVerified'],
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Account is not verified. Please verify your email.',
      );
    }

    if(user.isSuspended){
      throw new UnauthorizedException("user has been suspended")
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

  private async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await this.passwordUtil.hashPassword(password);

    // @ts-ignore
    const newUser = this.userRepo.create({
      ...rest,
      password: hashedPassword,
      isVerified: true,
      suspensionHistory: ".",
      isSuspended: false
    });

    // @ts-ignore
    return this.userRepo.save(newUser);
  }

  private async checkExistingUser(email: string, phoneNumber: string): Promise<void> {
    const existingUser = await this.userRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.phoneNumber === phoneNumber) {
        throw new ConflictException(
          'User with this phone number already exists',
        );
      }
    }
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userRepo.update(userId, { isVerified: true });
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
    await this.refreshTokenRepo.delete({ user: { id: userId } });

    const newRefreshToken = this.refreshTokenRepo.create({
      user: { id: userId },
      tokenHash,
    });
    await this.refreshTokenRepo.save(newRefreshToken);

    return { accessToken, refreshToken };
  }

  async requestPasswordReset(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepo.findOne({
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
      console.error(`Failed to generate/send OTP for ${email}:`, error);
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

    const user = await this.userRepo.findOne({
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

    // Remove OTP after use
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
    } catch {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const hashedPassword = await this.passwordUtil.hashPassword(newPassword);

    const result = await this.userRepo.update(payload.sub, {
      password: hashedPassword,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found or password not updated.');
    }

    await this.refreshTokenRepo.delete({ user: { id: payload.sub } });

    return {
      message:
        'Password reset successfully. Please log in with your new password.',
    };
  }


  async requestPhoneOtp(requestPhoneOtpDto: RequestPhoneOtpDto) {
    const { phone } = requestPhoneOtpDto;

    const otp = await this.otpService.generatePhoneOtp(phone);
    await this.otpService.sendPhoneSmsOtp(phone, otp);

    return {
      message: 'OTP sent successfully to your phone number.',
      phone,
    };
  }

  async verifyPhoneNumber(verifyPhoneOtpDto: VerifyPhoneOtpDto) {
    const { phoneNumber, otp } = verifyPhoneOtpDto;

    const isValid = await this.otpService.verifyPhoneOtpService(phoneNumber, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    const user = await this.userRepo.findOne({ where: { phoneNumber } });
    if (user) {
      user.isVerified = true;
      await this.userRepo.save(user);
    }

    return {
      message: 'Phone number verified successfully.',
      verified: true,
      phoneNumber,
    };
  }


async findOneById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'isVerified', 'phoneNumber'],
    });
  }
}

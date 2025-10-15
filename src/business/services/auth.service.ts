import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { PasswordUtil } from '../utils/password.util';
import { LoginDto } from '../dtos/requests/LoginDto';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh.token.schema';
import { ForgotPasswordDto } from '../dtos/requests/ForgotPasswordDto';
import { ResetPasswordDto } from '../dtos/requests/ResetPasswordDto';
import { OtpService } from './otp.service';
import { VerifyPasswordOtpDto } from '../dtos/requests/VerifyPasswordOtpDto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private readonly passwordUtil: PasswordUtil,
    private readonly otpService: OtpService
  ) {}

  async register(
    createUserDto: CreateUserDto
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, phone, verificationToken } = createUserDto;

    let verifiedEmail: string;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(verificationToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (payload.email.toLowerCase() !== email.toLowerCase()) {
        throw new BadRequestException('Token email mismatch. Registration aborted.');
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      verifiedEmail = payload.email;
    } catch (e) {
      throw new UnauthorizedException(
        `Invalid or expired verification token. Please verify your email again. ${e}`
      );
    }

    await this.checkExistingUser(verifiedEmail, phone);
    this.passwordUtil.validatePasswordStrength(password);
    const user = await this.createUser(createUserDto);
    return await this.getTokens(user._id.toString(), user.email);
  }

  async refreshTokens(
    refreshToken: string
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

    const storedToken = await this.refreshTokenModel.findOne({ user: userId });

    if (!storedToken) {
      throw new UnauthorizedException('Invalidated refresh token.');
    }

    const hashMatch = await this.passwordUtil.comparePassword(refreshToken, storedToken.tokenHash);

    if (!hashMatch) {
      await this.refreshTokenModel.deleteMany({ user: userId });
      throw new UnauthorizedException('Token mismatch. All tokens for this user revoked.');
    }
    await this.refreshTokenModel.deleteOne({ _id: storedToken._id });
    return this.getTokens(user._id.toString(), user.email);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    const user = await this.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account is not verified. Please verify your email.');
    }

    const passwordMatch = await this.passwordUtil.comparePassword(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.getTokens(user._id.toString(), user.email);
  }

  private async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await this.passwordUtil.hashPassword(password);
    const newUser = new this.userModel({
      ...rest,
      password: hashedPassword,
      isVerified: true,
    });
    return newUser.save();
  }

  private async checkExistingUser(email: string, phone: string): Promise<void> {
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.phone === phone) {
        throw new ConflictException('User with this phone number already exists');
      }
    }
  }

  async findOneById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $set: { isVerified: true } }).exec();
  }

  async getTokens(
    userId: string,
    email: string
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
    await this.refreshTokenModel.deleteMany({ user: userId });

    const newRefreshToken = new this.refreshTokenModel({
      user: userId,
      tokenHash: tokenHash,
    });
    await newRefreshToken.save();

    return {
      accessToken,
      refreshToken,
    };
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel
      .findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
      .exec();

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'If a user with that email exists, an OTP code has been sent to their email.',
      };
    }

    try {
      await this.otpService.requestOtpForPasswordReset(email);
    } catch (error) {
      console.error(`Failed to generate/send OTP for ${user.email}:`, error);
    }

    return {
      message: 'If a user with that email exists, an OTP code has been sent to their email.',
    };
  }

  // async verifyResetToken(
  //   verifyResetTokenDto: VerifyResetTokenDto,
  // ): Promise<{ message: string }> {
  //   const { token } = verifyResetTokenDto;
  //
  //   try {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const payload = await this.jwtService.verifyAsync(token, {
  //       secret: process.env.JWT_RESET_SECRET,
  //     });
  //
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     const user = await this.userModel.findById(payload.sub).exec();
  //
  //     if (!user) {
  //       throw new NotFoundException('Invalid or expired password reset token.');
  //     }
  //
  //     return { message: 'Password reset token is valid.' };
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   } catch (error) {
  //     throw new BadRequestException('Invalid or expired password reset token.');
  //   }
  // }

  async verifyPasswordOtp(
    verifyPasswordOtpDto: VerifyPasswordOtpDto
  ): Promise<{ resetToken: string }> {
    const { email, otp } = verifyPasswordOtpDto;

    const isOtpValid = await this.otpService.verifyOtp(email, otp);

    if (!isOtpValid) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const user = await this.userModel
      .findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const payload = {
      sub: user._id.toString(),
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

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const hashedPassword = await this.passwordUtil.hashPassword(newPassword);

    // 3. Update the user's password in the database
    const updateResult = await this.userModel
      .updateOne({ _id: payload.sub }, { $set: { password: hashedPassword } })
      .exec();

    if (updateResult.modifiedCount === 0) {
      throw new NotFoundException('User not found or password was not updated.');
    }

    await this.refreshTokenModel.deleteMany({ user: payload.sub }).exec();

    // try {
    //     await this.emailService.sendPasswordChangeConfirmation(user.email);
    // } catch (error) {
    //     console.error('Failed to send password change confirmation email:', error);
    // }

    return {
      message: 'Password has been successfully reset. Please log in with your new password.',
    };
  }
}

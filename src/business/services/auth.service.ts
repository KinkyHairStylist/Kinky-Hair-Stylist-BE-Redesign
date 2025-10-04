import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../dtos/requests/CreateUserDto';
import { PasswordUtil } from '../utils/password.util';
import { LoginDto } from '../dtos/requests/LoginDto';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh.token.schema';
import { ForgotPasswordDto } from '../dtos/requests/ForgotPasswordDto';
import { IEmailService } from './emailService/interfaces/i.email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private readonly passwordUtil: PasswordUtil,
    private readonly emailService: IEmailService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, phone, verificationToken } = createUserDto;

    let verifiedEmail: string;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(verificationToken, {
        secret: process.env.JWT_VERIFICATION_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (payload.email.toLowerCase() !== email.toLowerCase()) {
        throw new BadRequestException(
          'Token email mismatch. Registration aborted.',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      verifiedEmail = payload.email;
    } catch (e) {
      throw new UnauthorizedException(
        `Invalid or expired verification token. Please verify your email again. ${e}`,
      );
    }

    await this.checkExistingUser(verifiedEmail, phone);
    this.passwordUtil.validatePasswordStrength(password);
    const user = await this.createUser(createUserDto);
    return await this.getTokens(user._id.toString(), user.email);
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
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

    const hashMatch = await this.passwordUtil.comparePassword(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!hashMatch) {
      await this.refreshTokenModel.deleteMany({ user: userId });
      throw new UnauthorizedException(
        'Token mismatch. All tokens for this user revoked.',
      );
    }
    await this.refreshTokenModel.deleteOne({ _id: storedToken._id });
    return this.getTokens(user._id.toString(), user.email);
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

    return this.getTokens(user._id.toString(), user.email);
  }

  private async createUser(
    createUserDto: CreateUserDto,
  ): Promise<UserDocument> {
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
        throw new ConflictException(
          'User with this phone number already exists',
        );
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
    await this.userModel
      .updateOne({ _id: userId }, { $set: { isVerified: true } })
      .exec();
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
        secret: process.env.JWT_REFRESH_SECRET,
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

  async requestPasswordReset(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel
      .findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
      .exec();

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return {
        message:
          'If a user with that email exists, a password reset link has been sent.',
      };
    }

    const payload = { sub: user._id.toString(), email: user.email };
    const resetToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_RESET_SECRET,
      expiresIn: '1h',
    });

    const resetLink = `[FRONTEND_BASE_URL]/reset-password?token=${resetToken}`;

    try {
      await this.emailService.sendPasswordReset(user.email, resetLink);
    } catch (error) {
      console.error(
        `Failed to send password reset email to ${user.email}:`,
        error,
      );
    }

    return {
      message:
        'If a user with that email exists, a password reset link has been sent.',
    };
  }
}

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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  async register(
    createUserDto: CreateUserDto,
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
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}

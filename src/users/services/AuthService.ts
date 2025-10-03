import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { User } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterUserDto } from '../dtos/RegisterUserDto';
import { Model } from 'mongoose';
import { UserDocument } from '../types/types';
import { PasswordUtil } from '../utils/PasswordUtil';
import { OtpService } from './OtpService';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly passwordUtil: PasswordUtil,
    private readonly otpService: OtpService,
  ) {}

  async register(
    registerDto: RegisterUserDto,
  ): Promise<Omit<UserDocument, 'password'>> {
    const { email, password, phoneNumber } = registerDto;
    const isVerified = await this.otpService.isEmailVerified(email);
    if (!isVerified) {
      throw new BadRequestException(
        'Email must be verified before registration',
      );
    }
    await this.checkExistingUser(email, phoneNumber);
    this.passwordUtil.validatePasswordStrength(password);
    const user = await this.createUser(registerDto);
    await this.otpService.clearOtp(email);
    return this.excludePassword(user);
  }

  private async createUser(
    registerDto: RegisterUserDto,
  ): Promise<UserDocument> {
    const { password, ...userData } = registerDto;

    const hashedPassword = await this.passwordUtil.hashPassword(password);

    const newUser = new this.userModel({
      ...userData,
      password: hashedPassword,
      isVerified: true,
    });

    return newUser.save();
  }

  private async checkExistingUser(
    email: string,
    phoneNumber: string,
  ): Promise<void> {
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { phoneNumber }],
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

  private excludePassword(user: UserDocument): Omit<UserDocument, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }
}

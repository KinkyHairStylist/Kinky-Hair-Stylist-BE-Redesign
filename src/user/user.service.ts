import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from './user.schema';

export interface SanitizedUser {
  id: string;
  email: string;
  firstName?: string;
  surname?: string;
  phoneNumber?: string;
  gender?: string;
  isVerified: boolean;
}

import { 
  GetStartedDto, 
  VerifyCodeDto, 
  ResendCodeDto, 
  SignUpDto, 
  LoginDto,
  ForgotPasswordDto,
  AuthResponseDto 
} from './user.dto';

@Injectable()
export class UserService {
  private transporter;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private generateCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  private async sendVerificationEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your KHS Email Verification Code',
      text: `Your verification code is: ${code}. It is valid for 10 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async sendPasswordResetEmail(email: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click this link to reset your password: https://yourdomain.com/reset-password?token=mock-token\n\nThis link expires in 1 hour.`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async getStarted(dto: GetStartedDto): Promise<AuthResponseDto> {
    const { email } = dto;

    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = new this.userModel({
        email,
        isVerified: false,
        verificationCode: this.generateCode(),
        verificationExpires: new Date(Date.now() + 10 * 60 * 1000),
      });
    } else {
      if (!user.isVerified) {
        user.verificationCode = this.generateCode();
        user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      }
    }

    await user.save();
    await this.sendVerificationEmail(user.email, user.verificationCode);

    return { message: 'Verification code sent' };
  }

  async verifyCode(dto: VerifyCodeDto): Promise<AuthResponseDto> {
    const { email, code } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Already verified', user: this.sanitizeUser(user) };
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > user.verificationExpires) {
      throw new BadRequestException('Verification code expired');
    }

    user.isVerified = true;
    user.verificationCode =  '';
    user.verificationExpires = new Date();
    await user.save();

    return { message: 'Email verified successfully', user: this.sanitizeUser(user) };
  }

  async resendCode(dto: ResendCodeDto): Promise<AuthResponseDto> {
    const { email } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Already verified' };
    }

    user.verificationCode = this.generateCode();
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.sendVerificationEmail(user.email, user.verificationCode);

    return { message: 'New verification code sent' };
  }

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, firstName, surname, phoneNumber, gender } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found or not verified');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Email not verified');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.firstName = firstName;
    user.surname = surname;
    user.phoneNumber = phoneNumber;
    user.gender = gender;

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return {
      message: 'Signup successful',
      token,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Account not fully set up');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return {
      message: 'Login successful',
      token,
      user: this.sanitizeUser(user),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<AuthResponseDto> {
    const { email } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      return { message: 'If account exists, reset link sent' };
    }

    await this.sendPasswordResetEmail(email);

    return { message: 'Reset link sent to your email' };
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  public sanitizeUser(user: UserDocument): SanitizedUser {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      isVerified: user.isVerified,
    };
  }
}
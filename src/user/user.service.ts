// src/user/user.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from './user.schema';
import {
  GetStartedDto,
  VerifyCodeDto,
  ResendCodeDto,
  SignUpDto,
  LoginDto,
  ResetPasswordStartDto, // 👈 NEW
  ResetPasswordVerifyDto, // 👈 NEW
  ResetPasswordFinishDto, // 👈 NEW
  AuthResponseDto,
} from './user.dto';

@Injectable()
export class UserService {
  private transporter;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      dnsTimeout: 10000, // 10 seconds
    });
  }

  private generateCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  private async sendVerificationEmail(
    email: string,
    code: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your KHS Email Verification Code',
      text: `Your verification code is: ${code}. It is valid for 10 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 👇 NEW: Send password reset code
  private async sendResetCodeEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${code}. It is valid for 10 minutes.`,
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

    return { message: 'Verification code sent',  success:true };
  }

  async verifyCode(dto: VerifyCodeDto): Promise<AuthResponseDto> {
    const { email, code } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Already verified', user: this.sanitizeUser(user) , success:true};
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > user.verificationExpires) {
      throw new BadRequestException('Verification code expired');
    }

    user.isVerified = true;
    user.verificationCode = '';
    user.verificationExpires = new Date();
    await user.save();

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(user),
      success:true
    };
  }

  async resendCode(dto: ResendCodeDto): Promise<AuthResponseDto> {
    const { email } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Already verified' , success:true};
    }

    user.verificationCode = this.generateCode();
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.sendVerificationEmail(user.email, user.verificationCode);

    return { message: 'New verification code sent' , success:true};
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
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' },
    );

    return {
      message: 'Signup successful',
      token,
      user: this.sanitizeUser(user),
      success:true
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
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' },
    );

    return {
      message: 'Login successful',
      token,
      user: this.sanitizeUser(user),
      success:true
    };
  }

  // 👇 NEW: Start password reset
  async startResetPassword(
    dto: ResetPasswordStartDto,
  ): Promise<AuthResponseDto> {
    const { email } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      // Don't reveal if user doesn't exist
      return { message: 'If account exists, reset code sent', success:true };
    }

    // Generate reset code
    const resetCode = this.generateCode();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    await this.sendResetCodeEmail(email, resetCode);

    return { message: 'Password reset code sent' , success:true};
  }

  // 👇 NEW: Verify reset code
  async verifyResetCode(dto: ResetPasswordVerifyDto): Promise<AuthResponseDto> {
    const { email, code } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode || user.resetCode !== code) {
      throw new BadRequestException('Invalid reset code');
    }

    if (new Date() > user.resetCodeExpires) {
      throw new BadRequestException('Reset code expired');
    }

    // Mark code as used by clearing it (or you can keep it until password change)
    // user.resetCode = null;
    // user.resetCodeExpires = null;
    // await user.save();

    return { message: 'Reset code verified', user: this.sanitizeUser(user), success:true };
  }

  // 👇 NEW: Finish password reset
  async finishResetPassword(
    dto: ResetPasswordFinishDto,
  ): Promise<AuthResponseDto> {
    const { email, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode) {
      throw new BadRequestException('No active reset request');
    }

    // Verify reset code is still valid
    if (new Date() > user.resetCodeExpires) {
      throw new BadRequestException('Reset code expired');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset code
    user.resetCode = '';
    user.resetCodeExpires = new Date();

    await user.save();

    return { message: 'Password reset successful', success:true };
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  public sanitizeUser(user: UserDocument): any {
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      isVerified: user.isVerified,
    };
  }
}

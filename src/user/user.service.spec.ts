import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from './user.schema';
import { GetStartedDto, VerifyCodeDto, ResendCodeDto, SignUpDto, AuthResponseDto } from './user.dto';

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
    user.verificationCode = '';
    user.verificationExpires = new Date(0);
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
      " process.env.JWT_SECRET",
      { expiresIn: '7d' },
    );

    return {
      message: 'Signup successful',
      token,
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: UserDocument): any {
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
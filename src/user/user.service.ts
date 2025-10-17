// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { ConfigService } from '@nestjs/config';
// import * as bcrypt from 'bcrypt';
// import * as jwt from 'jsonwebtoken';
// import * as nodemailer from 'nodemailer';
// import { User, UserDocument } from './user.schema';
// import {
//   GetStartedDto,
//   VerifyCodeDto,
//   ResendCodeDto,
//   SignUpDto,
//   AuthResponseDto,
// } from './user.dto';
//
// @Injectable()
// export class UserService {
//   constructor(
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     private configService: ConfigService,
//   ) {}
//
//   private transporter: nodemailer.Transporter;
//
//   private async initTransporter() {
//     if (!this.transporter) {
//       this.transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: this.configService.get('EMAIL_USER'),
//           pass: this.configService.get('EMAIL_PASS'),
//         },
//       });
//     }
//     return this.transporter;
//   }
//
//   private generateVerificationCode(): string {
//     return Math.floor(100000 + Math.random() * 900000).toString();
//   }
//
//   private generateToken(userId: string): string {
//     return jwt.sign({ sub: userId }, 'process.env.JWT_SECRET', {
//       expiresIn: '7d',
//     });
//   }
//
//   async getStarted(dto: GetStartedDto): Promise<AuthResponseDto> {
//     const { email } = dto;
//     const verificationCode = this.generateVerificationCode();
//     const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
//
//     let user = await this.userModel.findOne({ email });
//
//     if (user) {
//       user.verificationCode = verificationCode;
//       user.verificationExpires = expiry;
//       await user.save();
//     } else {
//       user = new this.userModel({
//         email,
//         verificationCode,
//         verificationExpires: expiry,
//       });
//       await user.save();
//     }
//
//     await this.sendVerificationEmail(email, verificationCode);
//
//     return {
//       message: 'Verification code sent',
//       token: this.generateToken(user.id),
//       user: {
//         id: user.id,
//         email: user.email,
//         isVerified: user.isVerified,
//       },
//     };
//   }
//
//   async verifyCode(dto: VerifyCodeDto): Promise<AuthResponseDto> {
//     const { email, code } = dto;
//     const user = await this.userModel.findOne({ email });
//
//     if (
//       !user ||
//       user.verificationCode !== code ||
//       user.verificationExpires < new Date()
//     ) {
//       throw new Error('Invalid or expired code');
//     }
//
//     user.isVerified = true;
//     await user.save();
//
//     return {
//       message: 'Email verified successfully',
//       token: this.generateToken(user.id),
//       user: {
//         id: user.id,
//         email: user.email,
//         isVerified: user.isVerified,
//       },
//     };
//   }
//
//   async resendCode(dto: ResendCodeDto): Promise<AuthResponseDto> {
//     const { email } = dto;
//     const user = await this.userModel.findOne({ email });
//
//     if (!user) {
//       throw new Error('User not found');
//     }
//
//     const verificationCode = this.generateVerificationCode();
//     const expiry = new Date(Date.now() + 10 * 60 * 1000);
//
//     user.verificationCode = verificationCode;
//     user.verificationExpires = expiry;
//     await user.save();
//
//     await this.sendVerificationEmail(email, verificationCode);
//
//     return {
//       message: 'Verification code resent',
//       token: this.generateToken(user.id),
//       user: {
//         id: user.id,
//         email: user.email,
//         isVerified: user.isVerified,
//       },
//     };
//   }
//
//   async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
//     const { email, password, firstName, surname, phoneNumber, gender } = dto;
//     const user = await this.userModel.findOne({ email });
//
//     if (!user || !user.isVerified) {
//       throw new Error('Email not verified');
//     }
//
//     if (user.firstName) {
//       throw new Error('User already signed up');
//     }
//
//     const hashedPassword = await bcrypt.hash(password, 10);
//
//     user.password = hashedPassword;
//     user.firstName = firstName;
//     user.surname = surname;
//     user.phoneNumber = phoneNumber;
//     user.gender = gender;
//     // user.name = `${firstName} ${surname}`;
//     user.firstName = firstName;
//     user.surname = surname;
//     await user.save();
//
//     return {
//       message: 'Sign-up successful',
//       token: this.generateToken(user.id),
//       user: {
//         id: user.id,
//         email: user.email,
//         firstName,
//         surname,
//         phoneNumber,
//         gender,
//         isVerified: user.isVerified,
//       },
//     };
//   }
//
//   private async sendVerificationEmail(email: string, code: string) {
//     const transporter = await this.initTransporter();
//     await transporter.sendMail({
//       from: this.configService.get('EMAIL_USER'),
//       to: email,
//       subject: 'Verify Your Email',
//       html: `<p>Your verification code is: <strong>${code}</strong></p>`,
//     });
//   }
// }

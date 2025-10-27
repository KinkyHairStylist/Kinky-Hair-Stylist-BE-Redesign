import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import { User } from './user.entity';
import { PasswordHashingHelper } from '../helpers/password-hashing.helper';
import {
  GetStartedDto,
  VerifyCodeDto,
  ResendCodeDto,
  SignUpDto,
  LoginDto,
  ResetPasswordStartDto,
  ResetPasswordVerifyDto,
  ResetPasswordFinishDto,
  AuthResponseDto,
} from './user.dto';

type SanitizedUser = Omit<
  User,
  | 'password'
  | 'verificationCode'
  | 'verificationExpires'
  | 'resetCode'
  | 'resetCodeExpires'
>;

@Injectable()
export class UserService {
  private fromEmail: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      throw new Error('SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set');
    }
    
    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail;
  }

  private generateCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  private async sendVerificationEmail(
    email: string,
    code: string,
  ): Promise<void> {
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Your KHS Email Verification Code',
      text: `Your verification code is: ${code}. It is valid for 10 minutes.`,
    };
    await sgMail.send(msg);
  }

  private async sendResetCodeEmail(email: string, code: string): Promise<void> {
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${code}. It is valid for 10 minutes.`,
    };
    await sgMail.send(msg);
  }

  async getStarted(dto: GetStartedDto): Promise<AuthResponseDto> {
    const { email } = dto;

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      user = this.userRepository.create({
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

    await this.userRepository.save(user);
    if (user.verificationCode) {
      await this.sendVerificationEmail(user.email, user.verificationCode);
    }

    return { message: 'Verification code sent', success: true };
  }
    
  async verifyCode(dto: VerifyCodeDto): Promise<AuthResponseDto> {
    const { email, code } = dto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return {
        message: 'Already verified',
        user: this.sanitizeUser(user),
        success: true,
      };
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (!user.verificationExpires || new Date() > user.verificationExpires) {
      throw new BadRequestException('Verification code expired');
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    await this.userRepository.save(user);

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(user),
      success: true,
    };
  }

  async resendCode(dto: ResendCodeDto): Promise<AuthResponseDto> {
    const { email } = dto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
        return { message: 'Already verified', success: true };
    }

    user.verificationCode = this.generateCode();
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepository.save(user);

    await this.sendVerificationEmail(user.email, user.verificationCode);

    return { message: 'New verification code sent', success: true };
  }

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, firstName, surname, phoneNumber, gender } = dto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
        throw new BadRequestException('User not found or not verified');
    }

    if (!user.isVerified) {
        throw new BadRequestException('Email not verified');
    }

    user.password = await PasswordHashingHelper.hashPassword(password);
    user.firstName = firstName;
    user.surname = surname;
    user.phoneNumber = phoneNumber;
    user.gender = gender;

    await this.userRepository.save(user);

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: '7d' },
    );

    return {
        message: 'Signup successful',
      token,
      user: this.sanitizeUser(user),
      success: true,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Account not fully set up');
    }

    const isMatch = await PasswordHashingHelper.comparePassword(
      password,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' },
    );

    return {
      message: 'Login successful',
      token,
      user: this.sanitizeUser(user),
      success: true,
    };
  }

  async startResetPassword(
    dto: ResetPasswordStartDto,
  ): Promise<AuthResponseDto> {
    const { email } = dto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { message: 'If account exists, reset code sent', success: true };
    }

    const resetCode = this.generateCode();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await this.userRepository.save(user);

    await this.sendResetCodeEmail(email, resetCode);

    return { message: 'Password reset code sent', success: true };
  }

  async verifyResetCode(dto: ResetPasswordVerifyDto): Promise<AuthResponseDto> {
    const { email, code } = dto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode || user.resetCode !== code) {
      throw new BadRequestException('Invalid reset code');
    }

    if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      throw new BadRequestException('Reset code expired');
    }

    return {
      message: 'Reset code verified',
      user: this.sanitizeUser(user),
      success: true,
    };
  }

  async finishResetPassword(
    dto: ResetPasswordFinishDto,
  ): Promise<AuthResponseDto> {
    const { email, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode) {
      throw new BadRequestException('No active reset request');
    }

    if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      throw new BadRequestException('Reset code expired');
    }

    user.password = await PasswordHashingHelper.hashPassword(newPassword);

    user.resetCode = null;
    user.resetCodeExpires = null;

    await this.userRepository.save(user);

    return { message: 'Password reset successful', success: true };
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  public sanitizeUser(user: User): SanitizedUser {
    const {
      password: _password,
      verificationCode: _verificationCode,
      verificationExpires: _verificationExpires,
      resetCode: _resetCode,
      resetCodeExpires: _resetCodeExpires,
      ...result
    } = user;
    return result;
  }
}
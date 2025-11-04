import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Express } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/all_user_entities/user.entity';
import { UpdateUserProfileDto } from '../dtos/update-profile.dto';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getProfile(user: User): Promise<User> {
    const foundUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (!foundUser) throw new NotFoundException('User not found');
    return foundUser;
  }

  async updateProfile(user: User, dto: UpdateUserProfileDto): Promise<User> {
    const foundUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (!foundUser) throw new NotFoundException('User not found');

    Object.assign(foundUser, dto);
    return this.userRepo.save(foundUser);
  }

  async uploadAvatar(user: User, file: Express.Multer.File): Promise<User> {
    if (!file) throw new BadRequestException('No file uploaded');

    const foundUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (!foundUser) throw new NotFoundException('User not found');

    const uploadedUrl = await this.cloudinaryService.uploadFile(file);
    foundUser.avatarUrl = uploadedUrl;

    return this.userRepo.save(foundUser);
  }

  async deleteAvatar(user: User): Promise<{ message: string }> {
    const foundUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (!foundUser) throw new NotFoundException('User not found');

    if (foundUser.avatarUrl) {
      const parts = foundUser.avatarUrl.split('/');
      const publicId = parts[parts.length - 1].split('.')[0];
      await this.cloudinaryService.deleteFile(`user_avatars/${publicId}`);
      foundUser.avatarUrl = undefined;
      await this.userRepo.save(foundUser);
    }

    return { message: 'Avatar deleted successfully' };
  }
}

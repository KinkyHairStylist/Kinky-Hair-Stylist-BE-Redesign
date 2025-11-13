import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

export interface UploadResult {
  profileImageId: string;
  profileImageUrl: string;
}

export interface FileUpload {
  filepath: string;
  mimetype: string;
  originalFilename: string;
  size: number;
}
@Injectable()
export class BusinessCloudinaryService {
  constructor(@Inject('BUSINESS_CLOUDINARY') private cloudinary: any) {}

  async uploadClientProfileImage(
    file: any,
    folderPath: string,
  ): Promise<UploadResult> {
    try {
      await this.cloudinary.api.delete_resources_by_prefix(folderPath);

      const result = await this.cloudinary.uploader.upload(file.filepath, {
        folder: folderPath,
        use_filename: true,
        unique_filename: false,
        transformation: { gravity: 'face' },
      });

      const publicId = result?.public_id;
      const profileImageId = publicId?.split('/').pop();
      const profileImageUrl = result?.secure_url;

      return { profileImageId, profileImageUrl };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new InternalServerErrorException('Failed to upload profileImage');
    }
  }
}

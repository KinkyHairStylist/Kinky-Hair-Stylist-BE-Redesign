import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    async uploadBuffer(file: Express.Multer.File): Promise<string> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
            { folder: 'KHS/ChatImages' },
            (error, result) => {
                if (error) return reject(error);
                if (!result || !result.secure_url) {
                return reject(new Error('Failed to upload image to Cloudinary'));
                }
                resolve(result.secure_url);
            },
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
        });
    }


    async uploadBase64(base64: string): Promise<string> {
        const result = await cloudinary.uploader.upload(base64, {
        folder: 'KHS/ChatImages',
        });
        return result.secure_url;
    }
}
import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProfileService } from '../services/client-profile.service';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ClientProfileValidationMiddleware implements NestMiddleware {
  constructor(private readonly clientProfileService: ClientProfileService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const profileData = req.body?.profile || req.body;

    // No profile in request body
    if (!profileData) {
      throw new HttpException(
        'Profile data is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const validation =
      await this.clientProfileService.validateClientProfile(profileData);

    if (!validation.success) {
      throw new HttpException(
        validation.message ?? validation.error ?? 'Profile validation failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ Validation passed
    next();
  }
}

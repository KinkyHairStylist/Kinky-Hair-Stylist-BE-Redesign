import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express';

const resendTracker = new Map<string, { lastSent: number }>();

@Injectable()
export class RateLimitMiddleware implements NestMiddleware{
    use(req: Request, res: Response, next: NextFunction) {
        const email = req.body?.email;
        if (!email) return next();
        
        const now = Date.now();
        const record = resendTracker.get(email);

        if (record && now - record.lastSent <60 * 1000) {
            throw new BadRequestException('Wait 1 minute before requesting another OTP');
        }

        resendTracker.set(email, { lastSent: now });
        next();
    }
}
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class EmailValidationMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const { email } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            throw new BadRequestException('Invalid email format');
        }

        next();
    }
}
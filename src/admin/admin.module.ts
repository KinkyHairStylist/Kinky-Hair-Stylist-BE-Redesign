import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { User } from '../business/entities/user.entity'
import {Business} from "../business/entities/business.entity";

import {BusinessApplication} from "../business/entities/businessApplication.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User]),TypeOrmModule.forFeature([Business]),
        TypeOrmModule.forFeature([BusinessApplication])],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}

import {Body, Controller, Get, Param, Post, Req, Res} from '@nestjs/common';
import { AdminService } from '../services/admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('getAllUsers')
    async getAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Post('cancelAppointment')
    async cancelAppointment(@Body()body:{id:string ,reason:string}) {
        return this.adminService.cancelAppointment(body.id,body.reason);
    }

    @Get('getAppointment/:id')
    async getAppointment(@Param('id') id: string) {
        return this.adminService.getAppointmentById(id);
    }

    @Get('getAllAppointments')
    async getAllAppointments() {
        return this.adminService.getAllAppointments();
    }


    @Get('getAllBusinesses')
    async getAllBusinesses() {
        return this.adminService.getAllBusinesses();
    }

    @Get('getPendingApplications')
    async getPendingApplications() {
        return this.adminService.getPendingApplications()
    }

    @Post('suspendBusiness')
    async suspendBusiness(@Body() body:{ id: string }) {
        return this.adminService.suspendBusiness(body.id)
    }


    @Post("findApplicationById")
    async findApplicationById(@Body() body:{ id: string}) {
        return this.adminService.findApplicationById(body.id);
    }

    @Post('rejectApplication')
    async rejectApplication(@Body() body:{ id: string }) {
        return this.adminService.rejectApplication(body.id);
    }

    @Post('approveApplication')
    async approveApplication(@Body() body:{ id: string }) {
        return this.adminService.approveApplication(body.id);
    }

    @Get('getAllBusinessApplications')
    async getAllBusinessApplications() {
        return this.adminService.getAllBusinessApplications();
    }

    @Post('suspend')
    async suspend(@Body() body:{ id:string , reason: string}) {
        return this.adminService.suspend(body.id,body.reason);
    }

    @Post('unsuspend')
    async unsuspend(@Body() body:{ id:string }) {
        return this.adminService.unsuspend(body.id);
    }

    @Post('findByPhoneNumber')
    async findByPhoneNumber(@Body() body:{ phone:string}){
        return this.adminService.findByPhoneNumber(body.phone);
    }

    @Post('findByFirstName')
    async findByFirstName(@Body() body:{ firstName:string}){
        return this.adminService.findByFirstName(body.firstName);
    }

    @Post('findBySurname')
    async findBySurname(@Body() body:{ surname:string}){
        return this.adminService.findBySurname(body.surname);
    }

    @Post('findByEmail')
    async findByEmail(@Body() body:{ email:string}){
        return this.adminService.findByEmail(body.email);
    }

    @Post('findById')
    async findById(@Body() body:{ id:string}){
        return this.adminService.findById(body.id);
    }

    @Post('findAllSuspended')
    async findAllSuspended(){
        return this.adminService.findAllSuspended();
    }

    @Post('findAllNotSuspended')
    async findAllNotSuspended(){
        return this.adminService.findAllNotSuspended();
    }

    @Get('ping')
    ping() {
        return 'Server is live!';
    }
}

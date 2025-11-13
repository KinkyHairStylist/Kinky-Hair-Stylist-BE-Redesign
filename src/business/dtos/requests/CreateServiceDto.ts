export class CreateServiceDto {
    name: string;
    description: string;
    duration: string;
    price: number;
    advertisementPlanId?: string;
    userMail: string;
    staffId?: string;
}

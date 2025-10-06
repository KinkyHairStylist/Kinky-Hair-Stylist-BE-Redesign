export enum CompanySize {
  SOLO = 'solo',
  SMALL_TEAM = 'small-team',
  MULTI_STAFF = 'multi-staff',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  CUSTOM = 'CUSTOM',
}

export interface Payload {
  sub: string;
  email: string;
}

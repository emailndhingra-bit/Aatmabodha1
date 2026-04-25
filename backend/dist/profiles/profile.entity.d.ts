import { User } from '../users/user.entity';
export declare class Profile {
    id: string;
    userId: string;
    user: User;
    name: string;
    gender: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
    latitude: number;
    longitude: number;
    timezone: string;
    questionsUsed: number;
    createdByAdmin: boolean;
    purpose: string;
    createdAt: Date;
}

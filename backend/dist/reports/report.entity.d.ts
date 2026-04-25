import { User } from '../users/user.entity';
export declare class Report {
    id: string;
    userId: string;
    user: User;
    profileName: string;
    reportType: string;
    title: string;
    contentPreview: string;
    language: string;
    createdAt: Date;
}

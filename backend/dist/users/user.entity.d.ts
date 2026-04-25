export declare enum UserStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class User {
    id: string;
    email: string;
    name: string;
    picture: string;
    password: string;
    status: UserStatus;
    questionsUsed: number;
    questionsLimit: number;
    customQuota: number | null;
    googleId: string;
    createdAt: Date;
    updatedAt: Date;
}

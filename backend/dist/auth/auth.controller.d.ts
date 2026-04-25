import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
export declare class AuthController {
    private authService;
    private usersService;
    constructor(authService: AuthService, usersService: UsersService);
    register(body: {
        email: string;
        password: string;
        name: string;
    }): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            name: string;
            picture: string;
            status: import("../users/user.entity").UserStatus;
            questionsUsed: number;
            questionsLimit: number;
            customQuota: number | null;
            googleId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    login(req: any): Promise<{
        token: string;
        user: any;
    }>;
    googleLogin(): void;
    googleCallback(req: any, res: any): Promise<any>;
    getMe(req: any): Promise<any>;
    getPendingUsers(): Promise<import("../users/user.entity").User[]>;
    getAllUsers(): Promise<import("../users/user.entity").User[]>;
    approveUser(id: string): Promise<import("../users/user.entity").User>;
    rejectUser(id: string): Promise<import("../users/user.entity").User>;
}

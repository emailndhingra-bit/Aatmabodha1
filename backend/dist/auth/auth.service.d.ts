import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/user.entity';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateGoogle(profile: any): Promise<User>;
    validateLocal(email: string, password: string): Promise<User>;
    register(email: string, password: string, name: string): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            name: string;
            picture: string;
            status: UserStatus;
            questionsUsed: number;
            questionsLimit: number;
            customQuota: number | null;
            googleId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    generateToken(user: User): string;
    isAdmin(email: string): boolean;
}

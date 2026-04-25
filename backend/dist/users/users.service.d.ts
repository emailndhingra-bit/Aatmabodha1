import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    createUser(data: Partial<User>): Promise<User>;
    updateUser(id: string, data: Partial<User>): Promise<User>;
    getAllPendingUsers(): Promise<User[]>;
    getAllUsers(): Promise<User[]>;
    approveUser(id: string): Promise<User>;
    rejectUser(id: string): Promise<User>;
    incrementQuestions(id: string): Promise<User>;
    incrementQuestionsUsed(id: string): Promise<void>;
    getEffectiveQuota(user: User | null): number;
    isUnlimitedQuota(user: User | null): boolean;
    hasQuotaRemaining(user: User | null): boolean;
    canAskQuestion(id: string): Promise<boolean>;
    setCustomQuota(userId: string, quota: number): Promise<User>;
}

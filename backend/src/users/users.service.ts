import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async getAllPendingUsers(): Promise<User[]> {
    return this.usersRepository.find({ where: { status: UserStatus.PENDING } });
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async approveUser(id: string): Promise<User> {
    return this.updateUser(id, { status: UserStatus.APPROVED });
  }

  async rejectUser(id: string): Promise<User> {
    return this.updateUser(id, { status: UserStatus.REJECTED });
  }

  async incrementQuestions(id: string): Promise<User> {
    const user = await this.findById(id);
    return this.updateUser(id, { questionsUsed: user.questionsUsed + 1 });
  }

  async incrementQuestionsUsed(id: string): Promise<void> {
    await this.usersRepository.increment({ id }, 'questionsUsed', 1);
  }

  /** Effective monthly cap: custom_quota if set, else 60. 0 = unlimited. */
  getEffectiveQuota(user: User | null): number {
    if (!user) return 60;
    if (user.customQuota != null) return user.customQuota;
    return 60;
  }

  isUnlimitedQuota(user: User | null): boolean {
    return user != null && user.customQuota === 0;
  }

  hasQuotaRemaining(user: User | null): boolean {
    if (!user) return false;
    const cap = this.getEffectiveQuota(user);
    if (cap === 0) return true;
    return user.questionsUsed < cap;
  }

  async canAskQuestion(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;
    return user.status === UserStatus.APPROVED && this.hasQuotaRemaining(user);
  }

  async setCustomQuota(userId: string, quota: number): Promise<User> {
    await this.usersRepository.update(userId, { customQuota: quota });
    return this.findById(userId);
  }
}

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

  async canAskQuestion(id: string): Promise<boolean> {
    const user = await this.findById(id);
    return user.status === UserStatus.APPROVED && user.questionsUsed < user.questionsLimit;
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) {}

  async getUserProfiles(userId: string): Promise<Profile[]> {
    return this.profilesRepository.find({ where: { userId } });
  }

  async createProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const existing = await this.getUserProfiles(userId);
    if (existing.length >= 2) {
      throw new BadRequestException('Maximum 2 profiles allowed per account. You have reached your limit.');
    }
    const profile = this.profilesRepository.create({ ...data, userId });
    return this.profilesRepository.save(profile);
  }

  async deleteProfile(userId: string, profileId: string): Promise<void> {
    await this.profilesRepository.delete({ id: profileId, userId });
  }

  async incrementQuestions(profileId: string): Promise<void> {
    await this.profilesRepository.increment({ id: profileId }, 'questionsUsed', 1);
  }

  async getProfile(userId: string, profileId: string): Promise<Profile> {
    return this.profilesRepository.findOne({ where: { id: profileId, userId } });
  }
}

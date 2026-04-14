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

  async findById(profileId: string): Promise<Profile | null> {
    return this.profilesRepository.findOne({ where: { id: profileId } });
  }

  /** Admin Reports Hub — searchable directory of nativities. */
  async listProfilesForReportsHub(search?: string): Promise<
    Array<{
      id: string;
      name: string;
      dateOfBirth: string;
      timeOfBirth: string;
      placeOfBirth: string | null;
      userId: string;
      ownerEmail: string | null;
    }>
  > {
    const qb = this.profilesRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .orderBy('p.createdAt', 'DESC')
      .take(400);
    if (search?.trim()) {
      qb.andWhere('(p.name ILIKE :s OR COALESCE(p.placeOfBirth, \'\') ILIKE :s)', {
        s: `%${search.trim()}%`,
      });
    }
    const list = await qb.getMany();
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      dateOfBirth: p.dateOfBirth,
      timeOfBirth: p.timeOfBirth,
      placeOfBirth: p.placeOfBirth ?? null,
      userId: p.userId,
      ownerEmail: p.user?.email ?? null,
    }));
  }

  /** Admin quick-chart permanent save — bypasses the 2-profile limit for normal users. */
  async createAdminQuickProfile(
    adminUserId: string,
    data: Pick<Profile, 'name' | 'gender' | 'dateOfBirth' | 'timeOfBirth' | 'placeOfBirth' | 'latitude' | 'longitude'> & {
      timezone?: number | string | null;
    },
  ): Promise<Profile> {
    const tz =
      data.timezone !== undefined && data.timezone !== null && String(data.timezone) !== ''
        ? String(data.timezone)
        : '5.5';
    const profile = this.profilesRepository.create({
      ...data,
      timezone: tz,
      userId: adminUserId,
      createdByAdmin: true,
      purpose: 'Test Only',
    });
    return this.profilesRepository.save(profile);
  }

  /** Admin: profile counts keyed by userId */
  async countProfilesByUser(): Promise<Record<string, number>> {
    const rows = await this.profilesRepository
      .createQueryBuilder('p')
      .select('p.userId', 'userId')
      .addSelect('COUNT(p.id)', 'cnt')
      .groupBy('p.userId')
      .getRawMany();
    const out: Record<string, number> = {};
    for (const r of rows) {
      out[r.userId] = parseInt(String(r.cnt), 10) || 0;
    }
    return out;
  }
}

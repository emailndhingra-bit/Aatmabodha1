import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
export declare class ProfilesService {
    private profilesRepository;
    constructor(profilesRepository: Repository<Profile>);
    getUserProfiles(userId: string): Promise<Profile[]>;
    createProfile(userId: string, data: Partial<Profile>): Promise<Profile>;
    deleteProfile(userId: string, profileId: string): Promise<void>;
    incrementQuestions(profileId: string): Promise<void>;
    getProfile(userId: string, profileId: string): Promise<Profile>;
    findById(profileId: string): Promise<Profile | null>;
    createAdminQuickProfile(adminUserId: string, data: Pick<Profile, 'name' | 'gender' | 'dateOfBirth' | 'timeOfBirth' | 'placeOfBirth' | 'latitude' | 'longitude'> & {
        timezone?: number | string | null;
    }): Promise<Profile>;
    countProfilesByUser(): Promise<Record<string, number>>;
}

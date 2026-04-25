import { ProfilesService } from './profiles.service';
export declare class ProfilesController {
    private profilesService;
    constructor(profilesService: ProfilesService);
    adminProfileCounts(): Promise<Record<string, number>>;
    adminListProfiles(userId: string): Promise<import("./profile.entity").Profile[]>;
    getMyProfiles(req: any): Promise<import("./profile.entity").Profile[]>;
    createProfile(req: any, body: any): Promise<import("./profile.entity").Profile>;
    deleteProfile(req: any, id: string): Promise<{
        message: string;
    }>;
}

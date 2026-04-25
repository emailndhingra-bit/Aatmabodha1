export type ResolvedPob = {
    lat: number;
    lon: number;
    timezoneHours: number;
    tzIana: string | null;
};
export declare class PobResolveService {
    resolve(input: {
        pobCity: string;
        pobLat?: number;
        pobLon?: number;
        pobTz?: string;
        dob: string;
        tob: string;
    }): Promise<ResolvedPob>;
    private geocodeCity;
    private reverseGeocode;
    offsetHoursAtLocalWallClock(iana: string, dob: string, tob: string): number;
}

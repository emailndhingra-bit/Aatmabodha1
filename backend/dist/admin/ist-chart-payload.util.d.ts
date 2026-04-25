export declare function chartPayloadFromProfileFields(input: {
    dateOfBirth: string;
    timeOfBirth: string;
    latitude: number;
    longitude: number;
    timezone?: number | null;
}): {
    date_of_birth: string;
    time_of_birth: string;
    latitude: number;
    longitude: number;
    timezone: number;
};

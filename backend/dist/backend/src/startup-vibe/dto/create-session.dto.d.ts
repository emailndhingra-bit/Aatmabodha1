import { AddPersonDto } from './add-person.dto';
export declare class CreateSessionDto {
    label: string;
    industry?: string;
    stage?: string;
    fundingStatus?: string;
    notes?: string;
    people?: AddPersonDto[];
}

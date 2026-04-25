import { QuestionsService } from './questions.service';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    adminList(): Promise<any[]>;
    getRecent(req: any): Promise<{
        question: string;
        daysAgo: number;
        date: Date;
        language: string;
    }[]>;
}

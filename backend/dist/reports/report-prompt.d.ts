export declare const REPORT_SYSTEM_PROMPT: string;
export type ReportPromptParams = {
    language: string;
    minWords: number;
    maxWords: number;
    chartJson: string;
    dashaData: string;
    transitData: string;
    sectionInstructions: string;
};
export declare function buildReportSectionPrompt(p: ReportPromptParams): string;

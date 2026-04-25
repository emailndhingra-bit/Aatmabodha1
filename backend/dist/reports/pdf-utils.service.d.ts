export declare class PdfUtilsService {
    escapeHtml(s: string): string;
    generateCoverPage(reportType: string, person: string, date: string): string;
    generateSectionDivider(sectionNum: number, title: string): string;
    generatePullQuote(text: string, type: 'insight' | 'timing' | 'caution'): string;
    generatePlanetStrengthBar(planet: string, shadbala: number): string;
    generateTimeline(dashaData: string): string;
    generateCompatibilityRing(scores: Record<string, number>): string;
    generateScoreTable(koots: {
        name: string;
        value: string;
    }[]): string;
    generateShareCard(archetype: string, names: string, insight: string): string;
    wrapProseSection(body: string): string;
    compileFinalPDF(sections: string[]): string;
}

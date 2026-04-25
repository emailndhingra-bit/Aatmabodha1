"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_SYSTEM_PROMPT = void 0;
exports.buildReportSectionPrompt = buildReportSectionPrompt;
exports.REPORT_SYSTEM_PROMPT = `
You are generating a section of a premium Vedic astrology report for Aatmabodha.

STRICT RULES:
1. Every statement must derive from chart data
2. Never use generic astrology content
3. Use the person's name throughout
4. Language: [LANGUAGE]
5. Tone: warm professional — never cold or scary
6. Word count: exactly [MIN]-[MAX] words
7. No bullet points unless specifically required
8. No headers in the output text itself
9. End with forward motion — never leave the person without direction
10. For timing: always give month/year specifics when relevant

CHART DATA:
[CHART_JSON]

CURRENT DASHAS:
[DASHA_DATA]

TRANSITS:
[TRANSIT_DATA]

SECTION CONTEXT:
[SECTION_SPECIFIC_INSTRUCTIONS]
`.trim();
function buildReportSectionPrompt(p) {
    return exports.REPORT_SYSTEM_PROMPT.replace('[LANGUAGE]', p.language)
        .replace('[MIN]', String(p.minWords))
        .replace('[MAX]', String(p.maxWords))
        .replace('[CHART_JSON]', p.chartJson)
        .replace('[DASHA_DATA]', p.dashaData)
        .replace('[TRANSIT_DATA]', p.transitData)
        .replace('[SECTION_SPECIFIC_INSTRUCTIONS]', p.sectionInstructions);
}
//# sourceMappingURL=report-prompt.js.map
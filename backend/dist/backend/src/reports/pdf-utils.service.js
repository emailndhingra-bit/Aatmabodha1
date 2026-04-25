"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfUtilsService = void 0;
const common_1 = require("@nestjs/common");
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Source Serif 4', Georgia, serif; color: #1a1528; background: #faf8f5; margin: 0; padding: 0; }
  .page { width: 210mm; min-height: 297mm; padding: 22mm 18mm; page-break-after: always; background: linear-gradient(180deg, #fffdf8 0%, #f5f0e8 100%); border-bottom: 1px solid #e8e0d4; }
  .page:last-child { page-break-after: auto; }
  .gold { color: #8b6914; }
  .navy { color: #0f172a; }
  .muted { color: #5c5569; font-size: 11pt; }
  .divider { height: 3px; background: linear-gradient(90deg, #c9a227, #5b4a1a, #c9a227); margin: 18px 0; border-radius: 2px; }
`;
let PdfUtilsService = class PdfUtilsService {
    escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    generateCoverPage(reportType, person, date) {
        const t = this.escapeHtml(reportType);
        const p = this.escapeHtml(person);
        const d = this.escapeHtml(date);
        return `
    <div class="page cover">
      <div style="text-align:center;padding-top:32mm;">
        <div style="font-family:Cinzel,serif;font-size:11pt;letter-spacing:0.35em;color:#8b6914;">AATMABODHA</div>
        <div style="height:2px;width:48mm;background:linear-gradient(90deg,transparent,#c9a227,transparent);margin:16mm auto;"></div>
        <h1 class="navy" style="font-family:Cinzel,serif;font-size:26pt;font-weight:700;margin:0;line-height:1.25;">${t}</h1>
        <p class="muted" style="margin-top:14mm;font-size:13pt;">Prepared for <strong class="gold">${p}</strong></p>
        <p class="muted" style="margin-top:6mm;font-size:11pt;">${d}</p>
      </div>
    </div>`;
    }
    generateSectionDivider(sectionNum, title) {
        return `
    <div class="page section-head">
      <p class="gold" style="font-family:Cinzel,serif;font-size:10pt;letter-spacing:0.2em;margin:0;">SECTION ${sectionNum}</p>
      <h2 class="navy" style="font-family:Cinzel,serif;font-size:20pt;margin:8px 0 0;">${this.escapeHtml(title)}</h2>
      <div class="divider"></div>
    </div>`;
    }
    generatePullQuote(text, type) {
        const border = type === 'caution' ? '#b45309' : type === 'timing' ? '#1e3a5f' : '#c9a227';
        return `
    <div style="margin:16px 0;padding:14px 18px;border-left:4px solid ${border};background:rgba(201,162,39,0.08);font-style:italic;font-size:11pt;line-height:1.55;color:#2d2640;">
      ${this.escapeHtml(text)}
    </div>`;
    }
    generatePlanetStrengthBar(planet, shadbala) {
        const pct = Math.min(100, Math.max(0, Math.round((shadbala / 2) * 100)));
        return `
    <div style="margin:10px 0;">
      <div style="display:flex;justify-content:space-between;font-size:10pt;color:#444;margin-bottom:4px;">
        <span>${this.escapeHtml(planet)}</span><span>${shadbala.toFixed(2)}</span>
      </div>
      <div style="height:8px;background:#e5e0d8;border-radius:4px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#1e3a5f,#c9a227);"></div>
      </div>
    </div>`;
    }
    generateTimeline(dashaData) {
        return `
    <div style="margin:14px 0;padding:12px;background:#fff;border:1px solid #e8e0d4;border-radius:8px;">
      <div class="gold" style="font-family:Cinzel,serif;font-size:10pt;margin-bottom:8px;">Vimshottari highlights</div>
      <pre style="white-space:pre-wrap;font-size:9pt;color:#3d3654;margin:0;font-family:inherit;line-height:1.45;">${this.escapeHtml(dashaData.slice(0, 2800))}</pre>
    </div>`;
    }
    generateCompatibilityRing(scores) {
        const rows = Object.entries(scores)
            .map(([k, v]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${this.escapeHtml(k)}</td><td style="padding:6px 10px;text-align:right;border-bottom:1px solid #eee;font-weight:600;">${v}</td></tr>`)
            .join('');
        return `
    <div style="margin:14px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:10pt;background:#fff;border:1px solid #e8e0d4;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#0f172a;color:#f5e6b8;"><th style="padding:8px 10px;text-align:left;">Factor</th><th style="padding:8px 10px;text-align:right;">Score</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
    }
    generateScoreTable(koots) {
        const body = koots
            .map((r) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${this.escapeHtml(r.name)}</td><td style="padding:6px 10px;text-align:right;border-bottom:1px solid #eee;">${this.escapeHtml(r.value)}</td></tr>`)
            .join('');
        return `<table style="width:100%;border-collapse:collapse;font-size:10pt;margin:12px 0;">${body}</table>`;
    }
    generateShareCard(archetype, names, insight) {
        return `
    <div style="margin:18px 0;padding:20px;border-radius:12px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fef3c7;text-align:center;">
      <div style="font-family:Cinzel,serif;font-size:9pt;letter-spacing:0.25em;color:#c9a227;">ARCHETYPE</div>
      <div style="font-family:Cinzel,serif;font-size:18pt;margin:8px 0;">${this.escapeHtml(archetype)}</div>
      <div style="font-size:11pt;opacity:0.9;">${this.escapeHtml(names)}</div>
      <p style="font-size:10pt;margin-top:12px;line-height:1.5;opacity:0.95;">${this.escapeHtml(insight)}</p>
    </div>`;
    }
    wrapProseSection(body) {
        return `<div class="page prose"><div style="font-size:11pt;line-height:1.65;color:#2d2640;text-align:justify;">${body.replace(/\n/g, '<br/>')}</div></div>`;
    }
    compileFinalPDF(sections) {
        return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${BASE_CSS}</style></head><body>${sections.join('')}</body></html>`;
    }
};
exports.PdfUtilsService = PdfUtilsService;
exports.PdfUtilsService = PdfUtilsService = __decorate([
    (0, common_1.Injectable)()
], PdfUtilsService);
//# sourceMappingURL=pdf-utils.service.js.map
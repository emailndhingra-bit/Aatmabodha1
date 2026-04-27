import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function sanitizeUserFilename(name: string): string {
  const t = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
  return t || 'User';
}

function section(title: string, body: string): string {
  const line = '='.repeat(64);
  return `${line}\n${title}\n${line}\n\n${body}\n\n`;
}

function formatKeyValueBlock(obj: unknown, title: string): string {
  if (obj == null || (typeof obj === 'object' && Object.keys(obj as object).length === 0)) {
    return section(title, '(no data)');
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return section(title, JSON.stringify(obj, null, 2));
  }
  const lines = Object.entries(obj as Record<string, unknown>)
    .map(([k, v]) => {
      if (v != null && typeof v === 'object' && !Array.isArray(v)) {
        return `${k}:\n${JSON.stringify(v, null, 2)}`;
      }
      if (Array.isArray(v)) {
        return `${k}:\n${JSON.stringify(v, null, 2)}`;
      }
      return `${k}: ${String(v)}`;
    })
    .join('\n');
  return section(title, lines);
}

function getD1Array(raw: Record<string, unknown>): unknown[] {
  if (Array.isArray(raw.D1) && raw.D1.length) return raw.D1 as unknown[];
  if (Array.isArray(raw.D1_Rashi) && (raw.D1_Rashi as unknown[]).length) return raw.D1_Rashi as unknown[];
  const charts = raw.charts;
  if (Array.isArray(charts)) {
    const d1 = charts.find(
      (c: any) => c?.name && (String(c.name).includes('D1') || String(c.name).includes('Rashi')),
    );
    if (d1 && Array.isArray(d1.planets)) return d1.planets;
  }
  return [];
}

function getDivision(raw: Record<string, unknown>, key: string): unknown[] {
  const v = raw[key];
  if (Array.isArray(v) && v.length) return v as unknown[];
  const charts = raw.charts;
  if (Array.isArray(charts)) {
    const c = charts.find((x: any) => x?.name && String(x.name).includes(key));
    if (c && Array.isArray(c.planets)) return c.planets;
  }
  return [];
}

function formatPlanetRows(label: string, rows: unknown[]): string {
  if (!rows.length) return section(label, '(no rows)');
  const lines: string[] = [];
  for (const row of rows) {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      const r = row as Record<string, unknown>;
      const planet = String(r.planet ?? r.name ?? '—');
      const sign = String(r.sign ?? r.rashi ?? '—');
      const deg = String(r.degree ?? r.deg ?? '—');
      const house = r.house != null ? String(r.house) : '—';
      const status = String(r.status ?? '—');
      const nbry = String(r.nbry ?? r.NBRY ?? '—');
      const retro = r.retrograde === true || r.isRetro === true ? 'R' : r.retrograde === false || r.isRetro === false ? '' : String(r.retrograde ?? r.isRetro ?? '');
      const nak = String(r.nakshatra ?? r.nak ?? '—');
      const pada = String(r.pada ?? '—');
      const varg = r.vargottam != null ? ` vargottam=${String(r.vargottam)}` : '';
      lines.push(
        `${planet} | sign/rashi: ${sign} | deg: ${deg} | house: ${house} | status: ${status} | NBRY: ${nbry} | retro: ${retro || '—'} | nak: ${nak} pada: ${pada}${varg}`,
      );
    } else {
      lines.push(JSON.stringify(row));
    }
  }
  return section(label, lines.join('\n'));
}

function buildChartBasicTxt(raw: Record<string, unknown>): string {
  const parts: string[] = [];
  const av = raw.Avakahada_Chakra || raw.avkahadaChakra;
  parts.push(formatKeyValueBlock(av, 'Avakahada / Avakahada Chakra'));
  const basic = raw.Basic_Details || raw.Traditional;
  parts.push(formatKeyValueBlock(basic, 'Basic details / Traditional'));
  parts.push(formatKeyValueBlock(raw.personal || raw.Personal, 'Personal'));
  parts.push(formatKeyValueBlock(raw.Favourable_Points || raw.favourablePoints, 'Favourable points'));
  parts.push(formatKeyValueBlock(raw.Ghatak || raw.ghatak, 'Ghatak'));
  parts.push(formatKeyValueBlock(raw.Varshphal_Details, 'Varshphal details'));
  return parts.join('\n');
}

function buildD1D9D10Txt(raw: Record<string, unknown>): string {
  const d1 = getD1Array(raw);
  const d9 = getDivision(raw, 'D9');
  const d10 = getDivision(raw, 'D10');
  return [
    formatPlanetRows('D1 (Rashi / Lagna chart)', d1),
    formatPlanetRows('D9 (Navamsha)', d9),
    formatPlanetRows('D10 (Dasamsha)', d10),
  ].join('\n');
}

function formatDashaList(arr: unknown, title: string): string {
  if (!Array.isArray(arr) || arr.length === 0) return section(title, '(no data)');
  const lines = (arr as Record<string, unknown>[]).map((d) => {
    const md = String(d.mdLord ?? d.dasha_lord ?? d.MD ?? '—');
    const ad = String(d.adLord ?? d.ad ?? '—');
    const start = String(d.startDate ?? d.start ?? '—');
    const end = String(d.endDate ?? d.end ?? '—');
    return `${md} / ${ad}  ${start}  →  ${end}`;
  });
  return section(title, lines.join('\n'));
}

function buildVDtxt(raw: Record<string, unknown>): string {
  const vd = raw.VD ?? raw.vimshottari;
  return formatDashaList(vd, 'Vimshottari (VD) — Mahadasha / Antardasha dates');
}

function buildYdCdTxt(raw: Record<string, unknown>): string {
  const yd = raw.YD ?? raw.yogini;
  const cd = raw.CD ?? raw.chara;
  return [formatDashaList(yd, 'Yogini dasha (YD)'), formatDashaList(cd, 'Chara dasha (CD)')].join('\n');
}

function buildKpAshtakvargaTxt(raw: Record<string, unknown>): string {
  const atpt = raw.ATPT as Record<string, unknown> | undefined;
  const kp = raw.KP_System || raw.KP || {};
  const sav = atpt?.summary_bav_by_rashi || raw.summary_bav_by_rashi;
  const prasthara = atpt?.prasthara_pav || raw.prasthara_pav;
  const parts: string[] = [];
  parts.push(section('KP system (cusps, planets, significators)', JSON.stringify(kp, null, 2)));
  parts.push(section('SarvAshtakavarga by rashi (SAV)', JSON.stringify(sav ?? {}, null, 2)));
  parts.push(section('Prasthara Ashtakavarga (Prasthara)', JSON.stringify(prasthara ?? {}, null, 2)));
  return parts.join('\n');
}

/**
 * Builds a zip of structured `.txt` extracts from Replit-style chart JSON and triggers a download.
 */
export async function downloadUserChartZip(userName: string, rawChartJson: unknown): Promise<void> {
  const raw =
    rawChartJson && typeof rawChartJson === 'object' && !Array.isArray(rawChartJson)
      ? (rawChartJson as Record<string, unknown>)
      : {};

  const zip = new JSZip();
  zip.file('Chart_Basic.txt', buildChartBasicTxt(raw));
  zip.file('D1_D9_D10.txt', buildD1D9D10Txt(raw));
  zip.file('VD.txt', buildVDtxt(raw));
  zip.file('YD_CD.txt', buildYdCdTxt(raw));
  zip.file('KP_Ashtakvarga.txt', buildKpAshtakvargaTxt(raw));

  const blob = await zip.generateAsync({ type: 'blob' });
  const base = sanitizeUserFilename(userName);
  saveAs(blob, `${base}_Aatmabodha_Data.zip`);
}

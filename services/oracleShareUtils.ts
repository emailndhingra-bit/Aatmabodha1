/** Plain text for share card / clipboard (strip markdown noise). */
export function oracleTextForShare(raw: string): string {
  return (raw || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`{3}[\s\S]*?`{3}/g, "[diagram]")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/<<<SUGG:\s*.*?>>>/g, "")
    .replace(/<<VISUALIZE:.*?>>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanDashaLabel(name: string): string {
  const s = (name || "")
    .replace(/\s*Mahadasha\s*/gi, " ")
    .replace(/\s*Antardasha\s*/gi, " ")
    .replace(/\s*Antar\s*Dasha\s*/gi, " ")
    .replace(/\s*Pratyantar[\s\w]*/gi, " ")
    .trim();
  return s || "—";
}

/** First two active Vim periods as "X MD · Y AD", else Yogini, else fallback. */
export function getOracleShareDashaLine(db: unknown): string {
  const d = db as { exec?: (sql: string) => { values?: unknown[][] }[] } | null;
  if (!d?.exec) return "Current Dasha";
  const sql =
    "SELECT period_name FROM dashas WHERE system = 'Vimshottari' AND substr(end_date,7,4)||'-'||substr(end_date,4,2)||'-'||substr(end_date,1,2) >= date('now') ORDER BY substr(end_date,7,4)||'-'||substr(end_date,4,2)||'-'||substr(end_date,1,2) ASC LIMIT 2";
  try {
    const vim = d.exec(sql);
    const vrows = vim[0]?.values as string[][] | undefined;
    if (vrows?.length) {
      const md = cleanDashaLabel(String(vrows[0][0] ?? ""));
      const ad = vrows[1] ? cleanDashaLabel(String(vrows[1][0] ?? "")) : "";
      if (ad && ad !== "—") return `${md} MD · ${ad} AD`;
      return `${md} MD`;
    }
    const yogSql =
      "SELECT period_name FROM dashas WHERE system='Yogini' AND substr(end_date,7,4)||'-'||substr(end_date,4,2)||'-'||substr(end_date,1,2) >= date('now') ORDER BY substr(end_date,7,4)||'-'||substr(end_date,4,2)||'-'||substr(end_date,1,2) ASC LIMIT 2";
    const yog = d.exec(yogSql);
    const yrows = yog[0]?.values as string[][] | undefined;
    if (yrows?.length) {
      const a = cleanDashaLabel(String(yrows[0][0] ?? ""));
      const b = yrows[1] ? cleanDashaLabel(String(yrows[1][0] ?? "")) : "";
      if (b && b !== "—") return `${a} MD · ${b} AD`;
      return `${a} MD`;
    }
  } catch {
    /* ignore */
  }
  return "Current Dasha";
}

export function shareImageFileName(plainBody: string): string {
  const iso = new Date().toISOString().slice(0, 10);
  const words = plainBody
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join("-")
    .toLowerCase()
    .slice(0, 48) || "insight";
  const safe = words.replace(/[^a-z0-9-]+/gi, "").replace(/^-+|-+$/g, "") || "insight";
  return `aatmabodha-${safe}-${iso}.png`;
}

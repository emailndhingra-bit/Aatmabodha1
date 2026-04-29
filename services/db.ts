
import { AnalysisResult } from "../types";
import { calculateAccurateTransits } from "./jsonMapper";

export const initDatabase = async (data: AnalysisResult, lat?: number, lng?: number) => {
  const windowObj = window as any;
  if (!windowObj.initSqlJs) {
    console.error("SQL.js not loaded");
    return null;
  }

  const SQL = await windowObj.initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  const db = new SQL.Database();

  // Helper to ensure no undefined values are passed to SQL.js
  const safe = (v: any) => (v === undefined ? null : v);

  // REFRESH TRANSITS: Ensure we have the latest real-time transits
  // This overrides cached transits which might be stale or empty
  const freshTransits = calculateAccurateTransits(undefined, lat, lng);
  const transitsToUse = (freshTransits && freshTransits.length > 0) ? freshTransits : data.currentTransits;

  // --- 1. Create Tables ---
  db.run(`
    CREATE TABLE personal (
      property TEXT, 
      value TEXT
    );

    /* COMPREHENSIVE PLANETARY MATRIX TABLE - STRICT SCHEMA */
    CREATE TABLE planets (
      planet_name TEXT PRIMARY KEY,
      D1_Rashi_sign TEXT,
      D1_Rashi_house INTEGER,
      D1_Rashi_degree TEXT,
      D1_Rashi_nakshatra TEXT,
      D1_Rashi_pada INTEGER,
      D1_Rashi_status TEXT,
      D1_Rashi_retro BOOLEAN,
      D1_Rashi_avastha TEXT,
      D1_Rashi_nbry TEXT,
      D1_Rashi_yogas TEXT,
      D1_Rashi_is_combust BOOLEAN,
      D1_Rashi_is_sandhi BOOLEAN,
      D9_Navamsha_sign TEXT,
      D9_Navamsha_house INTEGER,
      D9_Navamsha_status TEXT,
      D9_Navamsha_nbry TEXT,
      D10_Dasamsa_sign TEXT,
      D10_Dasamsa_house INTEGER,
      D10_Dasamsa_status TEXT,
      D2_Hora_sign TEXT,
      D2_Hora_house INTEGER,
      D2_Hora_status TEXT,
      D3_Drekkana_sign TEXT,
      D3_Drekkana_house INTEGER,
      D3_Drekkana_status TEXT,
      D4_Chaturthamsha_sign TEXT,
      D4_Chaturthamsha_house INTEGER,
      D4_Chaturthamsha_status TEXT,
      D7_Saptamsha_sign TEXT,
      D7_Saptamsha_house INTEGER,
      D7_Saptamsha_status TEXT,
      D12_Dwadashamsha_sign TEXT,
      D12_Dwadashamsha_house INTEGER,
      D12_Dwadashamsha_status TEXT,
      D16_Shodashamsha_sign TEXT,
      D16_Shodashamsha_house INTEGER,
      D16_Shodashamsha_status TEXT,
      D20_Vimshamsha_sign TEXT,
      D20_Vimshamsha_house INTEGER,
      D20_Vimshamsha_status TEXT,
      D24_Chaturvimshamsha_sign TEXT,
      D24_Chaturvimshamsha_house INTEGER,
      D24_Chaturvimshamsha_status TEXT,
      D27_Saptavimshamsha_sign TEXT,
      D27_Saptavimshamsha_house INTEGER,
      D27_Saptavimshamsha_status TEXT,
      D30_Trishamsha_sign TEXT,
      D30_Trishamsha_house INTEGER,
      D30_Trishamsha_status TEXT,
      D40_Khavedamsha_sign TEXT,
      D40_Khavedamsha_house INTEGER,
      D40_Khavedamsha_status TEXT,
      D45_Akshavedamsha_sign TEXT,
      D45_Akshavedamsha_house INTEGER,
      D45_Akshavedamsha_status TEXT,
      D60_Shastiamsa_sign TEXT,
      D60_Shastiamsa_house INTEGER,
      D60_Shastiamsa_status TEXT,
      shadbala_ratio REAL,
      shadbala_classification TEXT,
      kp_star_lord TEXT,
      kp_sub_lord TEXT,
      kp_sub_sub_lord TEXT,
      kp_significator_houses TEXT,
      transit_sign TEXT,
      transit_degree TEXT,
      willpower_score TEXT,
      Bhrigu_Bindu TEXT,
      Ishta_Devata TEXT,
      Vargottama BOOLEAN,
      Chalit_Bhava INTEGER,
      Bhava_Cusp TEXT,
      Aspects TEXT,
      Host_House_Points INTEGER,
      Bhinna_Ashtakvarga INTEGER,
      Yogas TEXT,
      Co_Tenants TEXT,
      Current_Sign_Transit TEXT,
      Current_Degree_Transit TEXT,
      D1_Rashi_lord TEXT,
      D1_Rashi_houses_owned TEXT,
      D1_Rashi_yoga_bhangas TEXT,
      D1_Rashi_jamini TEXT,
      KP_Cusp_Lord_Status TEXT,
      Dasha_Active_Range TEXT,
      Element_Fire_Score TEXT,
      pada_Lord TEXT,
      face_reading_implication TEXT,
      palm_reading_implication TEXT
    );

    CREATE TABLE chalit_bhava (
      house INTEGER, 
      sign TEXT, 
      cusp_degree TEXT, 
      start_degree TEXT, 
      end_degree TEXT, 
      planets_in_bhava TEXT
    );
    
    CREATE TABLE planet_shifts (
      planet TEXT,
      from_house_d1 INTEGER,
      to_house_chalit INTEGER
    );

    CREATE TABLE kp_cusps (
      cusp INTEGER, 
      degree TEXT, 
      sign TEXT, 
      nak_lord TEXT, 
      sub_lord TEXT, 
      sub_sub_lord TEXT
    );

    /* Kept for specific lookups */
    CREATE TABLE kp_significators (
      planet TEXT, 
      star_lord TEXT, 
      sub_lord TEXT, 
      sub_sub_lord TEXT,
      significator_houses TEXT
    );

    CREATE TABLE kp_house_significators (
      house INTEGER,
      planets TEXT
    );

    CREATE TABLE dashas (
      system TEXT, 
      period_name TEXT, 
      start_date TEXT, 
      end_date TEXT,
      is_sandhi BOOLEAN DEFAULT 0
    );

    CREATE TABLE shadbala (
      planet TEXT, 
      ratio REAL, 
      is_strong BOOLEAN,
      classification TEXT
    );

    CREATE TABLE ashtakvarga_summary (
      house_number INTEGER, 
      points INTEGER
    );

    CREATE TABLE divisional_charts (
      chart_name TEXT,
      planet TEXT,
      sign TEXT,
      house INTEGER,
      degree TEXT,
      status TEXT,
      nbry TEXT,
      yogas TEXT,
      yoga_bhangas TEXT,
      jamini TEXT,
      PRIMARY KEY (chart_name, planet)
    );

    CREATE TABLE bhinna_ashtakvarga (
      planet TEXT,
      house_number INTEGER,
      points INTEGER
    );

    CREATE TABLE special_points (
      point_name TEXT, 
      value TEXT
    );

    CREATE TABLE knowledge_base (
      filename TEXT,
      content TEXT
    );

    CREATE TABLE elemental_balance (
      element TEXT,
      count INTEGER
    );

    CREATE TABLE current_transits (
      planet TEXT,
      sign TEXT,
      degree TEXT,
      retro BOOLEAN
    );

    CREATE TABLE palm_analysis (
      feature_category TEXT, /* Line or Mount */
      feature_name TEXT,
      condition_desc TEXT,
      indication TEXT
    );

    CREATE TABLE body_scan_analysis (
      category TEXT,
      feature TEXT,
      value TEXT
    );

    CREATE TABLE avkahada_chakra (
      key TEXT,
      value TEXT
    );

    CREATE TABLE basic_details (
      key TEXT,
      value TEXT
    );

    CREATE TABLE favourable_points (
      key TEXT,
      value TEXT
    );

    CREATE TABLE ghatak (
      key TEXT,
      value TEXT
    );

    CREATE TABLE reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        created_at TEXT
    );
  `);

  // --- 2. Insert Data ---

  // Personal
  const insertPersonal = db.prepare("INSERT INTO personal VALUES (?, ?)");
  insertPersonal.run(['Summary', safe(data.summary) || '']);
  if (data.varshphal) {
    insertPersonal.run(['Varshphal Year', safe(data.varshphal.year) || '']);
    insertPersonal.run(['Muntha', safe(data.varshphal.muntha) || '']);
    insertPersonal.run(['Varshphal Lagna', safe(data.varshphal.varshphalLagna) || '']);
  }
  
  if (data.userContext) {
      if (data.userContext.gotra) insertPersonal.run(['Gotra', safe(data.userContext.gotra)]);
      if (data.userContext.baselineMood) insertPersonal.run(['Self Reported Baseline', safe(data.userContext.baselineMood)]);
      if (data.userContext.age) insertPersonal.run(['Photo Age', safe(data.userContext.age)]);
      if (data.userContext.gender) insertPersonal.run(['Gender', safe(data.userContext.gender)]);
      if (data.userContext.palmImageDate) insertPersonal.run(['Palm Image Date', safe(data.userContext.palmImageDate)]);
  }

  if (data.visualAnalysis) {
      insertPersonal.run(['Visual Analysis: Age', safe(data.visualAnalysis.visualAge) || '']);
      insertPersonal.run(['Visual Analysis: Element', safe(data.visualAnalysis.visualElement) || '']);
      insertPersonal.run(['Visual Analysis: Dominant Planet', safe(data.visualAnalysis.dominantPlanet) || '']);
      insertPersonal.run(['Visual Analysis: Summary', safe(data.visualAnalysis.physiognomySummary) || '']);
  }

  if (data.willpowerScore) {
      insertPersonal.run(['Willpower Score', safe(data.willpowerScore)]);
  }
  insertPersonal.free();

  if (data.avkahadaChakra) {
      const insertAvkahada = db.prepare("INSERT INTO avkahada_chakra VALUES (?, ?)");
      for (const [key, value] of Object.entries(data.avkahadaChakra)) {
          insertAvkahada.run([safe(key), safe(String(value))]);
      }
      insertAvkahada.free();
  }

  if (data.basicDetails) {
      const insertBasic = db.prepare("INSERT INTO basic_details VALUES (?, ?)");
      for (const [key, value] of Object.entries(data.basicDetails)) {
          insertBasic.run([safe(key), safe(String(value))]);
      }
      insertBasic.free();
  }

  if (data.favourablePoints) {
      const insertFavourable = db.prepare("INSERT INTO favourable_points VALUES (?, ?)");
      for (const [key, value] of Object.entries(data.favourablePoints)) {
          insertFavourable.run([safe(key), safe(String(value))]);
      }
      insertFavourable.free();
  }

  if (data.ghatak) {
      const insertGhatak = db.prepare("INSERT INTO ghatak VALUES (?, ?)");
      for (const [key, value] of Object.entries(data.ghatak)) {
          insertGhatak.run([safe(key), safe(String(value))]);
      }
      insertGhatak.free();
  }

  // Palm Analysis Persistence
  if (data.palmAnalysis) {
      const insertPalm = db.prepare("INSERT INTO palm_analysis VALUES (?, ?, ?, ?)");
      // Insert Lines
      if (data.palmAnalysis.lines) {
          data.palmAnalysis.lines.forEach(line => {
              insertPalm.run(['Line', safe(line.name), safe(line.condition), safe(line.meaning)]);
          });
      }
      // Insert Mounts
      if (data.palmAnalysis.mounts) {
          data.palmAnalysis.mounts.forEach(mount => {
              insertPalm.run(['Mount', safe(mount.name), safe(mount.condition), safe(mount.meaning)]);
          });
      }
      insertPalm.free();
      
      // Store summary in Personal for context
      const insertPersonal2 = db.prepare("INSERT INTO personal VALUES (?, ?)");
      insertPersonal2.run(['Palmistry Summary', safe(data.palmAnalysis.summary)]);
      insertPersonal2.free();
  }

  // Special Points
  const insertSpecial = db.prepare("INSERT INTO special_points VALUES (?, ?)");
  if (data.bhriguBindu) insertSpecial.run(['Bhrigu Bindu', safe(data.bhriguBindu)]);
  if (data.ishtaDevata) insertSpecial.run(['Ishta Devata', safe(data.ishtaDevata)]);
  insertSpecial.free();

  // Knowledge Base (NEW INSERTION LOGIC)
  if (data.knowledgeBase && data.knowledgeBase.length > 0) {
      const insertKB = db.prepare("INSERT INTO knowledge_base VALUES (?, ?)");
      data.knowledgeBase.forEach(kb => {
          insertKB.run([safe(kb.filename), safe(kb.content)]);
      });
      insertKB.free();
  }

  // --- NEW PLANETARY TOTALITY AGGREGATION ---
  const planetList = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Lagna'];
  const FIRE_SIGNS = ["Aries", "Leo", "Sagittarius"];

  // Helper to finding planet in a specific chart
  const findInChart = (chartName: string, pName: string) => {
      const chart = data.charts.find(c => c.name && c.name.includes(chartName));
      if (!chart) return null;
      const target = (pName === 'Lagna' && !chart.planets.find(p => p.planet === 'Lagna')) ? 'Ascendant' : pName;
      return chart.planets.find(p => p.planet === target);
  };

  // Helper: Normalize KP Sub Lord names (e.g. "Jup" -> "Jupiter")
  const normalizePlanetName = (input: string): string => {
      if (!input) return "";
      const lower = input.toLowerCase().trim();
      if (lower.startsWith('su')) return 'Sun';
      if (lower.startsWith('mo')) return 'Moon';
      if (lower.startsWith('ma')) return 'Mars';
      if (lower.startsWith('me')) return 'Mercury';
      if (lower.startsWith('ju')) return 'Jupiter';
      if (lower.startsWith('ve')) return 'Venus';
      if (lower.startsWith('sa')) return 'Saturn';
      if (lower.startsWith('ra')) return 'Rahu';
      if (lower.startsWith('ke')) return 'Ketu';
      return input;
  };

  // Helper: Get all D1 planets for Yoga checks
  const d1Chart = data.charts.find(c => c.name && (c.name.includes("D1") || c.name.includes("Rashi")));
  const allD1 = d1Chart ? d1Chart.planets : [];

  const getD1Planet = (name: string) => allD1.find(p => p.planet === name);

  const calculateCalculatedYogas = (pName: string, d1P: any): string[] => {
      if (!d1P) return [];
      const yogas: string[] = [];
      const h = d1P.house;
      
      const coTenants = allD1.filter(op => op.house === h && op.planet !== pName).map(op => op.planet);
      
      if (pName === 'Jupiter' && coTenants.includes('Rahu')) yogas.push("Guru-Chandal Dosh");
      if (pName === 'Rahu' && coTenants.includes('Jupiter')) yogas.push("Guru-Chandal Dosh");

      if ((pName === 'Sun' || pName === 'Moon') && (coTenants.includes('Rahu') || coTenants.includes('Ketu'))) yogas.push("Grahan Dosh");
      if ((pName === 'Rahu' || pName === 'Ketu') && (coTenants.includes('Sun') || coTenants.includes('Moon'))) yogas.push("Grahan Dosh");

      if (pName === 'Mars' && coTenants.includes('Rahu')) yogas.push("Angarak Dosh");
      if (pName === 'Rahu' && coTenants.includes('Mars')) yogas.push("Angarak Dosh");

      if (pName === 'Saturn' && coTenants.includes('Moon')) yogas.push("Vish Yoga");
      if (pName === 'Moon' && coTenants.includes('Saturn')) yogas.push("Vish Yoga");

      return [...new Set(yogas)]; // De-dupe
  };

  const stmt = db.prepare(`INSERT INTO planets VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )`);

  planetList.forEach(pName => {
      // 1. Chart Data
      const d1 = findInChart("D1", pName) || findInChart("Rashi", pName);
      const d9 = findInChart("D9", pName);
      const d10 = findInChart("D10", pName);
      const d2 = findInChart("D2", pName);
      const d3 = findInChart("D3", pName);
      const d4 = findInChart("D4", pName);
      const d7 = findInChart("D7", pName);
      const d12 = findInChart("D12", pName);
      const d16 = findInChart("D16", pName);
      const d20 = findInChart("D20", pName);
      const d24 = findInChart("D24", pName);
      const d27 = findInChart("D27", pName);
      const d30 = findInChart("D30", pName);
      const d40 = findInChart("D40", pName);
      const d45 = findInChart("D45", pName);
      const d60 = findInChart("D60", pName);

      // 2. Aux Data
      const kpP = data.kpSystem?.planets?.find(kp => kp.planet === pName);
      const sb = data.shadbala.find(s => s.planet === pName);
      const tr = data.currentTransits?.find(t => t.planet === pName);

      // 3. Chalit & Co-Tenants
      let chalitRow: any = null;
      let chalitHouse = 0;
      if (data.chalit && d1) {
          chalitRow = data.chalit.find(r => r.planets.includes(pName));
          if (chalitRow) chalitHouse = chalitRow.house;
      }
      
      let coTenants = "-";
      if (d1 && d1.house) {
          const others = data.planetaryDetails
              .filter(op => op.house === d1.house && op.planet !== pName)
              .map(op => op.planet)
              .join(", ");
          if (others) coTenants = others;
      }

      // 4. KP Cusp Lord Status
      let kpCuspStatus = "-";
      if (data.kpSystem && data.kpSystem.cusps) {
          const ruledCusps = data.kpSystem.cusps
              .filter(c => normalizePlanetName(c.subLord || "") === pName)
              .map(c => c.cusp)
              .join(",");
          if (ruledCusps) kpCuspStatus = `Sub Lord of Cusps: ${ruledCusps}`;
      }

      // 5. Active Yogas
      let finalYogas = "-";
      if (d1) {
          const jsonYogas = Array.isArray(d1.yogas) ? d1.yogas : String(d1.yogas || "").split(',').map(y => y.trim()).filter(y => y.length > 0 && y !== '-');
          const calculatedYogas = calculateCalculatedYogas(pName, d1);
          const allYogas = [...new Set([...jsonYogas, ...calculatedYogas])];
          if (allYogas.length > 0) finalYogas = allYogas.join(", ");
      }

      // 6. Vargottama
      let isVargottama = false;
      if (d1 && d9 && d1.sign === d9.sign) isVargottama = true;

      // 7. Ashtakvarga
      let savPoints = 0;
      let bavPoints = 0;
      if (d1 && d1.house && data.ashtakvarga) {
          savPoints = data.ashtakvarga[d1.house.toString()] || 0;
          if (data.bhinnaAshtakvarga && data.bhinnaAshtakvarga[pName]) {
              const signList = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
              const signIdx = signList.indexOf(d1.sign) + 1;
              bavPoints = data.bhinnaAshtakvarga[pName][signIdx.toString()] || 0;
          }
      }

      // 8. Dasha Active Range
      let dashaRange = "-";
      const vimshottari = data.dashas.find(d => d.systemName === "Vimshottari");
      if (vimshottari) {
          const now = new Date();
          const activeMd = vimshottari.periods.find(p => {
              const start = new Date(String(p.startDate || '').split('-').reverse().join('-'));
              const end = new Date(String(p.endDate || '').split('-').reverse().join('-'));
              return now >= start && now <= end && !p.name.includes('-');
          });
          if (activeMd && activeMd.name === pName) {
              dashaRange = `${activeMd.startDate} to ${activeMd.endDate} (Active MD)`;
          }
      }

      // 9. Element Score
      let fireScore = "-";
      if (d1 && FIRE_SIGNS.includes(d1.sign)) fireScore = "High (Fire Sign)";
      
      // 10. BIOMETRIC IMPLICATIONS (IMPROVED MAPPING)
      let faceImp = null;
      let palmImp = null;

      // Face Analysis Mapping
      if (data.visualAnalysis) {
          const va = data.visualAnalysis;
          // If dominant planet matches directly
          if (va.dominantPlanet && va.dominantPlanet.toLowerCase().includes(pName.toLowerCase())) {
              faceImp = `[DOMINANT PLANET CONFIRMED]: ${va.physiognomySummary}`;
          }
          // If Lagna, include general element and age info
          if (pName === 'Lagna' || pName === 'Ascendant') {
              faceImp = `Visual Age: ${va.visualAge} | Visual Element: ${va.visualElement} | Summary: ${va.physiognomySummary}`;
          }
      }

      // Palm Analysis Mapping (Mounts & Lines)
      const palmDetails = [];
      if (data.palmAnalysis) {
          // Mounts
          if (data.palmAnalysis.mounts) {
             const mount = data.palmAnalysis.mounts.find(m => m.name.toLowerCase().includes(pName.toLowerCase()));
             if (mount) palmDetails.push(`Mount: ${mount.condition} (${mount.meaning})`);
          }
          // Lines Mapping
          if (data.palmAnalysis.lines) {
             const lineMap: Record<string, string[]> = {
                 'Sun': ['sun', 'apollo'],
                 'Saturn': ['fate', 'destiny', 'saturn'],
                 'Mercury': ['mercury', 'health', 'business'],
                 'Venus': ['life', 'vitality'],
                 'Mars': ['mars', 'courage', 'influence'],
                 'Jupiter': ['heart', 'ambition', 'wisdom'], 
                 'Moon': ['travel', 'intuition', 'via lasciva']
             };
             
             const targetKeywords = lineMap[pName] || [];
             data.palmAnalysis.lines.forEach(line => {
                 if (targetKeywords.some(k => line.name.toLowerCase().includes(k))) {
                     palmDetails.push(`Line (${line.name}): ${line.condition} (${line.meaning})`);
                 }
             });
          }
      }
      if (palmDetails.length > 0) palmImp = palmDetails.join("; ");

      stmt.run([
          safe(pName),
          safe(d1?.sign),
          safe(d1?.house),
          safe(d1?.degree),
          safe(d1?.nakshatra),
          safe(d1?.pada),
          safe(d1?.status),
          d1 ? (d1.retrograde ? 1 : 0) : 0,
          safe(d1?.avastha),
          safe(d1?.nbry),
          safe(finalYogas),
          d1 ? (d1.isCombust ? 1 : 0) : 0,
          d1 ? (d1.isSandhi ? 1 : 0) : 0,
          safe(d9?.sign),
          safe(d9?.house),
          safe(d9?.status),
          safe(d9?.nbry),
          safe(d10?.sign),
          safe(d10?.house),
          safe(d10?.status),
          safe(d2?.sign),
          safe(d2?.house),
          safe(d2?.status),
          safe(d3?.sign),
          safe(d3?.house),
          safe(d3?.status),
          safe(d4?.sign),
          safe(d4?.house),
          safe(d4?.status),
          safe(d7?.sign),
          safe(d7?.house),
          safe(d7?.status),
          safe(d12?.sign),
          safe(d12?.house),
          safe(d12?.status),
          safe(d16?.sign),
          safe(d16?.house),
          safe(d16?.status),
          safe(d20?.sign),
          safe(d20?.house),
          safe(d20?.status),
          safe(d24?.sign),
          safe(d24?.house),
          safe(d24?.status),
          safe(d27?.sign),
          safe(d27?.house),
          safe(d27?.status),
          safe(d30?.sign),
          safe(d30?.house),
          safe(d30?.status),
          safe(d40?.sign),
          safe(d40?.house),
          safe(d40?.status),
          safe(d45?.sign),
          safe(d45?.house),
          safe(d45?.status),
          safe(d60?.sign),
          safe(d60?.house),
          safe(d60?.status),
          safe(sb?.strength) || 0,
          safe(sb?.classification),
          safe(kpP?.starLord),
          safe(kpP?.subLord),
          safe(kpP?.subSubLord),
          kpP ? (kpP.significatorHouses || []).join(',') : null,
          safe(tr?.sign),
          safe(tr?.degree),
          safe(data.willpowerScore),
          safe(data.bhriguBindu),
          safe(data.ishtaDevata),
          isVargottama ? 1 : 0,
          safe(chalitHouse),
          safe(chalitRow?.degree),
          safe(d1?.housesAspected),
          safe(savPoints),
          safe(bavPoints),
          safe(finalYogas), 
          safe(coTenants),
          safe(tr?.sign),
          safe(tr?.degree),
          safe(d1?.lord),
          safe(d1?.housesOwned),
          safe(d1?.yogaBhangas),
          safe(d1?.jamini),
          safe(kpCuspStatus),
          safe(dashaRange),
          safe(fireScore),
          (d1 && d1.pada !== undefined) ? `Pada ${d1.pada}` : null,
          safe(faceImp),
          safe(palmImp)
      ]);
  });

  stmt.free();

  // Divisional Charts
  if (data.charts && data.charts.length > 0) {
      const insertDivChart = db.prepare("INSERT INTO divisional_charts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      data.charts.forEach((chart: any) => {
          if (chart.name && chart.planets) {
              chart.planets.forEach((p: any) => {
                  insertDivChart.run([
                      safe(chart.name),
                      safe(p.planet),
                      safe(p.sign),
                      safe(p.house),
                      safe(p.degree),
                      safe(p.status),
                      safe(p.nbry),
                      safe(p.yogas),
                      safe(p.yogaBhangas),
                      safe(p.jamini)
                  ]);
              });
          }
      });
      insertDivChart.free();
  }

  // Chalit Bhava Table
  if (data.chalit) {
      const insertChalit = db.prepare("INSERT INTO chalit_bhava VALUES (?, ?, ?, ?, ?, ?)");
      data.chalit.forEach((row: any) => {
          insertChalit.run([
              safe(row.house), 
              safe(row.sign), 
              safe(row.degree), 
              safe(row.startDegree), 
              safe(row.endDegree), 
              safe(row.planets.join(', '))
          ]);
      });
      insertChalit.free();
  }
  
  // Planet Shifts
  if (data.planetShifts) {
      const insertShifts = db.prepare("INSERT INTO planet_shifts VALUES (?, ?, ?)");
      data.planetShifts.forEach((shift: any) => {
          insertShifts.run([safe(shift.planet), safe(shift.fromHouse), safe(shift.toHouse)]);
      });
      insertShifts.free();
  }

  // KP Cusps
  if (data.kpSystem && data.kpSystem.cusps) {
      const insertKPCusp = db.prepare("INSERT INTO kp_cusps VALUES (?, ?, ?, ?, ?, ?)");
      data.kpSystem.cusps.forEach((c: any) => {
          insertKPCusp.run([safe(c.cusp), safe(c.degree), safe(c.sign), safe(c.nakshatra), safe(c.subLord), safe(c.subSubLord)]);
      });
      insertKPCusp.free();
  }
  
  // KP Significators (Planets)
  if (data.kpSystem && data.kpSystem.planets) {
      const insertKPSig = db.prepare("INSERT INTO kp_significators VALUES (?, ?, ?, ?, ?)");
      data.kpSystem.planets.forEach((p: any) => {
          insertKPSig.run([
              safe(p.planet), 
              safe(p.starLord), 
              safe(p.subLord), 
              safe(p.subSubLord), 
              safe((p.significatorHouses || []).join(', '))
          ]);
      });
      insertKPSig.free();
  }

  // KP House Significators
  if (data.kpSystem && data.kpSystem.houseSignificators) {
      const insertKPHouseSig = db.prepare("INSERT INTO kp_house_significators VALUES (?, ?)");
      data.kpSystem.houseSignificators.forEach((h: any) => {
          insertKPHouseSig.run([safe(h.house), safe((h.planets || []).join(', '))]);
      });
      insertKPHouseSig.free();
  }

  // Dashas
  const insertDasha = db.prepare("INSERT INTO dashas VALUES (?, ?, ?, ?, ?)");
  data.dashas.forEach((sys: any) => {
      sys.periods.forEach((p: any) => {
          insertDasha.run([safe(sys.systemName), safe(p.name), safe(p.startDate), safe(p.endDate), p.isSandhi ? 1 : 0]);
      });
  });
  insertDasha.free();

  // Process CD.txt Chara Dasha if available
  // CD.txt format: [{mdLord, adLord, startDate, endDate}]
  // period_name = "mdLord AD:adLord"
  if (data.charaDasha && Array.isArray(data.charaDasha)) {
    const insertChara = db.prepare(
      "INSERT INTO dashas VALUES (?, ?, ?, ?, ?)"
    );
    data.charaDasha.forEach((p: any) => {
      const periodName = `${p.mdLord} AD:${p.adLord}`;
      insertChara.run([
        'Chara (Jaimini)',
        periodName,
        safe(p.startDate),
        safe(p.endDate),
        0
      ]);
    });
    insertChara.free();
  }

  // Process YD.txt Yogini Dasha if available
  // AnalysisResult field name: data.yogini (per handoff doc)
  // Format: [{mdLord, adLord, startDate, endDate}] — same as Chara
  if ((data as any).yogini && Array.isArray((data as any).yogini)) {
    const insertYogini = db.prepare(
      "INSERT INTO dashas VALUES (?, ?, ?, ?, ?)"
    );
    (data as any).yogini.forEach((p: any) => {
      const periodName = `${p.mdLord} AD:${p.adLord}`;
      insertYogini.run([
        'Yogini',
        periodName,
        safe(p.startDate),
        safe(p.endDate),
        0
      ]);
    });
    insertYogini.free();
  }

  // Shadbala
  const insertShadbala = db.prepare("INSERT INTO shadbala VALUES (?, ?, ?, ?)");
  data.shadbala.forEach((s: any) => {
      insertShadbala.run([safe(s.planet), safe(s.strength), s.isStrong ? 1 : 0, safe(s.classification)]);
  });
  insertShadbala.free();

  // Ashtakvarga Summary
  const insertAV = db.prepare("INSERT INTO ashtakvarga_summary VALUES (?, ?)");
  Object.entries(data.ashtakvarga).forEach(([house, points]) => {
      insertAV.run([parseInt(house), points]);
  });
  insertAV.free();

  // Bhinna Ashtakvarga
  if (data.bhinnaAshtakvarga) {
      const insertBAV = db.prepare("INSERT INTO bhinna_ashtakvarga VALUES (?, ?, ?)");
      Object.entries(data.bhinnaAshtakvarga).forEach(([planet, scores]: [string, any]) => {
          Object.entries(scores).forEach(([house, points]) => {
              insertBAV.run([planet, parseInt(house), points]);
          });
      });
      insertBAV.free();
  }

  // summary_bav_by_rashi from ATPT.txt
  // Format: {Sun: {scores: {1:6, 2:4, ...}}, ...}
  if (data.summaryBavByRashi) {
    const insertBAV = db.prepare(
      "INSERT INTO bhinna_ashtakvarga VALUES (?, ?, ?)"
    );
    Object.entries(data.summaryBavByRashi).forEach(
      ([planet, data]: [string, any]) => {
        const scores = data.scores || data;
        Object.entries(scores).forEach(([house, points]) => {
          insertBAV.run([planet, parseInt(house), points as number]);
        });
      }
    );
    insertBAV.free();
  }

  // Elemental Balance
  if (data.elementalBalance) {
      const insertElem = db.prepare("INSERT INTO elemental_balance VALUES (?, ?)");
      Object.entries(data.elementalBalance).forEach(([element, count]) => {
          insertElem.run([element, count]);
      });
      insertElem.free();
  }

  // Current Transits
  if (transitsToUse) {
      const insertTransit = db.prepare("INSERT INTO current_transits VALUES (?, ?, ?, ?)");
      transitsToUse.forEach((t: any) => {
          insertTransit.run([safe(t.planet), safe(t.sign), safe(t.degree), t.retrograde ? 1 : 0]);
      });
      insertTransit.free();
  }

  return db;
};

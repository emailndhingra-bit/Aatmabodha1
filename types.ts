
export interface PlanetInfo {
  planet: string;
  sign: string;
  degree?: string;
  nakshatra?: string;
  pada?: number;      
  house?: number;
  retrograde?: boolean;
  lord?: string;       
  housesOwned?: string;      
  housesAspected?: string;    
  status?: string;     
  avastha?: string;    
  nbry?: string;       
  jamini?: string;     
  yogas?: string;      
  isCombust?: boolean; 
  isSandhi?: boolean;  
  yogaBhangas?: string; 
}

export interface ChartData {
  name: string; 
  planets: PlanetInfo[];
  ascendantSign?: string;
  ascendantSignNumber?: number; 
}

export interface ShadbalaData {
  planet: string;
  strength: number; 
  percentage?: number;
  isStrong?: boolean;
  classification?: string; 
}

export interface DashaPeriod {
  name: string; 
  startDate: string;
  endDate: string;
  isSandhi?: boolean; 
}

export interface DashaSystem {
  systemName: string; 
  currentDasha?: DashaPeriod; 
  periods: DashaPeriod[]; 
}

export interface AshtakvargaRow {
  sign: string;
  house: number;
  points: number;
}

export interface ChalitRow {
  house: number;
  sign?: string;
  degree?: string; 
  startDegree?: string; 
  endDegree?: string; 
  planets: string[]; 
}

export interface PlanetaryShift {
  planet: string;
  fromHouse: number; 
  toHouse: number;   
}

export interface KPCusp {
  cusp: number;
  degree: string;
  sign?: string;
  nakshatra?: string;
  subLord?: string;
  subSubLord?: string; 
}

export interface KPPlanet {
  planet: string;
  significatorHouses?: number[];
  starLord?: string;
  subLord?: string;
  subSubLord?: string; 
}

export interface KPHouseSignificator {
  house: number;
  planets: string[];
}

export interface Varshphal {
  year?: string;
  muntha?: string;
  munthaLord?: string;
  varshphalLagna?: string;
  varshphalLagnaLord?: string;
  location?: string;
}

export interface PrastharaTable {
  planet: string; 
  rows: {
    sign: string; 
    points: number; 
  }[];
  matrix?: {
    donor: string;
    points: number[]; 
  }[];
}

export interface KnowledgeItem {
  filename: string;
  content: string;
}

export interface TransitInfo {
  planet: string;
  sign: string;
  degree: string;
  retrograde: boolean;
}

export interface VisualAnalysis {
  visualAge: string;
  visualElement: string;
  dominantPlanet: string;
  physiognomySummary: string;
}

export interface PalmAnalysis {
  lines: { name: string; condition: string; meaning: string }[];
  mounts: { name: string; condition: string; meaning: string }[];
  summary: string;
}

export interface BookChapter {
    chapter: number;
    title: string;
    timePeriod: string; 
    narrative: string;
    visualPrompt: string;
    ageContext: string; 
}

export interface AvkahadaChakra {
  [key: string]: any;
}

export interface BasicDetails {
  [key: string]: any;
}

export interface FavourablePoints {
  [key: string]: any;
}

export interface Ghatak {
  [key: string]: any;
}

export interface AnalysisResult {
  summary: string;
  charts: ChartData[];
  shadbala: ShadbalaData[];
  planetaryDetails: PlanetInfo[];
  dashas: DashaSystem[];
  chalit: ChalitRow[];
  planetShifts: PlanetaryShift[]; 
  ashtakvarga: Record<string, number>; 
  bhinnaAshtakvarga?: Record<string, Record<string, number>>; 
  summaryBavByRashi?: any;
  willpowerScore?: any;
  charaDasha?: any[];
  kpSystem?: {
    cusps: KPCusp[];
    planets: KPPlanet[];
    houseSignificators?: KPHouseSignificator[];
  };
  varshphal?: Varshphal;
  avkahadaChakra?: AvkahadaChakra;
  basicDetails?: BasicDetails;
  favourablePoints?: FavourablePoints;
  ghatak?: Ghatak;
  prastharashtakvarga?: PrastharaTable[];
  bhriguBindu?: string;
  ishtaDevata?: string;
  knowledgeBase?: KnowledgeItem[];
  elementalBalance?: Record<string, number>; 
  currentTransits?: TransitInfo[]; 
  userContext?: {
      gotra?: string;
      baselineMood?: string;
      age?: string;
      gender?: string; 
      hasPhoto?: boolean;
      hasPalm?: boolean;
      palmImageDate?: string;
  };
  visualAnalysis?: VisualAnalysis;
  palmAnalysis?: PalmAnalysis;
  lifeBook?: BookChapter[]; 
}

export interface RawInput {
  Personal: { 
      dob: string; 
      city: string; 
      lagna: string; 
      muntha: string;
      Will_Power_Score?: string | number; 
  };
  D1: any[];
  D9: any[];
  D10?: any[];
  D60?: any[];
  KP_System: {
    cusps: any[];
    planets: any[];
    ruling: any[];
    planetSignificators?: any[]; 
    houseSignificators?: any[]; 
  };
  planetSignificators?: { planet: string; houses: string | number[] }[]; 
  houseSignificators?: { house: string | number; planets: string | string[] }[]; 
  summary_bav: {
    [key: string]: { scores: Record<string, number>; total: number };
  };
  summary_bav_by_rashi?: {
    [key: string]: { scores: Record<string, number>; total: number };
  };
  prasthara_pav: {
    [key: string]: { matrix: Record<string, number[]>; totalPoints: number[] };
  };
  vimshottari?: any[];
  yogini?: any[];
  chara?: any[];
  chalit?: any[];
  Chalit_Table?: any[]; 
  Chalit_System?: any; 
  House_Scores?: Record<string, number>;
  ashtakvarga?: Record<string, number>;
  shadbala?: any[];
  varshphal?: any;
  bhriguBindu?: string;
  ishtaDevata?: string;
  charts?: any[];
  dashas?: any[];
  summary?: string;
  knowledgeBase?: KnowledgeItem[];
  Will_Power_Score?: string | number; 
  WillPowerScore?: string | number; 
  will_power?: string | number; 
  [key: string]: any; // Allow loose typing for other fields
}

export interface Gem {
  id: string;
  type: 'strength' | 'weakness';
  title: string;
  description: string;
  remedyTitle: string;
  remedy: string;
  planet?: string;
  tag: string;
}

export interface RectificationQuestion {
  question: string;
  optionA: string;
  optionB: string;
  reasoning: string;
}

export interface RectificationResult {
  confidenceScore: number;
  verdict: string;
  visualMatchAnalysis?: string;
  palmMatchAnalysis?: string;
  rectificationQuestions: RectificationQuestion[];
}

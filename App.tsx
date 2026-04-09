
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Loader2, Sparkles, Moon, Table as TableIcon, LayoutGrid, Star, Database, Eye, MessageSquare, BarChart3, Diamond, RefreshCw, Scroll, Camera, UserCircle, Compass, Clock, CheckCircle, AlertTriangle, Play, Hand, Calendar, Book, History, X, Globe, Languages, Mic, ArrowRight, HelpCircle, Crown, Shield } from 'lucide-react';
import { processAstrologyJson, identifyMissingData, enrichData, calculateAccurateTransits, getSignNum, getSignName, PLANET_LORDS } from './services/jsonMapper';
import { initDatabase } from './services/db';
import { createChatSession } from './services/geminiService';
import { processFileContent, processZipFile } from './services/fileProcessor';
import { AnalysisResult, RawInput } from './types';
import { saveProfile, getMyProfiles, deleteProfile } from './services/profileService';

import NorthIndianChart from './components/ChartVisualizer';
import PlanetaryTable from './components/PlanetaryTable';
import ShadbalaChart from './components/ShadbalaChart';
import DashaDisplay from './components/DashaDisplay';
import KPDisplay from './components/KPDisplay';
import VarshphalDisplay from './components/VarshphalDisplay';
import PrastharaDisplay from './components/PrastharaDisplay';
import AshtakvargaTable from './components/AshtakvargaTable';
import ChalitTable from './components/ChalitTable';
import ChatInterface from './components/ChatInterface';
import CosmicFAQ from './components/CosmicFAQ';
import DailyForecast from './components/DailyForecast';
import DatabaseViewer from './components/DatabaseViewer';
import BasicDetailsDisplay from './components/BasicDetailsDisplay';
import TraditionalSummary from './components/TraditionalSummary';
import Login from './src/pages/Login';
import AuthCallback from './src/pages/AuthCallback';
import PendingApproval from './src/pages/PendingApproval';
import AdminDashboard from './src/pages/AdminDashboard';

type CultureMode = 'EN' | 'JP' | 'HI';

function convertToISTForAPI(dob: string, tob: string, timezoneOffset: number) {
  const [year, month, day] = dob.split('-').map(Number);
  const [hour, minute] = tob.split(':').map(Number);
  
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMs = timezoneOffset * 60 * 60 * 1000;
  const trueUtcTime = utcDate.getTime() - offsetMs;
  
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = trueUtcTime + istOffsetMs;
  
  const istDate = new Date(istTime);
  const istDob = istDate.toISOString().split('T')[0];
  const istTob = istDate.toISOString().split('T')[1].substring(0, 5);
  
  return { date_of_birth: istDob, time_of_birth: istTob };
}

const App: React.FC = () => {
  const path = window.location.pathname;
  if (path === '/login') return <Login />;
  if (path === '/auth/callback') return <AuthCallback />;
  if (path === '/auth/pending') return <PendingApproval />;
  if (path === '/admin') return <AdminDashboard />;
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbInstance, setDbInstance] = useState<any>(null);
  const [showDbViewer, setShowDbViewer] = useState(false);
  
  // Password Protection State
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const checkProAccess = (action: () => void) => {
    if (isProUnlocked) {
      action();
    } else {
      setPendingAction(() => action);
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "A@tmab0dha") {
      setIsProUnlocked(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setPasswordError(true);
    }
  };
  
  // Localization State
  const [cultureMode, setCultureMode] = useState<CultureMode>('EN');

  // Missing Data Calculation State
  const [missingDataOptions, setMissingDataOptions] = useState<string[]>([]);
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([]);
  const [pendingData, setPendingData] = useState<AnalysisResult | null>(null);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  
  // Navigation State
  const [viewMode, setViewMode] = useState<'dashboard' | 'chat' | 'faq' | 'daily'>('chat');
  const [chatSession, setChatSession] = useState<any>(null);
  const [language, setLanguage] = useState<string | null>(null);
  
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Trigger specific prompts from other views
  const [triggerPrompt, setTriggerPrompt] = useState<string | null>(null);

  // User Identity State (Photo & Age)
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userAge, setUserAge] = useState<string>('');
  
  // Palmistry State
  const [userPalm, setUserPalm] = useState<string | null>(null);
  const [palmImageDate, setPalmImageDate] = useState<string>('');
  
  // New Identity Fields for NRFV-Ω V15.2
  const [userGotra, setUserGotra] = useState<string>('');
  const [userMood, setUserMood] = useState<string>('Prefer not to say'); 
  const [userGender, setUserGender] = useState<string>('Prefer not to say');

  // ── Consent & Vault State ─────────────────────────────
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentResearch, setConsentResearch] = useState(false);
  const [consentPartnerShare, setConsentPartnerShare] = useState(false);
  const CONSENT_VERSION = '1.0';

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Birth Details State
  const [userName, setUserName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [tob, setTob] = useState<string>('');
  const [timezone, setTimezone] = useState<number>(5.5);
  const [timezoneName, setTimezoneName] = useState<string>('');
  const [pobQuery, setPobQuery] = useState<string>('');
  const [pobSuggestions, setPobSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<string>('');
  const [lon, setLon] = useState<string>('');
  const [isSearchingPob, setIsSearchingPob] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // --- TIMEZONE CALCULATION LOGIC ---
  useEffect(() => {
    if (timezoneName) {
      try {
        const dateStr = dob || new Date().toISOString().split('T')[0];
        const timeStr = tob || '12:00';
        const timeParts = timeStr.split(':');
        const hours = timeParts[0] ? timeParts[0].padStart(2, '0') : '12';
        const minutes = timeParts[1] ? timeParts[1].padStart(2, '0') : '00';
        const formattedTimeStr = `${hours}:${minutes}:00`;
        const localDate = new Date(`${dateStr}T${formattedTimeStr}Z`); // Treat as UTC initially
        
        if (isNaN(localDate.getTime())) {
            throw new Error("Invalid time value constructed");
        }

        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezoneName,
          timeZoneName: 'shortOffset',
        });
        
        const parts = formatter.formatToParts(localDate);
        const tzNamePart = parts.find(p => p.type === 'timeZoneName');
        
        if (tzNamePart && tzNamePart.value) {
          let offsetStr = tzNamePart.value.replace('GMT', '');
          if (!offsetStr) {
            setTimezone(0);
            localStorage.setItem('vedicUserTimezone', '0');
          } else {
            const sign = offsetStr.startsWith('-') ? -1 : 1;
            offsetStr = offsetStr.replace(/[+-]/, '');
            const [hours, minutes] = offsetStr.split(':').map(Number);
            const calculatedTimezone = sign * (hours + (minutes || 0) / 60);
            setTimezone(calculatedTimezone);
            localStorage.setItem('vedicUserTimezone', calculatedTimezone.toString());
          }
        }
      } catch (e) {
        console.error("Error calculating timezone offset", e);
      }
    }
  }, [dob, tob, timezoneName]);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = localStorage.getItem('vedicAstroData');
        const cachedPhoto = localStorage.getItem('vedicUserPhoto');
        const cachedPalm = localStorage.getItem('vedicUserPalm');
        const cachedAge = localStorage.getItem('vedicUserAge');
        const cachedGotra = localStorage.getItem('vedicUserGotra');
        const cachedMood = localStorage.getItem('vedicUserMood');
        const cachedGender = localStorage.getItem('vedicUserGender');
        const cachedPalmDate = localStorage.getItem('vedicUserPalmDate');
        const cachedLoc = localStorage.getItem('vedicUserLocation');
        const cachedTimezoneName = localStorage.getItem('vedicUserTimezoneName');
        const cachedTimezone = localStorage.getItem('vedicUserTimezone');

        if (cachedPhoto) setUserPhoto(cachedPhoto);
        if (cachedPalm) setUserPalm(cachedPalm);
        if (cachedAge) setUserAge(cachedAge);
        if (cachedGotra) setUserGotra(cachedGotra);
        if (cachedMood) setUserMood(cachedMood);
        if (cachedGender) setUserGender(cachedGender);
        if (cachedPalmDate) setPalmImageDate(cachedPalmDate);
        if (cachedTimezoneName) setTimezoneName(cachedTimezoneName);
        if (cachedTimezone) setTimezone(parseFloat(cachedTimezone));
        
        const cachedConsent = localStorage.getItem('vedicConsentVersion');
        if (cachedConsent === CONSENT_VERSION) {
          setHasConsent(true);
          setConsentResearch(localStorage.getItem('vedicConsentResearch') === 'true');
          setConsentPartnerShare(localStorage.getItem('vedicConsentPartnerShare') === 'true');
        }

        let lat, lng;
        if (cachedLoc && cachedLoc.includes(',')) {
            const [la, ln] = cachedLoc.split(',').map(s => parseFloat(s.trim()));
            if (!isNaN(la) && !isNaN(ln)) {
                lat = la; lng = ln;
                setUserLocation({lat, lng});
            }
        }

        if (cached) {
          console.log("Found cached cosmic data, re-hydrating...");
          const parsedData = JSON.parse(cached);
          setData(parsedData);
          
          // Re-initialize Database silently
          const db = await initDatabase(parsedData, lat, lng);
          setDbInstance(db);
        }
      } catch (e) {
        console.error("Failed to load cached data", e);
        localStorage.removeItem('vedicAstroData');
      }
    };
    loadCachedData();
  }, []);

  const handleRefresh = async () => {
    if (!data) return;
    setAnalyzing(true);
    try {
      // 1. Try to get fresh location if missing
      let lat = userLocation?.lat;
      let lng = userLocation?.lng;
      
      if (!lat || !lng) {
          try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
              });
              lat = position.coords.latitude;
              lng = position.coords.longitude;
              setUserLocation({ lat, lng });
              localStorage.setItem('vedicUserLocation', `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } catch (e) {
              console.log("Geolocation skipped during refresh");
          }
      }

      // 2. Re-calculate transits with location
      const freshTransits = calculateAccurateTransits(undefined, lat, lng);
      
      // 3. Update data object (ensure it's a deep-ish copy to trigger re-renders)
      const updatedData = { 
          ...data, 
          currentTransits: freshTransits,
          refreshTimestamp: new Date().toISOString() // Force change
      };
      
      // 4. Re-init DB with location
      const db = await initDatabase(updatedData, lat, lng);
      
      // 5. Update states
      setDbInstance(db);
      setData(updatedData);
      
      // 6. Save to local storage
      localStorage.setItem('vedicAstroData', JSON.stringify(updatedData));
      
      // 7. Small delay for visual feedback
      await new Promise(r => setTimeout(r, 800));
      
      alert(cultureMode === 'HI' ? "डेटा और ट्रांजिट अपडेट किए गए।" : "Charts & DB refreshed with latest transits.");
    } catch (err) {
      console.error("Refresh failed", err);
      alert("Refresh failed. Please check your connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    // Clear all related local storage
    localStorage.removeItem('vedicAstroData');
    localStorage.removeItem('vedicUserPhoto');
    localStorage.removeItem('vedicUserPalm');
    localStorage.removeItem('vedicUserAge');
    localStorage.removeItem('vedicUserGotra');
    localStorage.removeItem('vedicUserMood');
    localStorage.removeItem('vedicUserGender');
    localStorage.removeItem('vedicUserLocation');
    localStorage.removeItem('vedicUserPalmDate');
    localStorage.removeItem('vedicLifeBook');
    localStorage.removeItem('vedicBtrPerformed');
    localStorage.removeItem('vedicChatHistory');
    localStorage.removeItem('vedicQueryAnalytics');
    // Keep consent — user doesn't need to re-consent after reset
    // localStorage.removeItem('vedicConsentVersion'); // Uncomment only for full wipe
    
    // Clear any daily forecasts cached
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('vedicDaily_')) {
            localStorage.removeItem(key);
        }
    });

    // Force Reload to clear memory and start from scratch
    window.location.reload();
  };
  
  // Helper to identify array content type
  const identifyArrayType = (arr: any[]): 'vimshottari' | 'yogini' | 'chara' | 'unknown' => {
    if (arr.length === 0) return 'unknown';
    const sample = arr[0];
    if (!sample.mdLord) return 'unknown';

    // Check specific values to determine type
    const lord = String(sample.mdLord).trim().toUpperCase();
    const yoginiLords = ["MANGALA", "PINGALA", "DHANYA", "BHRAMARI", "BHADRIKA", "ULKA", "SIDDHA", "SANKATA"];
    if (yoginiLords.includes(lord)) return 'yogini';

    const signs = ["ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "SCO", "SAG", "CAP", "AQU", "PIS", "ARIES", "TAURUS", "GEMINI", "CANCER", "VIRGO", "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"];
    if (signs.some(s => lord.includes(s) || s.includes(lord))) return 'chara';

    return 'vimshottari';
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setUserPhoto(base64);
          localStorage.setItem('vedicUserPhoto', base64);
      };
      reader.readAsDataURL(file);
  };

  const handlePalmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setUserPalm(base64);
          localStorage.setItem('vedicUserPalm', base64);
      };
      reader.readAsDataURL(file);
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setUserAge(val);
      localStorage.setItem('vedicUserAge', val);
  };

  const handleGotraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setUserGotra(val);
      localStorage.setItem('vedicUserGotra', val);
  };

  const handleMoodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setUserMood(val);
      localStorage.setItem('vedicUserMood', val);
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setUserGender(val);
      localStorage.setItem('vedicUserGender', val);
  };

  const finalizeData = async (finalData: AnalysisResult) => {
      setData(finalData);
      try {
        localStorage.setItem('vedicAstroData', JSON.stringify(finalData));
      } catch (storageErr) {
        console.warn("Chart data too large for local storage.", storageErr);
      }
      const db = await initDatabase(finalData);
      setDbInstance(db);
      setAnalyzing(false);
      setShowCalculationModal(false);
      setPendingData(null);
      // Show consent modal on first chart generation if not yet consented
      if (!hasConsent) {
        setShowConsentModal(true);
      }
      try {
        const token = localStorage.getItem('auth_token');
        const formData = {
          name: userName,
          gender: userGender,
          dob,
          tob,
          city: pobQuery,
          lat,
          lon,
          timezone,
        };
        if (token && formData) {
          await saveProfile({
            name: formData.name || 'My Profile',
            gender: formData.gender,
            dateOfBirth: formData.dob,
            timeOfBirth: formData.tob,
            placeOfBirth: formData.city,
            latitude: formData.lat ? parseFloat(formData.lat) : undefined,
            longitude: formData.lon ? parseFloat(formData.lon) : undefined,
            timezone: String(formData.timezone),
          });
          const profiles = await getMyProfiles();
          setSavedProfiles(profiles);
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Maximum 2 profiles')) {
          setProfileSaveError('You have reached the maximum of 2 profiles. Please delete one to add a new person.');
        }
      }
  };

  const handleConsentAccept = () => {
    // Mandatory consent (required to use the app)
    localStorage.setItem('vedicConsentVersion', CONSENT_VERSION);
    localStorage.setItem('vedicConsentTimestamp', new Date().toISOString());
    localStorage.setItem('vedicConsentResearch', consentResearch.toString());
    localStorage.setItem('vedicConsentPartnerShare', consentPartnerShare.toString());
    setHasConsent(true);
    setShowConsentModal(false);
  };

  // ── Vault Export ──────────────────────────────────────
  const handleExportVault = () => {
    try {
      const vault = {
        vaultVersion: '1.0',
        exportedAt: new Date().toISOString(),
        appName: 'Aatmabodha',
        chartData: JSON.parse(localStorage.getItem('vedicAstroData') || 'null'),
        // Photos stored as base64 — include in vault for full recovery
        userPhoto: localStorage.getItem('vedicUserPhoto') || null,
        userPalm: localStorage.getItem('vedicUserPalm') || null,
        userAge: localStorage.getItem('vedicUserAge') || '',
        userGotra: localStorage.getItem('vedicUserGotra') || '',
        userMood: localStorage.getItem('vedicUserMood') || '',
        userGender: localStorage.getItem('vedicUserGender') || '',
        userName: userName || '',
        userLocation: localStorage.getItem('vedicUserLocation') || '',
        timezoneName: localStorage.getItem('vedicUserTimezoneName') || '',
        timezone: localStorage.getItem('vedicUserTimezone') || '',
        // Last 50 chat messages (no full chart data injections — just conversations)
        chatHistory: (() => {
          try { return JSON.parse(localStorage.getItem('vedicChatHistory') || '[]'); }
          catch { return []; }
        })(),
        preferences: {
          language: localStorage.getItem('vedicLanguage') || null,
          cultureMode: cultureMode,
        },
        consent: {
          version: CONSENT_VERSION,
          timestamp: localStorage.getItem('vedicConsentTimestamp') || '',
          research: consentResearch,
          partnerShare: consentPartnerShare,
        },
      };

      const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aatmabodha-vault-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Vault export failed', e);
      alert('Export failed. Please try again.');
    }
  };

  // ── Vault Import ──────────────────────────────────────
  const handleImportVault = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const vault = JSON.parse(text);

      if (vault.appName !== 'Aatmabodha' || !vault.chartData) {
        alert('Invalid vault file. Please use a valid Aatmabodha export.');
        return;
      }

      // Restore all user data from vault
      if (vault.chartData) localStorage.setItem('vedicAstroData', JSON.stringify(vault.chartData));
      if (vault.userPhoto) { localStorage.setItem('vedicUserPhoto', vault.userPhoto); setUserPhoto(vault.userPhoto); }
      if (vault.userPalm) { localStorage.setItem('vedicUserPalm', vault.userPalm); setUserPalm(vault.userPalm); }
      if (vault.userAge) { localStorage.setItem('vedicUserAge', vault.userAge); setUserAge(vault.userAge); }
      if (vault.userGotra) { localStorage.setItem('vedicUserGotra', vault.userGotra); setUserGotra(vault.userGotra); }
      if (vault.userMood) { localStorage.setItem('vedicUserMood', vault.userMood); setUserMood(vault.userMood); }
      if (vault.userGender) { localStorage.setItem('vedicUserGender', vault.userGender); setUserGender(vault.userGender); }
      if (vault.userLocation) localStorage.setItem('vedicUserLocation', vault.userLocation);
      if (vault.timezoneName) { localStorage.setItem('vedicUserTimezoneName', vault.timezoneName); setTimezoneName(vault.timezoneName); }
      if (vault.timezone) { localStorage.setItem('vedicUserTimezone', vault.timezone); setTimezone(parseFloat(vault.timezone)); }
      if (vault.chatHistory?.length) localStorage.setItem('vedicChatHistory', JSON.stringify(vault.chatHistory));
      if (vault.consent?.version) {
        localStorage.setItem('vedicConsentVersion', vault.consent.version);
        localStorage.setItem('vedicConsentTimestamp', vault.consent.timestamp || new Date().toISOString());
        localStorage.setItem('vedicConsentResearch', (vault.consent.research || false).toString());
        localStorage.setItem('vedicConsentPartnerShare', (vault.consent.partnerShare || false).toString());
        setHasConsent(true);
        setConsentResearch(vault.consent.research || false);
        setConsentPartnerShare(vault.consent.partnerShare || false);
      }

      // Re-init DB from restored chart data
      const parsedData = vault.chartData;
      setData(parsedData);
      const db = await initDatabase(parsedData);
      setDbInstance(db);

      alert('✦ Your Cosmic Vault has been restored. Your chart and conversation history are back.');
    } catch (e) {
      console.error('Vault import failed', e);
      alert('Import failed. The file may be corrupted. Please try a different vault file.');
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleCalculateMissing = () => {
      if (!pendingData) return;
      const dobStr = pendingData.summary ? pendingData.summary.split('Date of Birth: ')[1] : ''; // Basic extraction
      const enriched = enrichData(pendingData, selectedCalculations, dobStr);
      finalizeData(enriched);
  };

  const handleSkipCalculation = () => {
      if (pendingData) finalizeData(pendingData);
  };

  const toggleCalculation = (opt: string) => {
      if (selectedCalculations.includes(opt)) {
          setSelectedCalculations(selectedCalculations.filter(x => x !== opt));
      } else {
          setSelectedCalculations([...selectedCalculations, opt]);
      }
  };

  // --- API CHART GENERATION LOGIC ---
  const handlePobSearch = (query: string) => {
      setPobQuery(query);
      
      if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
      }

      if (query.length > 2) {
          setIsSearchingPob(true);
          debounceTimer.current = setTimeout(async () => {
              try {
                  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
                  const data = await res.json();
                  if (data.results) {
                      const formattedSuggestions = data.results.map((item: any) => ({
                          display_name: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}${item.country ? ', ' + item.country : ''}`,
                          lat: item.latitude,
                          lon: item.longitude,
                          timezone: item.timezone
                      }));
                      setPobSuggestions(formattedSuggestions);
                  } else {
                      setPobSuggestions([]);
                  }
              } catch (e) {
                  console.error("Failed to fetch location suggestions", e);
                  setPobSuggestions([]);
              } finally {
                  setIsSearchingPob(false);
              }
          }, 500);
      } else {
          setPobSuggestions([]);
          setIsSearchingPob(false);
      }
  };

  const selectPob = (suggestion: any) => {
      setLat(parseFloat(suggestion.lat).toFixed(4));
      setLon(parseFloat(suggestion.lon).toFixed(4));
      setPobQuery(suggestion.display_name);
      if (suggestion.timezone) {
          setTimezoneName(suggestion.timezone);
          localStorage.setItem('vedicUserTimezoneName', suggestion.timezone);
      }
      setPobSuggestions([]);
  };

  const enrichRawData = (parsed: any, tzOffset: number, longitudeStr: string) => {
      const avkahadaChakraObj = parsed.Avakahada_Chakra || parsed.avkahadaChakra || {};
      
      // 1. Calculate Paya
      let d1Raw = Array.isArray(parsed.D1) ? parsed.D1 : [];
      if (d1Raw.length === 0 && Array.isArray(parsed.charts) && parsed.charts.length > 0) {
          const d1 = parsed.charts.find((c: any) => c.name && (c.name.includes("D1") || c.name.includes("Rashi")));
          if (d1 && Array.isArray(d1.planets)) d1Raw = d1.planets;
      }
      const moon = d1Raw.find((p: any) => p.planet === 'Moon' || p.name === 'Moon');
      if (moon) {
          const signNum = moon.rashi ? parseInt(String(moon.rashi)) : getSignNum(moon.sign);
          
          const parseDegreeToFloat = (degStr: string | number): number => {
              if (typeof degStr === 'number') return degStr;
              if (!degStr) return 0;
              const parts = degStr.split(/[:°'"\- ]/);
              const d = parseFloat(parts[0]) || 0;
              const m = parseFloat(parts[1]) || 0;
              const s = parseFloat(parts[2]) || 0;
              return d + m / 60 + s / 3600;
          };

          const degVal = parseDegreeToFloat(moon.degree || moon.deg);
          const moonLon = (signNum - 1) * 30 + degVal;
          const nakNum = Math.floor(moonLon / (360/27)) + 1;
          const PAYA_MAP: Record<number, string> = {
              1:"Gold",  2:"Silver",  3:"Copper", 4:"Silver", 5:"Gold",
              6:"Iron",  7:"Silver",  8:"Copper", 9:"Iron",
              10:"Silver", 11:"Silver", 12:"Copper", 13:"Silver", 14:"Gold",
              15:"Iron", 16:"Silver", 17:"Copper", 18:"Iron",
              19:"Gold", 20:"Silver", 21:"Copper", 22:"Silver", 23:"Gold",
              24:"Iron", 25:"Silver", 26:"Copper", 27:"Iron"
          };
          avkahadaChakraObj.Paya = PAYA_MAP[nakNum];
      }

      // 2. Correct Sunrise and Sunset
      if ((avkahadaChakraObj.Sunrise || avkahadaChakraObj.Sunset) && longitudeStr && !isNaN(parseFloat(longitudeStr))) {
          const lmtOffset = parseFloat(longitudeStr) / 15;
          const correction = (tzOffset || 5.5) - lmtOffset;
          
          const correctTime = (apiTimeStr: any, correctionHours: number) => {
              if (!apiTimeStr || typeof apiTimeStr !== 'string') return apiTimeStr;
              const isPM = apiTimeStr.toUpperCase().includes('PM');
              const cleanStr = apiTimeStr.replace(/[^\d:]/g, '');
              const parts = cleanStr.split(":").map(Number);
              if (parts.length < 2) return apiTimeStr;
              let h = parts[0] || 0;
              if (isPM && h < 12) h += 12;
              if (!isPM && h === 12) h = 0;
              const m = parts[1] || 0;
              const s = parts[2] || 0;
              let totalMin = h * 60 + m + s / 60 + correctionHours * 60;
              totalMin = ((totalMin % 1440) + 1440) % 1440;
              const hh = Math.floor(totalMin / 60);
              const mm = Math.floor(totalMin % 60);
              const ss = Math.round((totalMin % 1) * 60);
              return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
          };

          if (avkahadaChakraObj.Sunrise) {
              avkahadaChakraObj.Sunrise = correctTime(avkahadaChakraObj.Sunrise, correction);
          }
          if (avkahadaChakraObj.Sunset) {
              avkahadaChakraObj.Sunset = correctTime(avkahadaChakraObj.Sunset, correction);
          }
      }
      
      parsed.Avakahada_Chakra = avkahadaChakraObj;
      parsed.avkahadaChakra = avkahadaChakraObj;
      return parsed;
  };

  const handleGenerateChart = async () => {
    if (!dob || !tob || !lat || !lon) {
        setError("Please fill in Date, Time, Latitude, and Longitude.");
        return;
    }
    setAnalyzing(true);
    setError(null);

    try {
        const { date_of_birth, time_of_birth } = convertToISTForAPI(dob, tob, timezone);
        const payload = {
            date_of_birth,
            time_of_birth,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            timezone: timezone
        };
        const apiBaseUrl = (import.meta as any).env.VITE_API_URL || "";
        let parsed: any = {};
        
       
        // --- API FETCH SECTION ---
        try {
            // We use the 'VITE_' prefix so the frontend can read the Render variable
            const yourVariable = (import.meta as any).env.VITE_ANY_VARIABLE_NAME;            
            const res = await fetch(`${apiBaseUrl}/api/chart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("API returned an error.");
            }
            
            parsed = await res.json();
            // Correcting data based on your specific location/timezone logic
            parsed = enrichRawData(parsed, timezone, lon);
            
        } catch (fetchErr: any) {
            console.error("API Fetch Error:", fetchErr);
            throw new Error("Failed to fetch chart data from the API. Please try again later.");
        }
        // --- END API FETCH SECTION ---

        // This part organizes the data for your UI components
        const dCharts = Object.keys(parsed).reduce((acc: any, key) => {
            if (key.match(/^D\d+$/)) {
                acc[key] = parsed[key];
            }
            return acc;
        }, {});

        const basicDetailsObj = parsed.Basic_Details || parsed.Traditional || {};
        if (userName) basicDetailsObj['Name'] = userName;
        if (userGender && userGender !== 'Prefer not to say') basicDetailsObj['Gender'] = userGender;
        if (dob) {
            const [y, m, d] = dob.split('-');
            basicDetailsObj['Date_of_Birth'] = `${d}/${m}/${y}`;
        }
        if (tob) basicDetailsObj['Time_of_Birth'] = tob;
        if (pobQuery) basicDetailsObj['Place_of_Birth'] = pobQuery;
        
        const combinedData: Partial<RawInput> = {
            Personal: {
                dob: parsed.Varshphal_Details?.Date_of_Birth || dob,
                city: parsed.Varshphal_Details?.Birth_City || pobQuery,
                lagna: parsed.Varshphal_Details?.Varshphal_Lagna || "Aries",
                muntha: parsed.Varshphal_Details?.Muntha_Bhav || "1",
                Will_Power_Score: parsed.ATPT?.['Willpower Score'] || parsed.Derived_Metrics?.Willpower_Score || 0
            },
            ...dCharts,
            D1: parsed.D1 || [],
            D9: parsed.D9 || [],
            KP_System: parsed.KP || parsed.KP_System || {},
            summary_bav_by_rashi: parsed.ATPT?.summary_bav_by_rashi || parsed.summary_bav_by_rashi || {},
            prasthara_pav: parsed.ATPT?.prasthara_pav || parsed.prasthara_pav || {},
            House_Scores: parsed.ATPT?.House_Scores || parsed.House_Scores || {},
            vimshottari: parsed.VD || parsed.vimshottari || [],
            yogini: parsed.YD || parsed.yogini || [],
            chara: parsed.CD || parsed.chara || [],
            Chalit_System: parsed.Chalit_System || {},
            ashtakvarga: parsed.Ashtakvarga || parsed.ashtakvarga || {},
            avkahadaChakra: parsed.Avakahada_Chakra || parsed.avkahadaChakra || {},
            basicDetails: basicDetailsObj,
            favourablePoints: parsed.Favourable_Points || parsed.favourablePoints || {},
            ghatak: { ...(parsed.Ghatak || parsed.ghatak || {}), Gender: userGender },
            knowledgeBase: [],
            charts: parsed.charts || [],
            Varshphal_Details: parsed.Varshphal_Details || undefined
        };

        const result = processAstrologyJson(combinedData);
        
        result.userContext = {
            gotra: userGotra,
            baselineMood: userMood,
            age: userAge,
            gender: userGender,
            hasPhoto: !!userPhoto,
            hasPalm: !!userPalm,
            palmImageDate: palmImageDate
        };

        const missing = identifyMissingData(result);
        if (missing.length > 0) {
            setPendingData(result);
            setMissingDataOptions(missing);
            setSelectedCalculations(missing);
            setShowCalculationModal(true);
        } else {
            await finalizeData(result);
        }

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to generate chart from API.");
        setAnalyzing(false);
    }
};


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setAnalyzing(true);
      setError(null);
      
      const combinedData: Partial<RawInput> = {
          knowledgeBase: []
      };

      const mergeContent = (type: 'json' | 'kb', content: any, filename: string) => {
          if (type === 'json') {
              if (Array.isArray(content)) {
                  const arrType = identifyArrayType(content);
                  if (arrType === 'vimshottari') combinedData.vimshottari = content;
                  else if (arrType === 'yogini') combinedData.yogini = content;
                  else if (arrType === 'chara') combinedData.chara = content;
              } else if (typeof content === 'object') {
                  Object.assign(combinedData, content);
              }
          } else if (type === 'kb' && combinedData.knowledgeBase) {
              combinedData.knowledgeBase.push({
                  filename: filename,
                  content: content
              });
          }
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            if (file.name.toLowerCase().endsWith('.zip')) {
                const extracted = await processZipFile(file);
                extracted.forEach(f => mergeContent(f.type === 'json' ? 'json' : 'kb', f.content, f.filename));
            } else {
                const processed = await processFileContent(file);
                if (processed.type !== 'unknown') {
                    mergeContent(processed.type === 'json' ? 'json' : 'kb', processed.content, processed.filename);
                }
            }
        } catch (fErr) {
          console.warn(`Skipping file ${file.name}: Error processing`, fErr);
        }
      }

      if (Object.keys(combinedData).length === 0 && combinedData.knowledgeBase?.length === 0) {
        throw new Error("No valid data found in uploaded files.");
      }
      
      const finalInput = combinedData as RawInput;
      
      if (!finalInput.basicDetails) {
          finalInput.basicDetails = {};
      }
      if (userName) finalInput.basicDetails['Name'] = userName;
      if (userGender && userGender !== 'Prefer not to say') finalInput.basicDetails['Gender'] = userGender;
      if (dob) {
          const [y, m, d] = dob.split('-');
          finalInput.basicDetails['Date_of_Birth'] = `${d}/${m}/${y}`;
      }
      if (tob) finalInput.basicDetails['Time_of_Birth'] = tob;
      if (pobQuery) finalInput.basicDetails['Place_of_Birth'] = pobQuery;

      if (!finalInput.ghatak) finalInput.ghatak = {};
      if (userGender && userGender !== 'Prefer not to say') finalInput.ghatak['Gender'] = userGender;

      let fileLon = lon;
      if (!fileLon && finalInput.basicDetails?.Longitude) {
          const lonStr = finalInput.basicDetails.Longitude;
          const num = parseFloat(lonStr);
          if (!isNaN(num)) {
              fileLon = lonStr.includes('W') ? (-num).toString() : num.toString();
          }
      }
      
      const enrichedInput = enrichRawData(finalInput, timezone, fileLon);
      const result = processAstrologyJson(enrichedInput);
      
      result.userContext = {
          gotra: userGotra,
          baselineMood: userMood,
          age: userAge,
          gender: userGender,
          hasPhoto: !!userPhoto,
          hasPalm: !!userPalm,
          palmImageDate: palmImageDate
      };

      // Visual and Palm analysis removed
      const missing = identifyMissingData(result);
      if (missing.length > 0) {
          setPendingData(result);
          setMissingDataOptions(missing);
          setSelectedCalculations(missing);
          setShowCalculationModal(true);
      } else {
          await finalizeData(result);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process files.");
      setAnalyzing(false);
    }
  };
  
  const initChatSession = async (selectedLang: string) => {
      if (!dbInstance) return;
      setLanguage(selectedLang);
      const chat = await createChatSession(dbInstance, selectedLang, cultureMode);
      setChatSession(chat);
  };

  const handleFAQAsk = (question: string) => {
      if (question.includes("prediction for today")) {
          setViewMode('daily');
      } else {
          setTriggerPrompt(question);
          setViewMode('chat');
      }
  };

  // Filter Divisional Charts for specific table view
  const charts = data?.charts || [];

  const chalit = data?.chalit || [];

  return (
    <div className="min-h-screen bg-[#0B0c15] text-amber-50 font-serif selection:bg-amber-900/50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      
      {/* Mystical Header */}
      <header className="border-b border-amber-900/30 bg-[#120f26]/80 backdrop-blur-md sticky top-0 z-40 shadow-2xl shadow-indigo-950/50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="p-2 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-500 border border-amber-400/30">
                 <Moon className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent tracking-wide font-[Cinzel,serif]">
                DIVINE INTELLIGENCE
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
             <div className="flex bg-[#1a1638] rounded-xl p-1 border border-amber-500/10 shadow-inner shrink-0 gap-1">
                 <button onClick={() => setCultureMode('EN')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cultureMode === 'EN' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-400 hover:text-white'}`}>EN</button>
                 <button onClick={() => setCultureMode('HI')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cultureMode === 'HI' ? 'bg-orange-600 text-white shadow' : 'text-orange-400 hover:text-white'}`}>HI</button>
             </div>

             {data && (
               <div className="flex gap-2 shrink-0">
                    <button onClick={() => setViewMode('chat')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'chat' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'bg-[#1a1638] text-slate-400 border border-indigo-500/30'}`} title="Chat with AI Astrologer">
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">{cultureMode === 'JP' ? "神託 (Oracle)" : cultureMode === 'HI' ? "ज्योतिष (Oracle)" : "Oracle"}</span>
                    </button>
                    <button onClick={() => setViewMode('dashboard')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-[#1a1638] text-slate-400 hover:text-white border border-indigo-500/30'}`} title="Dashboard Charts">
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden md:inline">{cultureMode === 'JP' ? "チャート" : cultureMode === 'HI' ? "चार्ट" : "Charts"}</span>
                    </button>
                    <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-500/80 hover:text-amber-300 hover:bg-amber-950/30 border border-amber-900/30 hover:border-amber-500/50 transition-all shrink-0" title="Start fresh and restart onboarding">
                        <History className="w-4 h-4" />
                        <span className="hidden lg:inline">{cultureMode === 'JP' ? "リセット" : cultureMode === 'HI' ? "रीसेट" : "Restart"}</span>
                    </button>
                    <button
                      onClick={handleExportVault}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-500/30 hover:border-amber-500/50 rounded-lg text-xs font-bold uppercase tracking-wider text-indigo-200 hover:text-amber-300 transition-all shrink-0"
                      title="Download your chart, photos, and chat history as a backup file"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden lg:inline">Save Vault</span>
                    </button>
                    <button
                      onClick={() => document.getElementById('vaultImportInput')?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-500/30 hover:border-amber-500/50 rounded-lg text-xs font-bold uppercase tracking-wider text-indigo-200 hover:text-amber-300 transition-all shrink-0"
                      title="Restore your chart and history from a saved vault file"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="hidden lg:inline">Restore Vault</span>
                    </button>
                 </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        
        {/* Upload Section (Only show if no data) */}
        {!data && !analyzing && (
          <div className="max-w-3xl mx-auto mt-8 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="mb-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                 <Star className="w-3 h-3 text-amber-400" />
                 {cultureMode === 'JP' ? "ジョーティッシュ・インテリジェンス・システム" : cultureMode === 'HI' ? "ज्योतिष इंटेलिजेंस सिस्टम" : "Jyotish Intelligence System"}
              </div>
              <h2 className="text-6xl font-serif font-medium text-amber-50 leading-tight drop-shadow-2xl">
                {cultureMode === 'JP' ? "あなたの" : cultureMode === 'HI' ? "अपनी" : "Discover Your"} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 animate-pulse-slow">
                    {cultureMode === 'JP' ? "宇宙の設計図を発見" : cultureMode === 'HI' ? "ब्रह्मांडीय कुंडली खोजें" : "Cosmic Blueprint"}
                </span>
              </h2>
              <p className="text-lg text-indigo-200/60 max-w-xl mx-auto font-light leading-relaxed">
                {cultureMode === 'JP' ? "リシ（聖仙）の知恵をコードの力で解き放つ。" : cultureMode === 'HI' ? "ऋषियों के ज्ञान को आधुनिक तकनीक से जानें।" : "Unlock the wisdom of the Rishis through the power of code."}
              </p>
            </div>

            <div className="flex flex-col gap-8">
                {/* 0. Birth Details (Required for API) */}
                <div className="w-full order-0 p-6 rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-[#1e1b4b] to-[#120f26] relative overflow-visible shadow-2xl">
                    <h3 className="text-amber-200 font-serif font-bold text-lg mb-4 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-amber-400" /> 
                        {cultureMode === 'JP' ? "出生の詳細" : cultureMode === 'HI' ? "जन्म विवरण" : "Birth Details"}
                        <span className="text-[8px] bg-rose-900/40 border border-rose-500/30 text-rose-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Required</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative mb-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-300 font-medium">Name</label>
                            <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Enter your name" className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-300 font-medium">Gender</label>
                            <select value={userGender} onChange={handleGenderChange} className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none">
                                <option value="Prefer not to say">{cultureMode === 'JP' ? "性別: 選択..." : cultureMode === 'HI' ? "लिंग: चुनें..." : "Gender..."}</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-300 font-medium">Date of Birth</label>
                            <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none [color-scheme:dark] golden-icon" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-300 font-medium">Time of Birth</label>
                            <input type="time" value={tob} onChange={e => setTob(e.target.value)} className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none [color-scheme:dark] golden-icon" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-300 font-medium">Timezone (Offset)</label>
                            <input type="number" step="0.5" value={timezone} onChange={e => {
                                const val = parseFloat(e.target.value);
                                setTimezone(val);
                                localStorage.setItem('vedicUserTimezone', val.toString());
                            }} className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                        <div className="flex flex-col gap-1 relative">
                            <label className="text-xs text-indigo-300 font-medium">Place of Birth</label>
                            <input 
                                type="text" 
                                value={pobQuery} 
                                onChange={e => handlePobSearch(e.target.value)} 
                                placeholder="City, State, Country..." 
                                className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none" 
                            />
                            {isSearchingPob && <Loader2 className="w-4 h-4 text-amber-500 animate-spin absolute right-3 top-9" />}
                            
                            {pobSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1638] border border-indigo-500/50 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                                    {pobSuggestions.map((sug, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => selectPob(sug)}
                                            className="p-3 border-b border-indigo-500/20 hover:bg-indigo-900/50 cursor-pointer text-sm text-indigo-100 last:border-0 flex flex-col gap-1"
                                        >
                                            <span className="font-medium">{sug.display_name}</span>
                                            <span className="text-[10px] text-indigo-400">Lat: {parseFloat(sug.lat).toFixed(4)}, Lon: {parseFloat(sug.lon).toFixed(4)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-300 font-medium">Latitude</label>
                            <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 28.6139" className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-300 font-medium">Longitude</label>
                            <input type="number" step="any" value={lon} onChange={e => setLon(e.target.value)} placeholder="e.g. 77.2090" className="bg-indigo-950/50 text-amber-200 text-sm p-3 rounded-xl border border-indigo-700 focus:border-amber-500 outline-none" />
                        </div>
                    </div>
                </div>

                {/* 1. Soul Reflection & Hand of Destiny */}
                <div className="hidden w-full order-1 grid-cols-1 gap-6">
                   {/* Face Card */}
                   <div className="flex flex-col p-6 rounded-[2rem] border border-amber-500/20 bg-gradient-to-br from-[#1e1b4b] to-[#120f26] hover:border-amber-500/50 transition-all relative overflow-hidden group shadow-2xl">
                       <div className="absolute top-0 right-0 p-3 opacity-10"><UserCircle className="w-24 h-24 text-white" /></div>
                       <h3 className="text-amber-200 font-serif font-bold text-lg mb-2 flex items-center gap-2">
                           <Camera className="w-5 h-5 text-amber-400" /> 
                           {cultureMode === 'JP' ? "魂の反映" : cultureMode === 'HI' ? "आत्मा का प्रतिबिंब" : "Soul Reflection"}
                           <span className="text-[8px] bg-amber-900/40 border border-amber-500/30 text-amber-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Optional</span>
                       </h3>
                       
                       <div className="flex flex-col items-center justify-center gap-4">
                           <div className="hidden relative w-24 h-24 rounded-full border-2 border-dashed border-amber-500/40 bg-black/30 items-center justify-center overflow-hidden group-hover:border-amber-400 transition-colors">
                                {userPhoto ? (
                                    <img src={userPhoto} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-8 h-8 text-amber-500/50" />
                                )}
                                <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>
                           
                           <div className="grid grid-cols-1 gap-2 w-full">
                               <input type="number" value={userAge} onChange={handleAgeChange} placeholder={cultureMode === 'JP' ? "年齢" : cultureMode === 'HI' ? "आयु" : "Age"} className="bg-indigo-950/50 text-amber-200 text-xs p-2 rounded border border-indigo-700 focus:border-amber-500 outline-none" />
                               <select value={userMood} onChange={handleMoodChange} className="bg-indigo-950/50 text-amber-200 text-xs p-2 rounded border border-indigo-700 focus:border-amber-500 outline-none">
                                   <option value="Prefer not to say">{cultureMode === 'JP' ? "普段の様子: 選択..." : cultureMode === 'HI' ? "स्वभाव: चुनें..." : "Demeanor..."}</option>
                                   <option value="Cheerful">Cheerful</option>
                                   <option value="Serious">Serious</option>
                               </select>
                               <input type="text" value={userGotra} onChange={handleGotraChange} placeholder={cultureMode === 'JP' ? "ゴートラ (任意)" : cultureMode === 'HI' ? "गोत्र (वैकल्पिक)" : "Gotra (Opt)"} className="bg-indigo-950/50 text-amber-200 text-xs p-2 rounded border border-indigo-700 focus:border-amber-500 outline-none" />
                           </div>
                       </div>
                   </div>

                   {/* Palm Card */}
                   <div className="hidden flex-col p-6 rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-[#064e3b] to-[#022c22] hover:border-emerald-500/50 transition-all relative overflow-hidden group shadow-2xl">
                       <div className="absolute top-0 right-0 p-3 opacity-10"><Hand className="w-24 h-24 text-emerald-200" /></div>
                       <h3 className="text-emerald-200 font-serif font-bold text-lg mb-2 flex items-center gap-2">
                           <Hand className="w-5 h-5 text-emerald-400" /> 
                           {cultureMode === 'JP' ? "運命の手" : cultureMode === 'HI' ? "भाग्य रेखा" : "Hand of Destiny"}
                           <span className="text-[8px] bg-emerald-900/40 border border-emerald-500/30 text-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Optional</span>
                       </h3>
                       
                       <div className="flex flex-col items-center justify-center gap-4 flex-1">
                           <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-emerald-500/40 bg-black/30 flex items-center justify-center overflow-hidden group-hover:border-emerald-400 transition-colors shadow-inner">
                                {userPalm ? (
                                    <img src={userPalm} alt="Palm" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Hand className="w-8 h-8 text-emerald-500/50 mx-auto mb-1" />
                                        <span className="text-[9px] text-emerald-500/50 uppercase tracking-widest">
                                            {cultureMode === 'JP' ? "手相をアップロード" : cultureMode === 'HI' ? "हथेली अपलोड करें" : "Upload Palm"}
                                        </span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handlePalmUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>

                           <div className="text-[10px] text-emerald-200/60 text-center max-w-[200px]">
                               Enables <strong>"Chiro-Astro Sync"</strong> protocol.
                           </div>
                       </div>
                   </div>
                </div>

                {/* 2. Main File Upload & Continue Action */}
                <div className="w-full order-2 flex flex-col gap-4">
                    {/* The File Dropzone - Made smaller as requested */}
                    <div className="hidden relative group rounded-[2rem] border-2 border-dashed border-indigo-900/50 bg-[#0B0c15]/50 overflow-hidden hover:border-amber-500/40 transition-colors h-32 items-center justify-center">
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer relative z-10 p-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-[#1e1b4b] shadow-lg border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                  <Upload className="w-4 h-4 text-amber-200" />
                                </div>
                                <span className="text-sm text-indigo-200/80 font-medium">Upload TXT Files (Optional)</span>
                            </div>
                            <input type="file" className="hidden" accept=".zip,.json,.txt,.md" multiple onChange={handleFileUpload} />
                        </label>
                    </div>

                    {/* Prominent Continue Button */}
                    <div className="flex gap-4">
                        <button 
                            onClick={handleGenerateChart}
                            disabled={!dob || !tob || !lat || !lon}
                            className={`flex-1 py-4 rounded-2xl font-serif font-bold text-lg shadow-xl flex items-center justify-center gap-3 group transition-all duration-500 ${
                                (!dob || !tob || !lat || !lon) 
                                ? "bg-indigo-950/50 text-indigo-400/50 cursor-not-allowed border border-indigo-800/30" 
                                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white shadow-indigo-900/30 transform hover:-translate-y-1"
                            }`}
                        >
                            <span>{cultureMode === 'JP' ? "チャートを生成する" : cultureMode === 'HI' ? "चार्ट जनरेट करें" : "Generate Chart"}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <p className="text-xs text-center text-indigo-400/50">
                        {cultureMode === 'JP' ? "出生の詳細を入力するか、ファイルをアップロードしてください。" : cultureMode === 'HI' ? "अपना चार्ट जनरेट करने के लिए जन्म विवरण दर्ज करें, या फ़ाइलें अपलोड करें।" : "Enter Birth Details to generate your chart, or upload files."}
                    </p>
                </div>
            </div>
            
            {error && (
              <div className="mt-8 p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-200 text-sm flex items-center justify-center gap-3 backdrop-blur-md">
                <Diamond className="w-4 h-4 text-rose-500" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* ... (Rest of the JSX for Modals and Dashboard remains unchanged) ... */}
        {showCalculationModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                <div className="bg-[#1a1638] border border-indigo-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-24 h-24 text-amber-500" /></div>
                    
                    <h3 className="text-xl font-serif font-bold text-amber-100 mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        {cultureMode === 'JP' ? "不足している宇宙データ" : cultureMode === 'HI' ? "लापता डेटा (Missing Data)" : "Missing Cosmic Data"}
                    </h3>
                    <p className="text-indigo-200/80 text-sm mb-6">
                        {cultureMode === 'JP' ? "アップロードされたファイルには高度なチャートがいくつか欠けています。D1（ラーシ）チャートに基づいて、AIエンジンに数学的に計算させますか？" : 
                         cultureMode === 'HI' ? "आपकी फ़ाइलों में कुछ उन्नत चार्ट गायब हैं। क्या आप एआई इंजन से D1 (राशि) चार्ट के आधार पर उनकी गणना करवाना चाहेंगे?" :
                         "Your uploaded files are missing some advanced charts. Would you like the AI Engine to calculate them mathematically based on your D1 (Rashi) chart?"}
                    </p>

                    <div className="space-y-3 mb-8">
                        {missingDataOptions.map(opt => (
                            <div key={opt} className="flex items-center justify-between p-3 rounded-xl bg-[#0f0c29]/50 border border-indigo-500/20 hover:border-amber-500/40 transition-all cursor-pointer" onClick={() => toggleCalculation(opt)}>
                                <span className="font-bold text-indigo-100 text-sm">{opt}</span>
                                {selectedCalculations.includes(opt) ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500/30"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={handleCalculateMissing}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Play className="w-4 h-4 fill-white" />
                            {cultureMode === 'JP' ? "はい、計算します" : cultureMode === 'HI' ? "हाँ, गणना करें" : "Yes, Calculate"}
                        </button>
                        <button 
                            onClick={handleSkipCalculation}
                            className="px-6 py-3 rounded-xl border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-white/5 transition-all font-bold"
                        >
                            {cultureMode === 'JP' ? "スキップ" : cultureMode === 'HI' ? "छोड़ें (Skip)" : "Skip"}
                        </button>
                    </div>
                </div>
            </div>
        )}


        {analyzing && !showCalculationModal && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-10 animate-pulse"></div>
                <div className="w-24 h-24 border-4 border-indigo-900 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Star className="w-8 h-8 text-amber-200 animate-pulse" fill="currentColor" />
                </div>
            </div>
            <h3 className="text-3xl font-serif text-amber-100 mt-10 mb-3 tracking-wide">
                {cultureMode === 'JP' ? "惑星を調整中..." : cultureMode === 'HI' ? "ग्रहों का संरेखण..." : "Aligning Planets..."}
            </h3>
            <p className="text-indigo-300/60 font-light">
                {cultureMode === 'JP' ? "あなたのために天の脚本を読み解いています" : cultureMode === 'HI' ? "आपकी कुंडली का विश्लेषण किया जा रहा है..." : "Reading the celestial script tailored for you"}
            </p>
          </div>
        )}

        {data && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* VIEW MODE: CHAT (Kept mounted via CSS logic to preserve history) */}
            <div className={viewMode === 'chat' ? 'max-w-5xl mx-auto block' : 'hidden'}>
                 <ChatInterface 
                    chatSession={chatSession} 
                    db={dbInstance} 
                    language={language}
                    onLanguageSelect={initChatSession}
                    userPhoto={userPhoto}
                    userAge={userAge}
                    userGotra={userGotra}
                    userMood={userMood}
                    userName={userName}
                    userGender={userGender}
                    triggerPrompt={triggerPrompt}
                    onPromptHandled={() => setTriggerPrompt(null)}
                    cultureMode={cultureMode}
                 />
            </div>

            {/* VIEW MODE: COSMIC FAQ */}
            <div className={viewMode === 'faq' ? 'block' : 'hidden'}>
                <CosmicFAQ onAsk={handleFAQAsk} />
            </div>

            {/* VIEW MODE: DAILY FORECAST */}
            <div className={viewMode === 'daily' ? 'block' : 'hidden'}>
                <DailyForecast db={dbInstance} />
            </div>

            {/* VIEW MODE: DASHBOARD */}
            <div className={viewMode === 'dashboard' ? 'space-y-10 block' : 'hidden'}>
                
                {/* Hero Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-3 bg-gradient-to-r from-[#1e1b4b] to-[#17153B] border border-amber-500/20 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
                      
                      <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
                        <div className="p-4 bg-[#0f0c29] rounded-2xl border border-amber-500/20 shadow-lg shrink-0">
                            <Scroll className="w-8 h-8 text-amber-300" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-serif text-amber-50 mb-3 tracking-wide">
                              {cultureMode === 'JP' ? "宇宙のスナップショット" : cultureMode === 'HI' ? "कॉस्मिक स्नैपशॉट" : "Cosmic Snapshot"}
                          </h3>
                          <p className="text-indigo-100/80 leading-loose font-light text-base md:text-lg border-l-2 border-amber-500/30 pl-6 italic">
                            "{data.summary}"
                          </p>
                          {data.palmAnalysis && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded w-fit">
                                  <Hand className="w-3 h-3" />
                                  <span>Hastasammudrika Enabled</span>
                              </div>
                          )}
                        </div>
                      </div>
                    </section>
                </div>

                <TraditionalSummary data={data} />
                <BasicDetailsDisplay data={data} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-10">
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <LayoutGrid className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl font-serif text-amber-100 tracking-wide">
                            {cultureMode === 'JP' ? "ショーダシャバルガ チャート" : cultureMode === 'HI' ? "षोडशवर्ग चार्ट" : "Shodashvarga Charts & Tables"}
                        </h2>
                        <div className="h-px bg-gradient-to-r from-amber-900/50 to-transparent flex-1 ml-4"></div>
                      </div>
                      <div className="grid grid-cols-1 gap-12">
                        {charts.map((chart, idx) => (
                          <div key={idx} className="bg-[#120f26] p-6 rounded-xl border border-indigo-900/50 shadow-lg flex flex-col xl:flex-row gap-8 items-center xl:items-start">
                            <div className="w-full xl:w-1/3 flex-shrink-0">
                              <NorthIndianChart data={chart} />
                            </div>
                            <div className="w-full xl:w-2/3 overflow-x-auto">
                              <h3 className="text-sm font-bold text-amber-400 mb-5 uppercase tracking-widest flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                  {chart.name} Details
                              </h3>
                              <PlanetaryTable planets={chart.planets} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {data.kpSystem && (
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <Star className="w-5 h-5 text-amber-400" />
                          <h2 className="text-xl font-serif text-amber-100 tracking-wide">Krishnamurti Paddhati (KP)</h2>
                          <div className="h-px bg-gradient-to-r from-amber-900/50 to-transparent flex-1 ml-4"></div>
                        </div>
                        <KPDisplay cusps={data.kpSystem.cusps} planets={data.kpSystem.planets} />
                      </section>
                    )}
                    
                    {chalit.length > 0 && (
                       <section>
                          <div className="flex items-center gap-3 mb-6">
                            <TableIcon className="w-5 h-5 text-amber-400" />
                            <h2 className="text-xl font-serif text-amber-100 tracking-wide">
                                {cultureMode === 'JP' ? "バーヴァ・チャリット" : cultureMode === 'HI' ? "भाव चलित" : "Bhava Chalit"}
                            </h2>
                            <div className="h-px bg-gradient-to-r from-amber-900/50 to-transparent flex-1 ml-4"></div>
                          </div>
                          <ChalitTable rows={chalit} shifts={data.planetShifts} />
                       </section>
                    )}



                     {data.prastharashtakvarga && data.prastharashtakvarga.length > 0 && (
                       <section>
                         <div className="flex items-center gap-3 mb-6">
                            <TableIcon className="w-5 h-5 text-amber-400" />
                            <h2 className="text-xl font-serif text-amber-100 tracking-wide">Prastharashtakvarga</h2>
                            <div className="h-px bg-gradient-to-r from-amber-900/50 to-transparent flex-1 ml-4"></div>
                         </div>
                         <PrastharaDisplay tables={data.prastharashtakvarga} />
                       </section>
                     )}
                  </div>

                  <div className="space-y-10">
                    <VarshphalDisplay 
                       data={data.varshphal} 
                       bhriguBindu={data.bhriguBindu} 
                       ishtaDevata={data.ishtaDevata}
                    />

                    <section className="bg-[#120f26] border border-indigo-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-700"></div>
                      <h3 className="text-lg font-serif text-amber-100 mb-6 flex items-center gap-2">
                          <Diamond className="w-4 h-4 text-emerald-400" />
                          {cultureMode === 'JP' ? "惑星の強さ (シャドバラ)" : cultureMode === 'HI' ? "ग्रह बल (षड्बल)" : "Planetary Strength (Shadbala)"}
                      </h3>
                      <ShadbalaChart data={data.shadbala} />
                    </section>

                    <section>
                      <h3 className="text-lg font-serif text-amber-100 mb-6 flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                          {cultureMode === 'JP' ? "ダシャー・タイムライン" : cultureMode === 'HI' ? "दशा" : "Dasha Timelines"}
                      </h3>
                      <DashaDisplay dashas={data.dashas} />
                    </section>

                    <section className="bg-[#120f26] border border-indigo-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-700"></div>
                       <h3 className="text-lg font-serif text-amber-100 mb-6 flex items-center gap-2">
                          <Diamond className="w-4 h-4 text-blue-400" />
                          Sarvashtakavarga (SAV)
                       </h3>
                       {data.prastharashtakvarga && data.prastharashtakvarga.length > 0 ? (
                           <AshtakvargaTable prasthara={data.prastharashtakvarga} sav={data.ashtakvarga} />
                       ) : (
                           <div className="grid grid-cols-4 gap-4">
                              {Object.entries(data.ashtakvarga).map(([house, points]) => (
                                <div key={house} className="flex flex-col items-center justify-center p-4 bg-[#1a1638] rounded-xl border border-indigo-500/10 shadow-inner">
                                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">H{house}</span>
                                   <span className={`font-serif text-2xl ${(points as number) > 28 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : (points as number) < 25 ? 'text-rose-400' : 'text-slate-200'}`}>
                                      {points as number}
                                   </span>
                                </div>
                              ))}
                           </div>
                       )}
                    </section>
                  </div>
                </div>

                {/* Restart Onboarding Call to Action */}
                <div className="mt-20 pt-10 border-t border-amber-900/20 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="flex justify-center">
                            <div className="p-4 rounded-full bg-amber-950/20 border border-amber-500/20">
                                <History className="w-8 h-8 text-amber-500/50" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-serif text-amber-100 mb-2">
                                {cultureMode === 'JP' ? "新しい旅を始める" : cultureMode === 'HI' ? "नई यात्रा शुरू करें" : "Begin a New Journey"}
                            </h3>
                            <p className="text-sm text-indigo-300/60 leading-relaxed">
                                {cultureMode === 'JP' ? "現在のデータをすべて消去し、オンボーディングプロセスを最初からやり直します。" : cultureMode === 'HI' ? "वर्तमान डेटा को साफ़ करें और ऑनबोर्डिंग प्रक्रिया को फिर से शुरू करें।" : "Clear all current data and restart the onboarding process from the beginning."}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowResetConfirm(true)}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold shadow-xl shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                            {cultureMode === 'JP' ? "オンボーディングを再開する" : cultureMode === 'HI' ? "ऑनबोर्डिंग फिर से शुरू करें" : "Restart Onboarding"}
                        </button>
                    </div>
                </div>
              </div>
          </div>
        )}

      </main>
      
      {/* Database Viewer Modal */}
      {showDbViewer && dbInstance && (
          <DatabaseViewer 
            db={dbInstance} 
            onClose={() => setShowDbViewer(false)} 
            cultureMode={cultureMode}
          />
      )}

      {/* Password Protection Modal */}
      {showPasswordModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
              <div className="bg-[#1a1638] border border-amber-500/30 rounded-3xl max-w-md w-full p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><Shield className="w-32 h-32 text-amber-500" /></div>
                  
                  <div className="flex justify-center mb-8">
                      <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                          <Crown className="w-12 h-12 text-amber-500" />
                      </div>
                  </div>

                  <h3 className="text-3xl font-serif font-bold text-amber-100 mb-4 text-center">
                      {cultureMode === 'JP' ? "プロ機能のロック解除" : cultureMode === 'HI' ? "प्रो फीचर्स अनलॉक करें" : "Unlock Pro Features"}
                  </h3>
                  <p className="text-indigo-200/60 text-center mb-10 leading-relaxed text-sm">
                      {cultureMode === 'JP' ? "この機能にアクセスするには、Aatmabodhaのパスワードを入力してください。" : 
                       cultureMode === 'HI' ? "इस फीचर को एक्सेस करने के लिए कृपया Aatmabodha पासवर्ड दर्ज करें।" :
                       "Please enter the Aatmabodha password to access these advanced divine intelligence features."}
                  </p>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div className="relative">
                          <input 
                              type="password"
                              value={passwordInput}
                              onChange={(e) => {
                                  setPasswordInput(e.target.value);
                                  setPasswordError(false);
                              }}
                              placeholder="••••••••"
                              autoFocus
                              className={`w-full bg-black/40 border ${passwordError ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-indigo-500/30 focus:border-amber-500/50'} rounded-2xl py-4 px-6 text-center text-xl tracking-[0.5em] text-amber-100 outline-none transition-all placeholder:text-indigo-900/50`}
                          />
                          {passwordError && (
                              <p className="text-rose-500 text-xs font-bold mt-2 text-center animate-bounce">
                                  {cultureMode === 'JP' ? "パスワードが正しくありません" : cultureMode === 'HI' ? "गलत पासवर्ड" : "Incorrect Password"}
                              </p>
                          )}
                      </div>

                      <div className="flex flex-col gap-4">
                          <button 
                              type="submit"
                              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center gap-3 group"
                          >
                              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                              {cultureMode === 'JP' ? "ロック解除" : cultureMode === 'HI' ? "अनलॉक करें" : "Unlock Now"}
                          </button>
                          <button 
                              type="button"
                              onClick={() => {
                                  setShowPasswordModal(false);
                                  setPendingAction(null);
                                  setPasswordInput('');
                                  setPasswordError(false);
                              }}
                              className="w-full py-4 rounded-2xl border border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
                          >
                              {cultureMode === 'JP' ? "キャンセル" : cultureMode === 'HI' ? "रद्द करें" : "Cancel"}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
              <div className="bg-[#1a1638] border border-rose-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-24 h-24 text-rose-500" /></div>
                  
                  <div className="flex justify-center mb-6">
                      <div className="p-4 rounded-full bg-rose-950/30 border border-rose-500/30">
                          <History className="w-10 h-10 text-rose-500" />
                      </div>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-rose-100 mb-3 text-center">
                      {cultureMode === 'JP' ? "最初からやり直しますか？" : cultureMode === 'HI' ? "क्या आप फिर से शुरू करना चाहते हैं?" : "Start Fresh?"}
                  </h3>
                  <p className="text-indigo-200/80 text-center mb-8 leading-relaxed">
                      {cultureMode === 'JP' ? "現在のすべてのチャートデータ、予測、アップロードされた写真は完全に削除されます。この操作は取り消せません。" : 
                       cultureMode === 'HI' ? "आपका सारा वर्तमान डेटा, भविष्यवाणियां और फोटो हटा दिए जाएंगे। यह क्रिया वापस नहीं ली जा सकती।" :
                       "This will permanently delete all current chart data, cached forecasts, and uploaded photos. This action cannot be undone."}
                  </p>

                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={handleReset}
                          className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-2"
                      >
                          <RefreshCw className="w-4 h-4" />
                          {cultureMode === 'JP' ? "はい、リセットします" : cultureMode === 'HI' ? "हाँ, रीसेट करें" : "Yes, Reset Everything"}
                      </button>
                      <button 
                          onClick={() => setShowResetConfirm(false)}
                          className="w-full py-4 rounded-xl border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-white/5 transition-all font-bold"
                      >
                          {cultureMode === 'JP' ? "キャンセル" : cultureMode === 'HI' ? "रद्द करें" : "Cancel"}
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* ── CONSENT MODAL ───────────────────────────────── */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f0c29] border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">✦</div>
              <h2 className="font-serif text-xl font-bold text-amber-300 mb-1">Before We Begin</h2>
              <p className="text-indigo-300 text-sm">Please review how Aatmabodha uses your data</p>
            </div>

            {/* Mandatory consent */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">App Usage (Required)</p>
                  <p className="text-indigo-300 text-xs mt-1">Your birth data, chart, and chat are stored only on your device. We use it solely to power your AI readings. This data is never sold or shared without your explicit permission below.</p>
                </div>
              </div>
            </div>

            {/* Optional: Research consent */}
            <div
              className={`border rounded-xl p-4 mb-3 cursor-pointer transition-all ${consentResearch ? 'bg-indigo-800/40 border-amber-500/50' : 'bg-indigo-900/20 border-indigo-500/20'}`}
              onClick={() => setConsentResearch(prev => !prev)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${consentResearch ? 'bg-amber-500 border-amber-500' : 'border-indigo-400'}`}>
                  {consentResearch && <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Anonymous Research (Optional)</p>
                  <p className="text-indigo-300 text-xs mt-1">Allow Aatmabodha to use anonymised, aggregated versions of your astrological patterns (never your name or identity) to improve the AI and publish research. You can opt out anytime.</p>
                </div>
              </div>
            </div>

            {/* Optional: Partner share consent */}
            <div
              className={`border rounded-xl p-4 mb-5 cursor-pointer transition-all ${consentPartnerShare ? 'bg-indigo-800/40 border-amber-500/50' : 'bg-indigo-900/20 border-indigo-500/20'}`}
              onClick={() => setConsentPartnerShare(prev => !prev)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${consentPartnerShare ? 'bg-amber-500 border-amber-500' : 'border-indigo-400'}`}>
                  {consentPartnerShare && <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Research Partner Sharing (Optional)</p>
                  <p className="text-indigo-300 text-xs mt-1">Allow sharing of anonymised astrological trend data with verified academic research partners. Never linked to your name. Never shared with insurance, credit, or HR companies — ever.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConsentAccept}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold rounded-xl transition-all text-sm tracking-wide"
            >
              I Understand — Open My Chart ✦
            </button>
            <p className="text-center text-indigo-400 text-xs mt-3">You can change optional consents anytime in Settings</p>
          </div>
        </div>
      )}

      {/* ── VAULT IMPORT INPUT (hidden) ─────────────────── */}
      <input
        type="file"
        id="vaultImportInput"
        accept=".json"
        className="hidden"
        onChange={handleImportVault}
      />
    </div>
  );
};

export default App;

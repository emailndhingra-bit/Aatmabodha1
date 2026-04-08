
export interface City {
    name: string;
    lat: number;
    lng: number;
    timezoneOffset: number; // Offset in minutes from UTC (e.g. India is +330)
}
  
export const CITIES: City[] = [
    // India (IST = +5.5 hours = 330 minutes)
    { name: "Mumbai, India", lat: 19.0760, lng: 72.8777, timezoneOffset: 330 },
    { name: "Delhi, India", lat: 28.7041, lng: 77.1025, timezoneOffset: 330 },
    { name: "Bangalore, India", lat: 12.9716, lng: 77.5946, timezoneOffset: 330 },
    { name: "Hyderabad, India", lat: 17.3850, lng: 78.4867, timezoneOffset: 330 },
    { name: "Ahmedabad, India", lat: 23.0225, lng: 72.5714, timezoneOffset: 330 },
    { name: "Chennai, India", lat: 13.0827, lng: 80.2707, timezoneOffset: 330 },
    { name: "Kolkata, India", lat: 22.5726, lng: 88.3639, timezoneOffset: 330 },
    { name: "Surat, India", lat: 21.1702, lng: 72.8311, timezoneOffset: 330 },
    { name: "Pune, India", lat: 18.5204, lng: 73.8567, timezoneOffset: 330 },
    { name: "Jaipur, India", lat: 26.9124, lng: 75.7873, timezoneOffset: 330 },
    { name: "Lucknow, India", lat: 26.8467, lng: 80.9462, timezoneOffset: 330 },
    { name: "Kanpur, India", lat: 26.4499, lng: 80.3319, timezoneOffset: 330 },
    { name: "Nagpur, India", lat: 21.1458, lng: 79.0882, timezoneOffset: 330 },
    { name: "Indore, India", lat: 22.7196, lng: 75.8577, timezoneOffset: 330 },
    { name: "Thane, India", lat: 19.2183, lng: 72.9781, timezoneOffset: 330 },
    { name: "Bhopal, India", lat: 23.2599, lng: 77.4126, timezoneOffset: 330 },
    { name: "Visakhapatnam, India", lat: 17.6868, lng: 83.2185, timezoneOffset: 330 },
    { name: "Pimpri-Chinchwad, India", lat: 18.6298, lng: 73.7997, timezoneOffset: 330 },
    { name: "Patna, India", lat: 25.5941, lng: 85.1376, timezoneOffset: 330 },
    { name: "Vadodara, India", lat: 22.3072, lng: 73.1812, timezoneOffset: 330 },
    { name: "Ghaziabad, India", lat: 28.6692, lng: 77.4538, timezoneOffset: 330 },
    { name: "Ludhiana, India", lat: 30.9010, lng: 75.8573, timezoneOffset: 330 },
    { name: "Agra, India", lat: 27.1767, lng: 78.0081, timezoneOffset: 330 },
    { name: "Nashik, India", lat: 19.9975, lng: 73.7898, timezoneOffset: 330 },
    { name: "Ranchi, India", lat: 23.3441, lng: 85.3096, timezoneOffset: 330 },
    { name: "Faridabad, India", lat: 28.4089, lng: 77.3178, timezoneOffset: 330 },
    { name: "Meerut, India", lat: 28.9845, lng: 77.7064, timezoneOffset: 330 },
    { name: "Rajkot, India", lat: 22.3039, lng: 70.8022, timezoneOffset: 330 },
    { name: "Kalyan-Dombivli, India", lat: 19.2403, lng: 73.1305, timezoneOffset: 330 },
    { name: "Vasai-Virar, India", lat: 19.3919, lng: 72.8397, timezoneOffset: 330 },
    { name: "Varanasi, India", lat: 25.3176, lng: 82.9739, timezoneOffset: 330 },
    { name: "Srinagar, India", lat: 34.0837, lng: 74.7973, timezoneOffset: 330 },
    { name: "Aurangabad, India", lat: 19.8762, lng: 75.3433, timezoneOffset: 330 },
    { name: "Dhanbad, India", lat: 23.7957, lng: 86.4304, timezoneOffset: 330 },
    { name: "Amritsar, India", lat: 31.6340, lng: 74.8723, timezoneOffset: 330 },
    { name: "Navi Mumbai, India", lat: 19.0330, lng: 73.0297, timezoneOffset: 330 },
    { name: "Allahabad, India", lat: 25.4358, lng: 81.8463, timezoneOffset: 330 },
    { name: "Howrah, India", lat: 22.5958, lng: 88.2636, timezoneOffset: 330 },
    { name: "Gwalior, India", lat: 26.2183, lng: 78.1828, timezoneOffset: 330 },
    { name: "Jabalpur, India", lat: 23.1815, lng: 79.9864, timezoneOffset: 330 },
    { name: "Coimbatore, India", lat: 11.0168, lng: 76.9558, timezoneOffset: 330 },
    { name: "Vijayawada, India", lat: 16.5062, lng: 80.6480, timezoneOffset: 330 },
    { name: "Jodhpur, India", lat: 26.2389, lng: 73.0243, timezoneOffset: 330 },
    { name: "Madurai, India", lat: 9.9252, lng: 78.1198, timezoneOffset: 330 },
    { name: "Raipur, India", lat: 21.2514, lng: 81.6296, timezoneOffset: 330 },
    { name: "Chandigarh, India", lat: 30.7333, lng: 76.7794, timezoneOffset: 330 },
    { name: "Guwahati, India", lat: 26.1445, lng: 91.7362, timezoneOffset: 330 },
    { name: "Solapur, India", lat: 17.6599, lng: 75.9064, timezoneOffset: 330 },
    { name: "Mysore, India", lat: 12.2958, lng: 76.6394, timezoneOffset: 330 },
    { name: "Bareilly, India", lat: 28.3670, lng: 79.4304, timezoneOffset: 330 },
    { name: "Gurgaon, India", lat: 28.4595, lng: 77.0266, timezoneOffset: 330 },
    { name: "Aligarh, India", lat: 27.8974, lng: 78.0880, timezoneOffset: 330 },
    { name: "Jalandhar, India", lat: 31.3260, lng: 75.5762, timezoneOffset: 330 },
    { name: "Bhubaneswar, India", lat: 20.2961, lng: 85.8245, timezoneOffset: 330 },
    { name: "Thiruvananthapuram, India", lat: 8.5241, lng: 76.9366, timezoneOffset: 330 },
    { name: "Dehradun, India", lat: 30.3165, lng: 78.0322, timezoneOffset: 330 },
    { name: "Kochi, India", lat: 9.9312, lng: 76.2673, timezoneOffset: 330 },
    { name: "Udaipur, India", lat: 24.5854, lng: 73.7125, timezoneOffset: 330 },
    { name: "Ajmer, India", lat: 26.4499, lng: 74.6399, timezoneOffset: 330 },
    { name: "Noida, India", lat: 28.5355, lng: 77.3910, timezoneOffset: 330 },
    { name: "Haridwar, India", lat: 29.9457, lng: 78.1642, timezoneOffset: 330 },
    { name: "Varanasi, India", lat: 25.3176, lng: 82.9739, timezoneOffset: 330 },
    { name: "Rishikesh, India", lat: 30.0869, lng: 78.2676, timezoneOffset: 330 },
    
    // World Major (Timezones are standard, approximate for demo)
    { name: "New York, USA", lat: 40.7128, lng: -74.0060, timezoneOffset: -300 }, // EST
    { name: "London, UK", lat: 51.5074, lng: -0.1278, timezoneOffset: 0 }, // GMT
    { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, timezoneOffset: 540 }, // JST
    { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093, timezoneOffset: 600 }, // AEST
    { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708, timezoneOffset: 240 }, // GST
    { name: "Singapore", lat: 1.3521, lng: 103.8198, timezoneOffset: 480 }, // SGT
    { name: "Toronto, Canada", lat: 43.6510, lng: -79.3470, timezoneOffset: -300 }, // EST
    { name: "Paris, France", lat: 48.8566, lng: 2.3522, timezoneOffset: 60 }, // CET
    { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050, timezoneOffset: 60 }, // CET
    { name: "Moscow, Russia", lat: 55.7558, lng: 37.6173, timezoneOffset: 180 }, // MSK
    { name: "Beijing, China", lat: 39.9042, lng: 116.4074, timezoneOffset: 480 }, // CST
    { name: "Bangkok, Thailand", lat: 13.7563, lng: 100.5018, timezoneOffset: 420 }, // ICT
    { name: "Kathmandu, Nepal", lat: 27.7172, lng: 85.3240, timezoneOffset: 345 }, // NPT (+5:45)
    { name: "Dhaka, Bangladesh", lat: 23.8103, lng: 90.4125, timezoneOffset: 360 }, // BST
    { name: "Colombo, Sri Lanka", lat: 6.9271, lng: 79.8612, timezoneOffset: 330 }, // IST
    { name: "Los Angeles, USA", lat: 34.0522, lng: -118.2437, timezoneOffset: -480 }, // PST
    { name: "Chicago, USA", lat: 41.8781, lng: -87.6298, timezoneOffset: -360 }, // CST
    { name: "San Francisco, USA", lat: 37.7749, lng: -122.4194, timezoneOffset: -480 }, // PST
    { name: "Hong Kong", lat: 22.3193, lng: 114.1694, timezoneOffset: 480 }, // HKT
    { name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784, timezoneOffset: 180 }, // TRT
    { name: "Rio de Janeiro, Brazil", lat: -22.9068, lng: -43.1729, timezoneOffset: -180 }, // BRT
    { name: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241, timezoneOffset: 120 }, // SAST
    { name: "Cairo, Egypt", lat: 30.0444, lng: 31.2357, timezoneOffset: 120 }, // EET
    { name: "Jakarta, Indonesia", lat: -6.2088, lng: 106.8456, timezoneOffset: 420 }, // WIB
    { name: "Seoul, South Korea", lat: 37.5665, lng: 126.9780, timezoneOffset: 540 }, // KST
    { name: "Mexico City, Mexico", lat: 19.4326, lng: -99.1332, timezoneOffset: -360 }, // CST
    { name: "Lagos, Nigeria", lat: 6.5244, lng: 3.3792, timezoneOffset: 60 }, // WAT
    { name: "Kuala Lumpur, Malaysia", lat: 3.1390, lng: 101.6869, timezoneOffset: 480 }, // MYT
    { name: "Auckland, New Zealand", lat: -36.8485, lng: 174.7633, timezoneOffset: 720 }, // NZST
    { name: "Vancouver, Canada", lat: 49.2827, lng: -123.1207, timezoneOffset: -480 }, // PST
    { name: "Rome, Italy", lat: 41.9028, lng: 12.4964, timezoneOffset: 60 }, // CET
    { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038, timezoneOffset: 60 }, // CET
    { name: "Zurich, Switzerland", lat: 47.3769, lng: 8.5417, timezoneOffset: 60 }, // CET
    { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041, timezoneOffset: 60 }, // CET
    { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686, timezoneOffset: 60 } // CET
  ];

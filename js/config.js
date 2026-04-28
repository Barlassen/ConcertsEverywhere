// ─── API KEYS & CONFIG ───────────────────────────────────────────────────────
// Ticketmaster: https://developer.ticketmaster.com  (ücretsiz)
// ExchangeRate: https://www.exchangerate-api.com    (ücretsiz)
const CONFIG = {
  TICKETMASTER_KEY: 'YOUR_TICKETMASTER_API_KEY',
  EXCHANGERATE_KEY: 'YOUR_EXCHANGERATE_API_KEY',

  // Amadeus sandbox (ücretsiz test ortamı)
  AMADEUS_CLIENT_ID: 'YOUR_AMADEUS_CLIENT_ID',
  AMADEUS_CLIENT_SECRET: 'YOUR_AMADEUS_CLIENT_SECRET',
  AMADEUS_BASE: 'https://test.api.amadeus.com',

  TICKETMASTER_BASE: '/api/concerts',
  EXCHANGERATE_BASE: '/api/rates',
  AMADEUS_BASE: '/api',

};

// Popüler sanatçı önerileri (autocomplete için)
const POPULAR_ARTISTS = [
  { name: 'Taylor Swift', emoji: '🎤', genre: 'Pop' },
  { name: 'Coldplay', emoji: '🎸', genre: 'Rock' },
  { name: 'The Weeknd', emoji: '🎵', genre: 'R&B' },
  { name: 'Billie Eilish', emoji: '🎶', genre: 'Pop' },
  { name: 'Ed Sheeran', emoji: '🎸', genre: 'Pop' },
  { name: 'Beyoncé', emoji: '🎤', genre: 'Pop/R&B' },
  { name: 'Drake', emoji: '🎵', genre: 'Hip-Hop' },
  { name: 'Dua Lipa', emoji: '🎶', genre: 'Pop' },
  { name: 'Post Malone', emoji: '🎤', genre: 'Hip-Hop' },
  { name: 'Adele', emoji: '🎵', genre: 'Soul' },
  { name: 'Bruno Mars', emoji: '🎸', genre: 'Pop/R&B' },
  { name: 'Harry Styles', emoji: '🎤', genre: 'Pop' },
  { name: 'Imagine Dragons', emoji: '🥁', genre: 'Rock' },
  { name: 'Ariana Grande', emoji: '🎶', genre: 'Pop' },
  { name: 'Eminem', emoji: '🎤', genre: 'Hip-Hop' },
  { name: 'Metallica', emoji: '🎸', genre: 'Metal' },
  { name: 'Pink Floyd', emoji: '🎵', genre: 'Rock' },
  { name: 'Radiohead', emoji: '🎶', genre: 'Alt Rock' },
  { name: 'Kendrick Lamar', emoji: '🎤', genre: 'Hip-Hop' },
  { name: 'Lady Gaga', emoji: '🎵', genre: 'Pop' },
];

const POPULAR_CITIES = [
  { name: 'Istanbul', code: 'IST', country: 'TR', flag: '🇹🇷' },
  { name: 'Ankara', code: 'ESB', country: 'TR', flag: '🇹🇷' },
  { name: 'Izmir', code: 'ADB', country: 'TR', flag: '🇹🇷' },
  { name: 'Antalya', code: 'AYT', country: 'TR', flag: '🇹🇷' },
  { name: 'London', code: 'LHR', country: 'GB', flag: '🇬🇧' },
  { name: 'Paris', code: 'CDG', country: 'FR', flag: '🇫🇷' },
  { name: 'New York', code: 'JFK', country: 'US', flag: '🇺🇸' },
  { name: 'Berlin', code: 'BER', country: 'DE', flag: '🇩🇪' },
  { name: 'Amsterdam', code: 'AMS', country: 'NL', flag: '🇳🇱' },
  { name: 'Barcelona', code: 'BCN', country: 'ES', flag: '🇪🇸' },
  { name: 'Rome', code: 'FCO', country: 'IT', flag: '🇮🇹' },
  { name: 'Dubai', code: 'DXB', country: 'AE', flag: '🇦🇪' },
  { name: 'Tokyo', code: 'NRT', country: 'JP', flag: '🇯🇵' },
  { name: 'Los Angeles', code: 'LAX', country: 'US', flag: '🇺🇸' },
  { name: 'Sydney', code: 'SYD', country: 'AU', flag: '🇦🇺' },
];

const AIRLINES = [
  { code: 'TK', name: 'Turkish Airlines', logo: '✈️' },
  { code: 'BA', name: 'British Airways', logo: '🇬🇧' },
  { code: 'LH', name: 'Lufthansa', logo: '🇩🇪' },
  { code: 'AF', name: 'Air France', logo: '🇫🇷' },
  { code: 'EK', name: 'Emirates', logo: '🇦🇪' },
  { code: 'QR', name: 'Qatar Airways', logo: '🇶🇦' },
  { code: 'FR', name: 'Ryanair', logo: '🟡' },
  { code: 'U2', name: 'EasyJet', logo: '🟠' },
  { code: 'PC', name: 'Pegasus', logo: '🔵' },
];

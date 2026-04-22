// ─── CONCERT SERVICE v3 — Çift Link, Yerel Sağlayıcılar & Filtreleme ─────────
const ConcertService = (() => {
  const VENUE_EMOJIS = ['🎸','🎤','🥁','🎹','🎺','🎻','🎵','🎶','🎙️','🎼'];

  const CITIES_DATA = [
    { city:'London',       country:'UK',          lat:51.5074,  lng:-0.1278,  iata:'LHR', domestic:false, provider:'See Tickets', providerUrl:'https://www.seetickets.com/search?q=' },
    { city:'Paris',        country:'France',      lat:48.8566,  lng:2.3522,   iata:'CDG', domestic:false, provider:'Ticketmaster FR', providerUrl:'https://www.ticketmaster.fr/en/search?q=' },
    { city:'Berlin',       country:'Germany',     lat:52.52,    lng:13.405,   iata:'BER', domestic:false, provider:'Eventim', providerUrl:'https://www.eventim.de/search/?searchterm=' },
    { city:'Munich',       country:'Germany',     lat:48.1351,  lng:11.5820,  iata:'MUC', domestic:false, provider:'Eventim', providerUrl:'https://www.eventim.de/search/?searchterm=' },
    { city:'Barcelona',    country:'Spain',       lat:41.3851,  lng:2.1734,   iata:'BCN', domestic:false, provider:'Entradas', providerUrl:'https://www.entradas.com/search/?searchterm=' },
    { city:'Madrid',       country:'Spain',       lat:40.4168,  lng:-3.7038,  iata:'MAD', domestic:false, provider:'Entradas', providerUrl:'https://www.entradas.com/search/?searchterm=' },
    { city:'Amsterdam',    country:'Netherlands', lat:52.3676,  lng:4.9041,   iata:'AMS', domestic:false, provider:'Ticketmaster NL', providerUrl:'https://www.ticketmaster.nl/search?keyword=' },
    { city:'Rome',         country:'Italy',       lat:41.9028,  lng:12.4964,  iata:'FCO', domestic:false, provider:'TicketOne', providerUrl:'https://www.ticketone.it/search/?searchterm=' },
    { city:'Istanbul',     country:'Turkey',      lat:41.0082,  lng:28.9784,  iata:'IST', domestic:true,  provider:'Passo/Biletix', providerUrl:'https://www.biletix.com/search/TURKIYE/tr?q=' },
    { city:'New York',     country:'USA',         lat:40.7128,  lng:-74.006,  iata:'JFK', domestic:false, provider:'Ticketmaster', providerUrl:'https://www.ticketmaster.com/search?q=' }
  ];

  const VENUES = {
    'London':      ['The O2 Arena','Wembley Stadium','Alexandra Palace','Royal Albert Hall'],
    'Paris':       ['Accor Arena','Stade de France','Zénith Paris'],
    'Berlin':      ['Mercedes-Benz Arena','Waldbühne','Tempodrom'],
    'Munich':      ['Olympiahalle','Olympiastadion'],
    'Barcelona':   ['Palau Sant Jordi','Estadi Olímpic'],
    'Madrid':      ['WiZink Center','Estadio Santiago Bernabéu'],
    'Amsterdam':   ['Ziggo Dome','Johan Cruyff ArenA'],
    'Rome':        ['Stadio Olimpico','Auditorium Parco della Musica'],
    'Istanbul':    ['Volkswagen Arena','Ülker Sports Arena','Zorlu PSM'],
    'New York':    ['Madison Square Garden','Barclays Center']
  };

  // Resale/Secondary Platforms
  const RESALE_PLATFORMS = [
    { name: 'StubHub', url: 'https://www.stubhub.com/search/doSearch?searchStr=' },
    { name: 'Viagogo', url: 'https://www.viagogo.com/Search?q=' },
    { name: 'TicketSwap', url: 'https://www.ticketswap.com/search?query=' }
  ];

  function genEventId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length:12}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  }

  function isFakeEvent(name) {
    const lower = name.toLowerCase();
    return lower.includes('tribute') || lower.includes('cover') || lower.includes('fan event') || lower.includes('experience');
  }

  function generateMockConcerts(artistName) {
    // Filter out tribute/fake names if user accidentally typed them
    if(isFakeEvent(artistName)) return [];

    const count = 6 + Math.floor(Math.random() * 4);
    const shuffled = [...CITIES_DATA].sort(() => Math.random() - 0.5).slice(0, count);
    const today = new Date();

    return shuffled.map((loc, i) => {
      const daysAhead = 15 + Math.floor(Math.random() * 180);
      const date = new Date(today.getTime() + daysAhead * 86400000);
      
      // Real concert hours are usually 19:00, 20:00, 21:00
      const concertHour = [19, 20, 21][Math.floor(Math.random() * 3)];
      date.setHours(concertHour, 0, 0, 0);

      const venueList = VENUES[loc.city] || [`${loc.city} Arena`];
      const venue = venueList[Math.floor(Math.random() * venueList.length)];
      const ticketPriceUSD = 45 + Math.floor(Math.random() * 150);
      const eventId = genEventId();
      const now = new Date();

      // Pick a random resale platform
      const resalePlatform = RESALE_PLATFORMS[Math.floor(Math.random() * RESALE_PLATFORMS.length)];

      const isTicketmaster = loc.provider.includes('Ticketmaster');

      return {
        id: `concert-${i}-${eventId}`,
        eventId,
        artist: artistName,
        city: loc.city,
        country: loc.country,
        venue,
        lat: loc.lat + (Math.random() - 0.5) * 0.04,
        lng: loc.lng + (Math.random() - 0.5) * 0.04,
        iata: loc.iata,
        date,
        concertHour,
        dateStr: date.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', weekday:'short' }),
        timeStr: `${concertHour}:00`,
        ticketPriceUSD,
        emoji: VENUE_EMOJIS[Math.floor(Math.random() * VENUE_EMOJIS.length)],
        domestic: loc.domestic,
        
        // DUAL LINK SYSTEM
        officialProvider: loc.provider,
        officialUrl: `${loc.providerUrl}${encodeURIComponent(artistName)}`,
        requiresVPN: isTicketmaster,
        
        resaleProvider: resalePlatform.name,
        resaleUrl: `${resalePlatform.url}${encodeURIComponent(artistName + ' ' + loc.city)}`,
        
        updatedAt: now,
        updatedStr: now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
      };
    }).sort((a, b) => a.date - b.date);
  }

  async function fetchConcerts(artistName) {
    if(isFakeEvent(artistName)) return [];
    // Force mock data to ensure we have the exact dual-link and local provider logic as requested
    await new Promise(r => setTimeout(r, 600));
    return generateMockConcerts(artistName);
  }

  return { fetchConcerts };
})();

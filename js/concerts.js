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

  // Resale/Secondary Platforms
  const RESALE_PLATFORMS = [
    { name: 'StubHub', url: 'https://www.stubhub.com/search/doSearch?searchStr=' },
    { name: 'Viagogo', url: 'https://www.viagogo.com/Search?q=' },
    { name: 'TicketSwap', url: 'https://www.ticketswap.com/search?query=' }
  ];

  const IATA_BY_CITY = {
    amsterdam: 'AMS',
    ankara: 'ESB',
    antalya: 'AYT',
    ashford: 'LGW',
    barcelona: 'BCN',
    berlin: 'BER',
    birmingham: 'BHX',
    boston: 'BOS',
    brussels: 'BRU',
    chicago: 'ORD',
    cologne: 'CGN',
    copenhagen: 'CPH',
    dallas: 'DFW',
    derby: 'EMA',
    dublin: 'DUB',
    dubai: 'DXB',
    dusseldorf: 'DUS',
    edinburgh: 'EDI',
    frankfurt: 'FRA',
    glasgow: 'GLA',
    hamburg: 'HAM',
    hertford: 'STN',
    istanbul: 'IST',
    izmir: 'ADB',
    leeds: 'LBA',
    lisbon: 'LIS',
    london: 'LHR',
    losangeles: 'LAX',
    madrid: 'MAD',
    manchester: 'MAN',
    miami: 'MIA',
    milan: 'MXP',
    munich: 'MUC',
    newyork: 'JFK',
    paris: 'CDG',
    prague: 'PRG',
    rome: 'FCO',
    sanfrancisco: 'SFO',
    sanjuancapistrano: 'SNA',
    seattle: 'SEA',
    stockholm: 'ARN',
    sydney: 'SYD',
    tokyo: 'NRT',
    vienna: 'VIE',
    warsaw: 'WAW',
    zurich: 'ZRH'
  };

  function normalizeKey(value) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  function nearestKnownAirport(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    let nearest = null;
    let minDistance = Infinity;
    CITIES_DATA.forEach(loc => {
      const distance = Math.hypot(lat - loc.lat, lng - loc.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = loc;
      }
    });
    return minDistance <= 2.5 ? nearest?.iata : null;
  }

  function inferIata(city, lat, lng) {
    const cityKey = normalizeKey(city);
    return IATA_BY_CITY[cityKey] || nearestKnownAirport(lat, lng) || 'LHR';
  }

  function pickLowestPriceUSD(priceRanges) {
    if (!Array.isArray(priceRanges) || !priceRanges.length) return 0;

    const validRanges = priceRanges
      .filter(pr => pr && (Number.isFinite(pr.min) || Number.isFinite(pr.max)))
      .sort((a, b) => {
        const aIsStandard = a.type === 'standard' ? 0 : 1;
        const bIsStandard = b.type === 'standard' ? 0 : 1;
        return aIsStandard - bIsStandard;
      });

    for (const pr of validRanges) {
      const rawPrice = Number.isFinite(pr.min) ? pr.min : pr.max;
      const currencyCode = pr.currency || 'USD';
      const converted = CurrencyService.convert(rawPrice, currencyCode, 'USD');
      if (converted > 0) return converted;
    }
    return 0;
  }

  function pickVenueEmoji(seed) {
    const text = seed || '';
    const total = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return VENUE_EMOJIS[total % VENUE_EMOJIS.length];
  }

  function isFakeEvent(name) {
    if (!name) return false;
    const lower = name.toLowerCase();
    const badWords = [
      'tribute', 'cover', 'fan event', 'experience', 'night', 
      'candlelight', 'orchestra', 'symphony', 'philharmonic', 'symphonic',
      'party', 'club', 'impersonator', 'dj set', 'silent disco', 
      'laser', 'spectacular', 'project', 'tributes', 'hommage', 'celebration', 'bootleg'
    ];
    // Regex ile tam kelime eşleşmesi arıyoruz
    return badWords.some(word => new RegExp('\\b' + word + '\\b', 'i').test(name));
  }

  function isAuthenticArtist(searchedArtist, performerNames) {
    if (!performerNames || performerNames.length === 0) return false; // Performer listesi boşsa şüphelidir, engelle!
    
    const searchLower = searchedArtist.toLowerCase().trim();
    const normalizedSearch = searchLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

    return performerNames.some(name => {
       const nameLower = name.toLowerCase().trim();
       const normalizedName = nameLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
       
       // Birebir eşleşme
       if (nameLower === searchLower) return true;
       // Normalize edilmiş birebir eşleşme (Örn: Beyoncé == Beyonce)
       if (normalizedName === normalizedSearch) return true;
       
       // Kısmi eşleşme (Sanatçının adı performer adının başında geçiyorsa, Örn: "Taylor Swift & Friends")
       if (nameLower.startsWith(searchLower) || normalizedName.startsWith(normalizedSearch)) {
           // Ancak bu isim "Pink Floyd Tribute" gibi sahte bir isim olmamalı
           if (isFakeEvent(name)) return false;
           return true;
       }
       return false;
    });
  }

  async function fetchConcerts(artistName) {
    if(isFakeEvent(artistName)) return [];

    try {
      const encodedArtist = encodeURIComponent(artistName);
      
      // Paralel API istekleri (Hata toleranslı)
      const [tmRes, sgRes] = await Promise.allSettled([
        fetch(`/api/concerts?keyword=${encodedArtist}`),
        fetch(`/api/seatgeek?keyword=${encodedArtist}`)
      ]);

      let allEvents = [];
      const now = new Date();

      // 1. Ticketmaster Verilerini İşle
      if (tmRes.status === 'fulfilled') {
        const tmData = await tmRes.value.json();
        if (tmRes.value.ok && tmData._embedded && tmData._embedded.events) {
          const realEvents = tmData._embedded.events.filter(e => {
            // İsim, açıklama ve notları birleştirip geniş çaplı tarama yapıyoruz
            const textToScan = [e.name, e.info, e.pleaseNote, e.description].filter(Boolean).join(' ');
            if (isFakeEvent(textToScan)) return false;

            // Ticketmaster genre filtresi
            if (e.classifications && e.classifications.length > 0) {
              const genre = e.classifications[0].genre?.name?.toLowerCase() || '';
              const subGenre = e.classifications[0].subGenre?.name?.toLowerCase() || '';
              if (genre.includes('tribute') || subGenre.includes('tribute')) return false;
              if (genre.includes('cover') || subGenre.includes('cover')) return false;
            }
            
            // KESİN ÇÖZÜM: Aranan sanatçı, etkinliğin "attractions" (sahne alanlar) listesinde BİREBİR olmak zorunda.
            const attractions = e._embedded?.attractions?.map(a => a.name) || [];
            if (!isAuthenticArtist(artistName, attractions)) return false;

            return true;
          });
          
          const mappedTM = realEvents.map((event) => {
            const venueData = event._embedded?.venues?.[0];
            const city = venueData?.city?.name || 'Bilinmiyor';
            const country = venueData?.country?.name || '';
            const venueName = venueData?.name || 'Bilinmeyen Mekan';
            const lat = venueData?.location?.latitude ? parseFloat(venueData.location.latitude) : 0;
            const lng = venueData?.location?.longitude ? parseFloat(venueData.location.longitude) : 0;
            const dateObj = new Date(event.dates.start.dateTime || event.dates.start.localDate);
            
            let concertHour = 20;
            if (event.dates.start.localTime) {
              concertHour = parseInt(event.dates.start.localTime.split(':')[0], 10);
            } else if (event.dates.start.dateTime) {
              concertHour = dateObj.getHours();
            }
            
            const price = pickLowestPriceUSD(event.priceRanges);

            const resalePlatform = RESALE_PLATFORMS[0];

            // URL'ye göre asıl satıcıyı bul (Universe, LiveNation vs.)
            let providerName = 'Ticketmaster';
            const officialUrl = event.url || '#';
            const urlLower = officialUrl.toLowerCase();
            if (urlLower.includes('universe.com')) providerName = 'Universe';
            else if (urlLower.includes('livenation.')) providerName = 'Live Nation';
            else if (urlLower.includes('ticketweb.')) providerName = 'TicketWeb';
            else if (urlLower.includes('frontgate')) providerName = 'Front Gate Tickets';

            return {
              id: `tm-${event.id}`,
              eventId: event.id,
              artist: artistName,
              city: city,
              country: country,
              venue: venueName,
              lat: lat,
              lng: lng,
              iata: inferIata(city, lat, lng),
              date: dateObj,
              concertHour: concertHour,
              dateStr: dateObj.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', weekday:'short' }),
              timeStr: event.dates.start.localTime ? `${event.dates.start.localTime.substring(0,5)} (${city} Saati)` : 'Belirtilmemiş',
              ticketPriceUSD: Math.round(price),
              emoji: pickVenueEmoji(event.id || event.name),
              domestic: country.toLowerCase().includes('turkey') || country.toLowerCase() === 'tr',
              
              officialProvider: providerName,
              officialUrl: officialUrl,
              requiresVPN: providerName === 'Ticketmaster', // VPN genelde sadece Ticketmaster için şart
              
              resaleProvider: resalePlatform.name,
              resaleUrl: `${resalePlatform.url}${encodeURIComponent(artistName + ' ' + city)}`,
              
              updatedAt: now,
              updatedStr: now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
            };
          });
          allEvents = [...allEvents, ...mappedTM];
        }
      }

      // 2. SeatGeek Verilerini İşle
      if (sgRes.status === 'fulfilled') {
        const sgData = await sgRes.value.json();
        if (sgRes.value.ok && sgData.events) {
          const realEvents = sgData.events.filter(e => {
            // İsim, açıklama ve sanatçı biyografilerini birleştirip geniş çaplı tarama yapıyoruz
            const textToScan = [
              e.title, 
              e.description, 
              ...(e.performers || []).map(p => p.name),
              ...(e.performers || []).map(p => p.short_bio)
            ].filter(Boolean).join(' ');
            
            if (isFakeEvent(textToScan)) return false;

            // KESİN ÇÖZÜM: Aranan sanatçı, SeatGeek performer listesinde birebir olmalı.
            const performers = e.performers?.map(p => p.name) || [];
            if (!isAuthenticArtist(artistName, performers)) return false;

            return true;
          });
          
          const mappedSG = realEvents.map((event) => {
            const venueData = event.venue;
            const city = venueData?.city || 'Bilinmiyor';
            const country = venueData?.country || '';
            const venueName = venueData?.name || 'Bilinmeyen Mekan';
            const lat = venueData?.location?.lat ? parseFloat(venueData.location.lat) : 0;
            const lng = venueData?.location?.lon ? parseFloat(venueData.location.lon) : 0;
            const dateObj = new Date(event.datetime_local || event.datetime_utc);
            
            let concertHour = 20;
            if (event.datetime_local) {
              concertHour = parseInt(event.datetime_local.substring(11, 13), 10);
            } else {
              concertHour = dateObj.getHours();
            }
            
            let price = event.stats?.lowest_price || event.stats?.average_price || 0;

            const resalePlatform = RESALE_PLATFORMS[0];

            return {
              id: `sg-${event.id}`,
              eventId: event.id.toString(),
              artist: artistName,
              city: city,
              country: country,
              venue: venueName,
              lat: lat,
              lng: lng,
              iata: inferIata(city, lat, lng),
              date: dateObj,
              concertHour: concertHour,
              dateStr: dateObj.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', weekday:'short' }),
              timeStr: event.datetime_local ? `${event.datetime_local.substring(11, 16)} (${city} Saati)` : `${dateObj.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })} (Yerel)`,
              ticketPriceUSD: Math.round(price),
              emoji: pickVenueEmoji(event.id?.toString() || event.title),
              domestic: country.toLowerCase().includes('turkey') || country.toLowerCase() === 'tr',
              
              officialProvider: 'SeatGeek',
              officialUrl: event.url || '#',
              requiresVPN: false,
              
              resaleProvider: resalePlatform.name,
              resaleUrl: `${resalePlatform.url}${encodeURIComponent(artistName + ' ' + city)}`,
              
              updatedAt: now,
              updatedStr: now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
            };
          });
          allEvents = [...allEvents, ...mappedSG];
        }
      }

      // --- DEDUPLICATION & PRICE MERGING ---
      const groupedEvents = {};
      
      allEvents.forEach(event => {
        // Benzersiz anahtar: Tarih (dateStr) + Şehir (ilk 5 harf boşluksuz)
        const normalizedCity = event.city.toLowerCase().replace(/[^a-z]/g, '').substring(0, 5); 
        const key = `${event.dateStr}-${normalizedCity}`;

        if (!groupedEvents[key]) {
           groupedEvents[key] = event;
        } else {
           const existing = groupedEvents[key];
           let merged = { ...existing };
           
           // 1. PRICE MERGING: Fiyat eksikse (0) diğerinden al. İkisinde de varsa en ucuzu al.
           if (existing.ticketPriceUSD === 0 && event.ticketPriceUSD > 0) {
               merged.ticketPriceUSD = event.ticketPriceUSD;
           } else if (existing.ticketPriceUSD > 0 && event.ticketPriceUSD > 0) {
               merged.ticketPriceUSD = Math.min(existing.ticketPriceUSD, event.ticketPriceUSD);
           }
           
           // 2. LINK MERGING: Resmi satış Ticketmaster, ikinci el Seatgeek olacak şekilde düzenle
           if (event.officialProvider === 'Ticketmaster' || event.officialProvider === 'Live Nation' || event.officialProvider === 'Universe') {
               merged.officialProvider = event.officialProvider;
               merged.officialUrl = event.officialUrl;
               merged.requiresVPN = event.requiresVPN;
               // Eğer halihazırda var olan SeatGeek idiyse, onu Resale (İkinci el) linkine at
               if (existing.officialProvider === 'SeatGeek') {
                   merged.resaleProvider = 'SeatGeek (Karaborsa/Resale)';
                   merged.resaleUrl = existing.officialUrl;
               }
           } else if (event.officialProvider === 'SeatGeek') {
               // Eklenen event Seatgeek ise, onu Resale olarak ata
               merged.resaleProvider = 'SeatGeek (Karaborsa/Resale)';
               merged.resaleUrl = event.officialUrl;
           }
           
           groupedEvents[key] = merged;
        }
      });

      // Gruplanmış (birleştirilmiş) tekil etkinlik listesini al
      allEvents = Object.values(groupedEvents);
      // ------------------------------------

      // Eğer iki API'den de veri gelmezse boş liste dön (Mock veri GÖSTERME!)
      if (allEvents.length === 0) {
        console.warn('API verileri boş, sanatçının güncel konseri bulunamadı.');
        return [];
      }

      // Tüm etkinlikleri tarihe göre sırala
      allEvents.sort((a, b) => a.date - b.date);

      return allEvents;

    } catch (e) {
      console.error('Error fetching concerts:', e);
      return [];
    }
  }

  return { fetchConcerts };
})();

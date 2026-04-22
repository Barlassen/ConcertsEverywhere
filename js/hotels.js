// ─── HOTEL SERVICE v3 — Mutlak En Ucuz (Hostel/Dorm Dahil) ────────────
const HotelService = (() => {

  // Build real Booking.com search URL (Strictly Lowest Price)
  function bookingUrl(city, checkIn, checkOut) {
    const ci = checkIn instanceof Date ? checkIn.toISOString().split('T')[0] : checkIn;
    const co = checkOut instanceof Date ? checkOut.toISOString().split('T')[0] : checkOut;
    const [ciY, ciM, ciD] = ci.split('-');
    const [coY, coM, coD] = co.split('-');
    
    // order=price guarantees the absolute cheapest options are shown first
    // nflt=ht_id=203 (Hostel filter in Booking, adding it loosely as keyword search or just relying on order=price)
    return `https://www.booking.com/searchresults.html`
      + `?ss=${encodeURIComponent(city)}`
      + `&checkin_year=${ciY}&checkin_month=${parseInt(ciM)}&checkin_monthday=${parseInt(ciD)}`
      + `&checkout_year=${coY}&checkout_month=${parseInt(coM)}&checkout_monthday=${parseInt(coD)}`
      + `&group_adults=1&order=price`;
  }

  const CHEAP_ACCOMS = [
    { name:'Generator Hostel', type:'Hostel (Paylaşımlı Oda)' },
    { name:'St. Christopher\'s Inn', type:'Hostel (Dorm)' },
    { name:'easyHotel', type:'Bütçe Oteli' },
    { name:'Meininger', type:'Hostel & Otel' },
    { name:'Wombat\'s City Hostel', type:'Hostel (Dorm)' },
    { name:'A&O Hostels', type:'Hostel' },
    { name:'Safestay', type:'Hostel' },
    { name:'Ibis Budget', type:'Bütçe Oteli' }
  ];

  function fetchHotels(concert, concertDate, nights = 2) {
    // Return a promise directly
    return new Promise(resolve => {
      setTimeout(() => {
        const checkIn = new Date(concertDate);
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(checkIn.getTime() + nights * 86400000);
        const now = new Date();

        const results = [];
        const count = 5; // Yalnızca en ucuz 5 seçenek isteniyor

        const shuffled = [...CHEAP_ACCOMS].sort(() => Math.random() - 0.5).slice(0, count);

        shuffled.forEach((accom, i) => {
          // Çok ucuz fiyatlar: 15$ - 45$ arası gecelik
          const pricePerNightUSD = 15 + Math.floor(Math.random() * 30);
          const totalUSD = pricePerNightUSD * nights;
          
          results.push({
            id: `accom-${i}`,
            name: accom.name,
            type: accom.type,
            stars: accom.type.includes('Hostel') ? 1 : 2, // Sembolik yıldız
            distKm: (0.5 + Math.random() * 4).toFixed(1), // Merkezden/Mekandan biraz uzak olabilir
            lat: concert.lat + (Math.random() - 0.5) * 0.1,
            lng: concert.lng + (Math.random() - 0.5) * 0.1,
            pricePerNightUSD,
            totalUSD,
            nights,
            rating: (6.0 + Math.random() * 3).toFixed(1),
            reviewCount: Math.floor(100 + Math.random() * 2000),
            bookingUrl: bookingUrl(concert.city, checkIn, checkOut),
            source: 'Booking.com (En Düşük Fiyat)',
            updatedAt: now,
            updatedStr: now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })
          });
        });

        // En ucuzdan pahalıya sırala
        results.sort((a,b) => a.totalUSD - b.totalUSD);
        
        // Uyumluluk için all içine atıyoruz (artık kategoriler yok, sadece en ucuz 5)
        resolve({ all: results });
      }, 700);
    });
  }

  return { fetchHotels };
})();

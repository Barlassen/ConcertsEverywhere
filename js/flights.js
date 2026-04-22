// ─── FLIGHT SERVICE v3 — Gidiş-Dönüş (Round Trip) & T-4 Saat Filtresi ──────────
const FlightService = (() => {

  // Build Skyscanner Round Trip URL
  // Format: skyscanner.com/transport/flights/{from}/{to}/{outDate}/{returnDate}/
  function skyscannerRoundTripUrl(originCode, destCode, outDate, returnDate) {
    const outD = new Date(outDate);
    const outStr = `${String(outD.getFullYear()).slice(2)}${String(outD.getMonth()+1).padStart(2,'0')}${String(outD.getDate()).padStart(2,'0')}`;
    
    const retD = new Date(returnDate);
    const retStr = `${String(retD.getFullYear()).slice(2)}${String(retD.getMonth()+1).padStart(2,'0')}${String(retD.getDate()).padStart(2,'0')}`;
    
    return `https://www.skyscanner.com/transport/flights/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${outStr}/${retStr}/`;
  }

  // T-4 saat kontrolü (konserden en az 4 saat önce varmalı)
  function arrivesInTime(flight, concertHour) {
    // Eğer uçuş konser gününden önceyse her türlü yetişir
    if (flight.daysBeforeConcert > 0) return true;
    
    // Konser günüyse, varış saati (decimal) <= konserSaati - 4
    const arrHour = parseInt((flight.outbound.arrTime || '00:00').split(':')[0]);
    const arrMin = parseInt((flight.outbound.arrTime || '00:00').split(':')[1] || '0');
    const arrDecimal = arrHour + arrMin / 60;
    
    return arrDecimal <= (concertHour - 4);
  }

  function generateMockFlights(originCity, destConcert, concertDate, concertHour) {
    const originData = POPULAR_CITIES.find(c =>
      c.name.toLowerCase() === originCity.toLowerCase()
    ) || { code: 'IST', name: originCity };

    const originCode = originData.code;
    const destCode = destConcert.iata || 'LHR';
    const isDomestic = destConcert.domestic;
    const concertDay = new Date(concertDate);
    
    // Dönüş: Konserden 1 gün sonra
    const returnDay = new Date(concertDay.getTime() + 86400000);
    const now = new Date();
    const results = [];

    // Gidiş: Konserden 2 gün öncesinden konser gününe kadar
    for (let dayOffset = -2; dayOffset <= 0; dayOffset++) {
      const depDate = new Date(concertDay.getTime() + dayOffset * 86400000);
      depDate.setHours(0, 0, 0, 0);
      if (depDate < now) continue;

      const numFlights = 3 + Math.floor(Math.random() * 3);
      for (let f = 0; f < numFlights; f++) {
        const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
        
        // Gidiş detayları
        const outDepHour = 5 + Math.floor(Math.random() * 14);
        const outDepMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        const outDurMins = isDomestic ? 50 + Math.floor(Math.random() * 60) : 120 + Math.floor(Math.random() * 240);
        const outTotalArr = outDepHour * 60 + outDepMin + outDurMins;
        const outArrHour = Math.floor(outTotalArr / 60) % 24;
        const outArrMin = outTotalArr % 60;

        // Dönüş detayları (Ertesi gün sabah/öğle)
        const retDepHour = 8 + Math.floor(Math.random() * 8); // 08:00 - 15:00 arası
        const retDepMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        const retDurMins = outDurMins + (Math.floor(Math.random() * 20) - 10);
        const retTotalArr = retDepHour * 60 + retDepMin + retDurMins;
        const retArrHour = Math.floor(retTotalArr / 60) % 24;
        const retArrMin = retTotalArr % 60;

        const baseUSD = isDomestic ? 60 + Math.random() * 100 : 150 + Math.random() * 400; // Round-trip fiyatı
        const priceUSD = Math.round(baseUSD);

        const flight = {
          id: `FL-RT-${dayOffset}${f}${Date.now()}`,
          airline: airline.name,
          airlineCode: airline.code,
          airlineLogo: airline.logo,
          originCode,
          originCity: originData.name,
          destCode,
          destCity: destConcert.city,
          priceUSD,
          priceTRY: Math.round(priceUSD * 32.5),
          daysBeforeConcert: Math.abs(dayOffset),
          isDomestic,
          
          outbound: {
            date: new Date(depDate),
            dateStr: depDate.toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' }),
            depTime: `${String(outDepHour).padStart(2,'0')}:${String(outDepMin).padStart(2,'0')}`,
            arrTime: `${String(outArrHour).padStart(2,'0')}:${String(outArrMin).padStart(2,'0')}`,
            durationStr: `${Math.floor(outDurMins/60)}s ${outDurMins%60}dk`,
            stopsStr: isDomestic ? 'Aktarmasız' : (Math.random()>0.7 ? '1 Aktarma' : 'Aktarmasız')
          },
          
          return: {
            date: new Date(returnDay),
            dateStr: returnDay.toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' }),
            depTime: `${String(retDepHour).padStart(2,'0')}:${String(retDepMin).padStart(2,'0')}`,
            arrTime: `${String(retArrHour).padStart(2,'0')}:${String(retArrMin).padStart(2,'0')}`,
            durationStr: `${Math.floor(retDurMins/60)}s ${retDurMins%60}dk`,
            stopsStr: isDomestic ? 'Aktarmasız' : (Math.random()>0.7 ? '1 Aktarma' : 'Aktarmasız')
          },

          bookingUrl: skyscannerRoundTripUrl(originCode, destCode, depDate, returnDay),
          source: 'Skyscanner Canlı',
          updatedAt: now,
          updatedStr: now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
        };

        flight.arrivesInTime = arrivesInTime(flight, concertHour || 20);
        results.push(flight);
      }
    }

    results.sort((a, b) => a.priceUSD - b.priceUSD);
    const validFlights = results.filter(f => f.arrivesInTime);
    if (validFlights.length > 0) validFlights[0].isBestDeal = true;
    return results;
  }

  async function fetchFlights(originCity, destConcert, concertDate, concertHour) {
    await new Promise(r => setTimeout(r, 600));
    return generateMockFlights(originCity, destConcert, concertDate, concertHour || 20);
  }

  // Sadece grafikte göstermek için
  function buildPriceCalendar(flights) {
    const byDay = {};
    flights.filter(f => f.arrivesInTime).forEach(f => {
      const key = f.outbound.date.toISOString().split('T')[0];
      if (!byDay[key] || f.priceUSD < byDay[key].priceUSD) byDay[key] = f;
    });
    const days = Object.values(byDay).sort((a, b) => a.outbound.date - b.outbound.date);
    if (!days.length) return [];
    const minPrice = Math.min(...days.map(d => d.priceUSD));
    return days.map(d => ({ ...d, isCheapest: d.priceUSD === minPrice }));
  }

  return { fetchFlights, buildPriceCalendar };
})();

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

  async function fetchFlights(originCity, destConcert, concertDate, concertHour) {
    try {
      const originData = POPULAR_CITIES.find(c => c.name.toLowerCase() === originCity.toLowerCase()) || { code: 'IST' };
      const depDate = new Date(concertDate);
      const depDateStr = depDate.toISOString().split('T')[0];
      const returnDate = new Date(depDate.getTime() + 86400000);
      const returnDateStr = returnDate.toISOString().split('T')[0];

      const response = await fetch(`/api/flights?originCode=${originData.code}&destCode=${destConcert.iata || 'LHR'}&date=${depDateStr}&returnDate=${returnDateStr}`);
      const data = await response.json();

      if (!response.ok || !data.data) {
        console.warn(data.error || 'Flight data is unavailable');
        return [];
      }

      const now = new Date();
      const roundTripOffers = data.data.filter(offer => offer.itineraries?.length >= 2);
      const results = roundTripOffers.map((offer, i) => {
        const outItin = offer.itineraries[0];
        const retItin = offer.itineraries[1];
        const outSegment = outItin.segments[0];
        const retSegment = retItin.segments[0];
        const priceOriginal = parseFloat(offer.price.total);
        const currencyCode = offer.price.currency || 'EUR';
        const priceUSD = CurrencyService.convert(priceOriginal, currencyCode, 'USD') || (priceOriginal / 0.92);

        const depTime = new Date(outSegment.departure.at);
        const arrTime = new Date(outSegment.arrival.at);
        const retDepTime = new Date(retSegment.departure.at);
        const retArrTime = new Date(retSegment.arrival.at);

        const flight = {
          id: offer.id || `FL-${Date.now()}-${i}`,
          airline: outSegment.carrierCode, // Should map code to name
          airlineCode: outSegment.carrierCode,
          airlineLogo: '✈️',
          originCode: originData.code,
          originCity: originCity,
          destCode: destConcert.iata || 'LHR',
          destCity: destConcert.city,
          priceUSD: Math.round(priceUSD),
          priceTRY: Math.round(priceUSD * 32.5),
          daysBeforeConcert: 0,
          isDomestic: destConcert.domestic,
          
          outbound: {
            date: depTime,
            dateStr: depTime.toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' }),
            depTime: `${depTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} (Yerel)`,
            arrTime: `${arrTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} (Yerel)`,
            durationStr: outItin.duration,
            stopsStr: outItin.segments.length > 1 ? `${outItin.segments.length - 1} Aktarma` : 'Aktarmasız'
          },
          
          return: {
            date: retDepTime,
            dateStr: retDepTime.toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' }),
            depTime: `${retDepTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} (Yerel)`,
            arrTime: `${retArrTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} (Yerel)`,
            durationStr: retItin.duration,
            stopsStr: retItin.segments.length > 1 ? `${retItin.segments.length - 1} Aktarma` : 'Aktarmasız'
          },

          bookingUrl: skyscannerRoundTripUrl(originData.code, destConcert.iata || 'LHR', depTime, retDepTime),
          source: 'Amadeus Canlı',
          updatedAt: now,
          updatedStr: now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
        };

        flight.arrivesInTime = arrivesInTime(flight, concertHour || 20);
        return flight;
      });

      results.sort((a, b) => a.priceUSD - b.priceUSD);
      const validFlights = results.filter(f => f.arrivesInTime);
      if (validFlights.length > 0) validFlights[0].isBestDeal = true;
      
      return results;

    } catch (e) {
      console.error('Error fetching flights:', e);
      return [];
    }
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

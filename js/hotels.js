// ─── HOTEL SERVICE — Real data only ──────────────────────────────────────────
const HotelService = (() => {

  function bookingUrl(city, checkIn, checkOut, hotelName = '') {
    const ci = checkIn instanceof Date ? checkIn.toISOString().split('T')[0] : checkIn;
    const co = checkOut instanceof Date ? checkOut.toISOString().split('T')[0] : checkOut;
    const [ciY, ciM, ciD] = ci.split('-');
    const [coY, coM, coD] = co.split('-');
    const searchQuery = hotelName ? `${hotelName} ${city}` : city;

    return `https://www.booking.com/searchresults.html`
      + `?ss=${encodeURIComponent(searchQuery)}`
      + `&checkin_year=${ciY}&checkin_month=${parseInt(ciM)}&checkin_monthday=${parseInt(ciD)}`
      + `&checkout_year=${coY}&checkout_month=${parseInt(coM)}&checkout_monthday=${parseInt(coD)}`
      + `&group_adults=1&order=price`;
  }

  async function fetchHotels(concert, concertDate, nights = 2) {
    try {
      const cityCode = concert.iata;
      if (!cityCode) return { all: [] };

      const response = await fetch(`/api/hotels?cityCode=${cityCode}`);
      const data = await response.json();
      if (!response.ok || !data.data) {
        console.warn(data.error || 'Hotel data is unavailable');
        return { all: [] };
      }

      // The current Amadeus hotel-by-city endpoint returns hotel metadata, not live prices.
      // Without a real priced offer feed, we intentionally return no priced hotel results.
      return { all: [] };
    } catch (e) {
      console.error('Error fetching hotels:', e);
      return { all: [] };
    }
  }

  return { fetchHotels, bookingUrl };
})();

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
    const city = concert.city || '';
    const venue = concert.venue || '';
    const searchQuery = city;

    const checkIn = concertDate || new Date();
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);

    const url = bookingUrl(searchQuery, checkIn, checkOut);

    return {
      all: [],
      externalUrl: url,
      city: city,
      venue: venue
    };
  }

  return { fetchHotels, bookingUrl };
})();

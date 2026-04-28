const axios = require('axios');
require('dotenv').config({ quiet: true });

async function test() {
  const artist = 'Coldplay';
  
  // Ticketmaster
  console.log("--- TICKETMASTER ---");
  const tmRes = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
    params: { keyword: artist, apikey: process.env.TICKETMASTER_API_KEY, classificationName: 'music' }
  });
  
  if(tmRes.data._embedded && tmRes.data._embedded.events) {
    tmRes.data._embedded.events.slice(0,2).forEach(e => {
      console.log("TM Event:", e.name, e.dates.start.localDate);
      if (e.priceRanges) {
          console.log("TM PriceRanges:", e.priceRanges.map(p => `${p.min}-${p.max} ${p.currency}`));
      } else {
          console.log("TM PriceRanges: None");
      }
    });
  }

  // SeatGeek
  console.log("--- SEATGEEK ---");
  const sgRes = await axios.get('https://api.seatgeek.com/2/events', {
    params: { q: artist, type: 'concert', client_id: process.env.SEATGEEK_CLIENT_ID }
  });
  if(sgRes.data.events) {
    sgRes.data.events.slice(0,2).forEach(e => {
      console.log("SG Event:", e.title, e.datetime_local);
      console.log("SG Stats:", e.stats);
    });
  }
}
test().catch(error => {
  console.error('API test failed:', error.response?.status || error.code || error.message);
  const message = error.response?.data?.fault?.faultstring || error.response?.data?.message;
  if (message) console.error(message);
  process.exit(1);
});

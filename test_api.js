const axios = require('axios');
require('dotenv').config({ quiet: true });

async function test() {
  const artist = 'Pink Floyd';
  
  // Ticketmaster
  const tmRes = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
    params: { keyword: artist, apikey: process.env.TICKETMASTER_API_KEY, classificationName: 'music' }
  });
  
  console.log("--- TICKETMASTER ---");
  if(tmRes.data._embedded && tmRes.data._embedded.events) {
    tmRes.data._embedded.events.slice(0,3).forEach(e => {
      console.log("Event Name:", e.name);
      const attractions = e._embedded?.attractions?.map(a => a.name) || [];
      console.log("Attractions:", attractions);
    });
  }

  // SeatGeek
  if (process.env.SEATGEEK_CLIENT_ID && process.env.SEATGEEK_CLIENT_ID !== 'YOUR_SEATGEEK_CLIENT_ID_HERE') {
      const sgRes = await axios.get('https://api.seatgeek.com/2/events', {
        params: { q: artist, type: 'concert', client_id: process.env.SEATGEEK_CLIENT_ID }
      });
      console.log("--- SEATGEEK ---");
      if(sgRes.data.events) {
        sgRes.data.events.slice(0,3).forEach(e => {
          console.log("Event Title:", e.title);
          const performers = e.performers?.map(p => p.name) || [];
          console.log("Performers:", performers);
        });
      }
  } else {
      console.log("No SeatGeek key found");
  }
}
test().catch(error => {
  console.error('API test failed:', error.response?.status || error.code || error.message);
  const message = error.response?.data?.fault?.faultstring || error.response?.data?.message;
  if (message) console.error(message);
  process.exit(1);
});

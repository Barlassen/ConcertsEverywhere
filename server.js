require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { scrapeConcertsHybrid } = require('./scrapers/index');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '')));

// --- Helper for Amadeus Access Token ---
let amadeusToken = null;
let amadeusTokenExpiry = 0;

async function getAmadeusToken() {
  if (amadeusToken && Date.now() < amadeusTokenExpiry) {
    return amadeusToken;
  }
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.AMADEUS_CLIENT_ID);
    params.append('client_secret', process.env.AMADEUS_CLIENT_SECRET);

    const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    amadeusToken = response.data.access_token;
    amadeusTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // expire 1 min early
    return amadeusToken;
  } catch (error) {
    console.error('Error fetching Amadeus token:', error.response?.data || error.message);
    throw new Error('Failed to get Amadeus token');
  }
}

function getSegmentTime(slice, boundary) {
  const segments = slice?.segments || [];
  if (!segments.length) return null;
  const segment = boundary === 'arrival' ? segments[segments.length - 1] : segments[0];
  return boundary === 'arrival' ? segment.arriving_at : segment.departing_at;
}

function getCarrierName(slice) {
  const segment = slice?.segments?.[0];
  return segment?.marketing_carrier?.name
    || segment?.operating_carrier?.name
    || segment?.marketing_carrier?.iata_code
    || segment?.operating_carrier?.iata_code
    || 'Duffel';
}

function normalizeDuffelOffer(offer) {
  const outbound = offer.slices?.[0];
  const inbound = offer.slices?.[1];
  const outboundDeparture = getSegmentTime(outbound, 'departure');
  const outboundArrival = getSegmentTime(outbound, 'arrival');
  const returnDeparture = getSegmentTime(inbound, 'departure');
  const returnArrival = getSegmentTime(inbound, 'arrival');

  return {
    id: offer.id,
    airline: getCarrierName(outbound),
    airlineCode: outbound?.segments?.[0]?.marketing_carrier?.iata_code
      || outbound?.segments?.[0]?.operating_carrier?.iata_code
      || '',
    totalAmount: offer.total_amount,
    totalCurrency: offer.total_currency,
    outbound: {
      departureAt: outboundDeparture,
      arrivalAt: outboundArrival,
      duration: outbound?.duration,
      stops: Math.max((outbound?.segments?.length || 1) - 1, 0)
    },
    return: {
      departureAt: returnDeparture,
      arrivalAt: returnArrival,
      duration: inbound?.duration,
      stops: Math.max((inbound?.segments?.length || 1) - 1, 0)
    }
  };
}

async function searchDuffelFlights({ originCode, destCode, date, returnDate }) {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token || token === 'YOUR_DUFFEL_TEST_OR_LIVE_ACCESS_TOKEN_HERE') {
    return null;
  }

  const response = await axios.post(
    'https://api.duffel.com/air/offer_requests',
    {
      data: {
        slices: [
          { origin: originCode, destination: destCode, departure_date: date },
          { origin: destCode, destination: originCode, departure_date: returnDate }
        ],
        passengers: [{ type: 'adult' }],
        cabin_class: 'economy'
      }
    },
    {
      params: { return_offers: true, supplier_timeout: 10000 },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        Authorization: `Bearer ${token}`
      },
      timeout: 20000
    }
  );

  const offers = response.data?.data?.offers || [];
  return offers.map(normalizeDuffelOffer);
}

// --- API Endpoints ---

// 1. Exchange Rates
app.get('/api/rates', async (req, res) => {
  try {
    const base = req.query.base || 'USD';
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    
    // Fallback rates if API key is missing
    if (!apiKey || apiKey === 'YOUR_EXCHANGERATE_API_KEY_HERE') {
      console.warn('ExchangeRate API key is missing, using fallback rates.');
      return res.json({
        result: 'success',
        base_code: 'USD',
        conversion_rates: {
          USD: 1,
          TRY: 32.5,
          EUR: 0.92,
          GBP: 0.79
        }
      });
    }

    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`);
    res.json(response.data);
  } catch (error) {
    console.error('ExchangeRate Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// 2. Ticketmaster Concerts
app.get('/api/concerts', async (req, res) => {
  try {
    const { keyword } = req.query;
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TICKETMASTER_API_KEY_HERE') {
      return res.status(503).json({ error: 'Ticketmaster API key is missing' });
    }

    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params: {
        keyword,
        classificationName: 'music',
        sort: 'date,asc',
        apikey: apiKey
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Ticketmaster Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch concerts' });
  }
});

// 2.5 SeatGeek Concerts
app.get('/api/seatgeek', async (req, res) => {
  try {
    const { keyword } = req.query;
    const clientId = process.env.SEATGEEK_CLIENT_ID;

    if (!clientId || clientId === 'YOUR_SEATGEEK_CLIENT_ID_HERE') {
      return res.status(503).json({ error: 'SeatGeek API key is missing' });
    }

    const response = await axios.get('https://api.seatgeek.com/2/events', {
      params: {
        q: keyword,
        type: 'concert',
        client_id: clientId,
        sort: 'datetime_utc.asc'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('SeatGeek Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch from SeatGeek' });
  }
});


// 2.7 Scraped Concerts (Hybrid: Biletix, StubHub vs)
app.get('/api/scrape-concerts', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required for scraping' });
    }
    
    console.log(`[Scraper] Starting scrape for: ${keyword}`);
    const scrapedEvents = await scrapeConcertsHybrid(keyword);
    console.log(`[Scraper] Found ${scrapedEvents.length} events for ${keyword}`);
    
    res.json({ events: scrapedEvents });
  } catch (error) {
    console.error('Scraping Error:', error.message);
    res.status(500).json({ error: 'Failed to scrape concerts' });
  }
});


// 3. Amadeus Flights
app.get('/api/flights', async (req, res) => {
  try {
    const { originCode, destCode, date, returnDate } = req.query;
    const duffelFlights = await searchDuffelFlights({ originCode, destCode, date, returnDate });
    if (duffelFlights) {
      return res.json({ provider: 'duffel', data: duffelFlights });
    }

    const clientId = process.env.AMADEUS_CLIENT_ID;

    if (!clientId || clientId === 'YOUR_AMADEUS_CLIENT_ID_HERE') {
      return res.status(503).json({ error: 'Amadeus API key is missing' });
    }

    const token = await getAmadeusToken();
    const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: originCode,
        destinationLocationCode: destCode,
        departureDate: date,
        ...(returnDate ? { returnDate } : {}),
        adults: 1,
        max: 10
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Amadeus Flight Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

// 4. Amadeus Hotels
app.get('/api/hotels', async (req, res) => {
  try {
    const { cityCode } = req.query;
    const clientId = process.env.AMADEUS_CLIENT_ID;

    if (!clientId || clientId === 'YOUR_AMADEUS_CLIENT_ID_HERE') {
      return res.status(503).json({ error: 'Amadeus API key is missing' });
    }

    const token = await getAmadeusToken();
    const response = await axios.get('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        cityCode: cityCode,
        radius: 5,
        radiusUnit: 'KM'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Amadeus Hotel Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// For any other route, send index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

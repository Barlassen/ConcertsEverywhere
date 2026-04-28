require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

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

// --- API Endpoints ---

// 1. Exchange Rates
app.get('/api/rates', async (req, res) => {
  try {
    const base = req.query.base || 'USD';
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_EXCHANGERATE_API_KEY_HERE') {
      return res.status(503).json({ error: 'ExchangeRate API key is missing' });
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


// 3. Amadeus Flights
app.get('/api/flights', async (req, res) => {
  try {
    const { originCode, destCode, date, returnDate } = req.query;
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

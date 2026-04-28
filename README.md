# ConcertsEverywhere / ConcertJet

ConcertJet helps compare concert trips by combining real concert data with flight, hotel, and exchange-rate providers.

The project intentionally does not generate mock prices. If a provider key is missing or a provider cannot return live data, the app shows an empty/error state instead of inventing concerts, flights, hotels, exchange rates, or prices.

## Requirements

- Node.js 18+
- npm
- API keys for the providers you want to use

## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env` with your own keys:

```bash
TICKETMASTER_API_KEY=...
SEATGEEK_CLIENT_ID=...
AMADEUS_CLIENT_ID=...
AMADEUS_CLIENT_SECRET=...
EXCHANGERATE_API_KEY=...
```

## Run

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

If `PORT` is set in `.env`, use that port instead.

## Validation

```bash
npm run check
```

Optional live API smoke tests:

```bash
npm run test:api
npm run test:prices
```

These tests require valid provider credentials in `.env`.

## Current Provider Behavior

- Ticketmaster is used for real concert search.
- SeatGeek support is wired, but requires a valid `SEATGEEK_CLIENT_ID`.
- Amadeus flight search is wired through the test API and only returns usable results when valid credentials and provider coverage exist.
- The current Amadeus hotel-by-city endpoint returns hotel metadata, not live accommodation prices, so the UI does not invent hotel prices.
- ExchangeRate API is required for currency conversion. Missing exchange-rate data is treated as an error, not mocked.

## Important

Do not commit `.env`, API keys, or `node_modules/`. They are ignored by `.gitignore`.

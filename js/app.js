// ─── MAIN APP ORCHESTRATOR v2 ──────────────────────────────────────────────────
window._appState = {
  concerts: [],
  flights: [],
  hotelsData: { budget:[], mid:[], luxury:[], all:[] },
  selectedConcert: null,
  userCurrency: 'TRY',
  userCity: '',
};

// Setup autocomplete
setupAutocomplete(
  'artist-input', 'artist-dropdown',
  POPULAR_ARTISTS,
  d => d.name,
  d => d.emoji,
  null
);

setupAutocomplete(
  'city-input', 'city-dropdown',
  POPULAR_CITIES,
  d => d.name,
  d => d.flag,
  null
);

document.getElementById('currency-select').addEventListener('change', e => {
  window._appState.userCurrency = e.target.value;
  if (window._appState.concerts.length) {
    const cur = window._appState.userCurrency;
    renderConcerts(window._appState.concerts, cur, window._appState.selectedConcert?.id);
    renderFlights(window._appState.flights, cur);
    renderPriceCalendar(FlightService.buildPriceCalendar(window._appState.flights), cur);
    
    if (window._appState.selectedConcert) {
      renderHotels(window._appState.hotelsData, cur, window._appState.selectedConcert);
      const bf = window._appState.flights.filter(f=>f.arrivesInTime).sort((a,b)=>a.priceUSD-b.priceUSD)[0];
      const bh = window._appState.hotelsData.mid[0] || window._appState.hotelsData.budget[0];
      PackageService.render(window._appState.selectedConcert, bf, bh, window._appState.flights, cur);
      PackageService.renderComparisonTable(window._appState.concerts, window._appState.flights, window._appState.hotelsData, cur);
    }
  }
});

// Concert filter
document.getElementById('concert-filter').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = window._appState.concerts.filter(c =>
    c.city.toLowerCase().includes(q) || c.venue.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );
  renderConcerts(filtered, window._appState.userCurrency, window._appState.selectedConcert?.id);
});

// Concert sort
document.getElementById('concert-sort').addEventListener('change', e => {
  const sorted = [...window._appState.concerts].sort((a, b) => {
    if (e.target.value === 'date') return a.date - b.date;
    if (e.target.value === 'price') return a.ticketPriceUSD - b.ticketPriceUSD;
    return 0;
  });
  renderConcerts(sorted, window._appState.userCurrency, window._appState.selectedConcert?.id);
});

// Flight sort
document.getElementById('flight-sort').addEventListener('change', e => {
  const sorted = [...window._appState.flights].sort((a, b) => {
    if (e.target.value === 'price') return a.priceUSD - b.priceUSD;
    if (e.target.value === 'duration') return a.durationMins - b.durationMins;
    if (e.target.value === 'stops') return a.stops - b.stops;
    return 0;
  });
  renderFlights(sorted, window._appState.userCurrency);
});

// ── Main Search
document.getElementById('search-btn').addEventListener('click', async () => {
  const artist = document.getElementById('artist-input').value.trim();
  const city = document.getElementById('city-input').value.trim();
  const currency = document.getElementById('currency-select').value;

  if (!artist) { showToast('Lütfen bir sanatçı girin', 'error'); return; }
  if (!city) { showToast('Lütfen kalkış şehrinizi girin', 'error'); return; }

  window._appState.userCurrency = currency;
  window._appState.userCity = city;

  showLoading(true);
  setLoadingStep(1, 10);

  try {
    // Step 1: Fetch concerts (Ticketmaster logic)
    await CurrencyService.fetchRates('USD');
    const concerts = await ConcertService.fetchConcerts(artist);
    window._appState.concerts = concerts;
    setLoadingStep(2, 35);

    // Step 2: Fetch flights for first concert (Skyscanner logic)
    const firstConcert = concerts[0];
    let flights = [];
    if (firstConcert) {
      flights = await FlightService.fetchFlights(city, firstConcert, firstConcert.date, firstConcert.concertHour);
      window._appState.flights = flights;
      window._appState.selectedConcert = firstConcert;
    }
    setLoadingStep(3, 65);

    // Step 3: Fetch hotels (Booking.com 3-category logic)
    let hotelsData = { budget:[], mid:[], luxury:[], all:[] };
    if (firstConcert) {
      hotelsData = await HotelService.fetchHotels(firstConcert, firstConcert.date, 2);
      window._appState.hotelsData = hotelsData;
    }
    setLoadingStep(4, 90);

    await new Promise(r => setTimeout(r, 400));
    setLoadingStep(4, 100);
    await new Promise(r => setTimeout(r, 300));
    showLoading(false);

    // Render all
    const resultsEl = document.getElementById('results-section');
    resultsEl.style.display = '';
    document.getElementById('results-title').textContent = `"${artist}" Konser Sonuçları`;
    document.getElementById('results-sub').textContent = `${concerts.length} konser bulundu · ${flights.filter(f=>f.arrivesInTime).length} uygun uçuş · ${hotelsData.all.length} otel`;

    // Time filter info text
    const tfi = document.getElementById('time-filter-info');
    if(tfi && firstConcert) {
      tfi.innerHTML = `<i class="fa-solid fa-clock"></i> Sadece <b>${firstConcert.timeStr}</b> saatindeki konsere zamanında yetişen uçuşlar gösteriliyor`;
    }

    renderConcerts(concerts, currency, firstConcert?.id);
    renderFlights(flights, currency);
    renderPriceCalendar(FlightService.buildPriceCalendar(flights), currency);
    
    if (firstConcert && hotelsData.all.length) {
      renderHotels(hotelsData, currency, firstConcert);
    }

    // Best package components
    const bf = flights.filter(f => f.arrivesInTime).sort((a,b)=>a.priceUSD-b.priceUSD)[0];
    const bh = hotelsData.all[0]; 
    
    if (firstConcert) {
      PackageService.render(firstConcert, bf, bh, flights, currency);
      PackageService.renderComparisonTable(concerts, flights, hotelsData, currency);
      switchTab('package'); // Auto-switch to package tab!
    }

    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`${concerts.length} konser ve doğrudan satış linkleri bulundu! 🚀`, 'success');
  } catch (err) {
    showLoading(false);
    showToast('Bir hata oluştu.', 'error');
    console.error(err);
  }
});

// ── Select specific concert and fetch its flights/hotels
window.selectConcert = async function(id) {
  const concert = window._appState.concerts.find(c => c.id === id);
  if (!concert) return;

  window._appState.selectedConcert = concert;
  showToast(`${concert.city} için canlı fiyatlar çekiliyor...`, 'info');
  switchTab('package');

  const currency = window._appState.userCurrency;
  const city = window._appState.userCity;
  
  const tfi = document.getElementById('time-filter-info');
  if(tfi) tfi.innerHTML = `<i class="fa-solid fa-clock"></i> Sadece <b>${concert.timeStr}</b> saatindeki konsere zamanında yetişen uçuşlar gösteriliyor`;

  try {
    const flights = await FlightService.fetchFlights(city, concert, concert.date, concert.concertHour);
    window._appState.flights = flights;
    renderFlights(flights, currency);
    renderPriceCalendar(FlightService.buildPriceCalendar(flights), currency);

    const hotelsData = await HotelService.fetchHotels(concert, concert.date, 2);
    window._appState.hotelsData = hotelsData;
    renderHotels(hotelsData, currency, concert);

    const bf = flights.filter(f => f.arrivesInTime).sort((a,b)=>a.priceUSD-b.priceUSD)[0];
    const bh = hotelsData.all[0];
    
    PackageService.render(concert, bf, bh, flights, currency);
    PackageService.renderComparisonTable(window._appState.concerts, flights, hotelsData, currency);

    renderConcerts(window._appState.concerts, currency, id);
    showToast(`${concert.city}: Bilet, uçuş ve otel linkleri hazır ✅`, 'success');
  } catch (err) {
    showToast('Veri alınamadı.', 'error');
  }
};

// Enter key on search
document.getElementById('artist-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('search-btn').click();
});
document.getElementById('city-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('search-btn').click();
});

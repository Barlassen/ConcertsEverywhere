// scrapers/index.js
const { runPythonScraper } = require('./pythonBridge');

async function scrapeConcertsHybrid(artistName) {
  // Python tabanlı, Ollama (Yapay Zeka) destekli genel arama ve kazıma işlemini başlat
  const allScrapedEvents = await runPythonScraper(artistName);

  const formattedEvents = allScrapedEvents.map(event => {
    // Official vs Resale sınıflandırması (URL üzerinden)
    const urlLower = (event.url || '').toLowerCase();
    let officialProvider = null;
    let resaleProvider = null;

    if (urlLower.includes('biletix') || urlLower.includes('biletinial') || urlLower.includes('passo') || urlLower.includes('bubilet') || urlLower.includes('ticketmaster')) {
      officialProvider = urlLower.includes('biletix') ? 'Biletix' :
        urlLower.includes('biletinial') ? 'Biletinial' :
          urlLower.includes('passo') ? 'Passo' :
            urlLower.includes('bubilet') ? 'Bubilet' : 'Resmi Sağlayıcı';
    } else {
      resaleProvider = 'Alternatif Platform (İkinci El / Potansiyel)';
    }

    return {
      id: `ai-${Math.random().toString(36).substr(2, 9)}`,
      eventId: `ai-${Math.random().toString(36).substr(2, 9)}`,
      artist: artistName,
      city: event.city || 'Bilinmiyor',
      country: event.country || 'Bilinmiyor',
      venue: event.venue || 'Bilinmeyen Mekan',
      date: new Date(event.date),
      concertHour: 20,
      ticketPriceUSD: event.price || 0,
      officialProvider: officialProvider,
      officialUrl: officialProvider ? event.url : null,
      resaleProvider: resaleProvider,
      resaleUrl: resaleProvider ? event.url : null,
      isTribute: event.isTribute || false
    };
  });

  // NLP ile filtrelenmiş veriler (Python isTribute olarak döndü)
  const authenticEvents = formattedEvents.filter(e => !e.isTribute);

  return authenticEvents;
}

module.exports = { scrapeConcertsHybrid };

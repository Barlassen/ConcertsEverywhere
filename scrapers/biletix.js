// scrapers/biletix.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeBiletix(artistName) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Biletix arama sayfasına git
    const searchUrl = `https://www.biletix.com/search/TURKIYE/tr?q=${encodeURIComponent(artistName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Sayfa içeriğinden etkinlikleri çek (Biletix search result yapısı varsayımı)
    // Gerçekte DOM yapısına göre uyarlanması gerekir, şimdilik olası bir tablo/liste yapısı kullanıyoruz
    const events = await page.evaluate((artist) => {
      const results = [];
      const cards = document.querySelectorAll('.search-result-item, .event-card, .searchResultItem'); // Varsayılan Biletix selectorleri
      
      cards.forEach(card => {
        const title = card.querySelector('.event-title, h3')?.innerText || '';
        const venue = card.querySelector('.venue-name, .place')?.innerText || 'Bilinmeyen Mekan';
        const dateText = card.querySelector('.event-date, .date')?.innerText || '';
        const url = card.querySelector('a')?.href || '';
        
        // Fiyat veya açıklama genelde detayda olur ama ön yüzde varsa al
        const price = card.querySelector('.price')?.innerText || '0';
        
        if(title.toLowerCase().includes(artist.toLowerCase())) {
          results.push({
            title,
            venue,
            city: 'İstanbul', // Varsayılan olarak, sayfadan çekilebilir
            dateText,
            url,
            price
          });
        }
      });
      return results;
    }, artistName);

    // Eğer DOM'dan bir şey bulamazsak boş döner
    return events.map(e => {
        const dateObj = new Date(e.dateText || Date.now());
        if(isNaN(dateObj.getTime())) dateObj = new Date();
        return {
            id: `bltx-${Math.random().toString(36).substr(2, 9)}`,
            eventId: `bltx-${Math.random().toString(36).substr(2, 9)}`,
            artist: artistName,
            city: e.city,
            country: 'Turkey',
            venue: e.venue,
            lat: 41.0082, // İstanbul varsayılan
            lng: 28.9784,
            date: dateObj,
            concertHour: 21,
            ticketPriceUSD: 0, // Dönüşüm gerektirir
            officialProvider: 'Biletix (Yerel Resmi)',
            officialUrl: e.url || searchUrl,
            requiresVPN: false,
            resaleProvider: null,
            resaleUrl: null,
            description: e.title // NLP filtresi için
        };
    });

  } catch (error) {
    console.error('Biletix Scraping Error:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeBiletix };

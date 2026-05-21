// scrapers/stubhub.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeStubHub(artistName) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // StubHub arama sayfasına git
    const searchUrl = `https://www.stubhub.com/secure/search?q=${encodeURIComponent(artistName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const events = await page.evaluate((artist) => {
      const results = [];
      const cards = document.querySelectorAll('.EventItem, .search-result-item'); 
      
      cards.forEach(card => {
        const title = card.querySelector('.EventItemTitle, h3')?.innerText || '';
        const venue = card.querySelector('.EventItemVenue, .venue')?.innerText || 'Bilinmeyen Mekan';
        const dateText = card.querySelector('.EventItemDate, .date')?.innerText || '';
        const url = card.querySelector('a')?.href || '';
        const price = card.querySelector('.price')?.innerText || '0';
        
        if(title.toLowerCase().includes(artist.toLowerCase())) {
          results.push({
            title,
            venue,
            city: venue.split(',')[0] || 'Bilinmiyor', // Çok kaba bir parse
            dateText,
            url,
            price
          });
        }
      });
      return results;
    }, artistName);

    return events.map(e => {
        const dateObj = new Date(e.dateText || Date.now());
        return {
            id: `sh-${Math.random().toString(36).substr(2, 9)}`,
            eventId: `sh-${Math.random().toString(36).substr(2, 9)}`,
            artist: artistName,
            city: e.city,
            country: 'Global',
            venue: e.venue,
            lat: 0,
            lng: 0,
            date: dateObj,
            concertHour: 20,
            ticketPriceUSD: 0, 
            officialProvider: null,
            officialUrl: null,
            requiresVPN: false,
            resaleProvider: 'StubHub (İkinci El / Resale)', // Güvenli ikinci el, kullanıcı uyarılacak
            resaleUrl: e.url || searchUrl,
            description: e.title 
        };
    });

  } catch (error) {
    console.error('StubHub Scraping Error:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeStubHub };

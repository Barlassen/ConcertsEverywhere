// scrapers/stealthScraper.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function fetchRawTexts(artistName) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const rawData = [];
  
  const platforms = [
    { name: 'Biletix', url: `https://www.biletix.com/search/TURKIYE/tr?q=${encodeURIComponent(artistName)}` },
    { name: 'StubHub', url: `https://www.stubhub.com/secure/search?q=${encodeURIComponent(artistName)}` },
    { name: 'Bubilet', url: `https://www.bubilet.com.tr/arama?q=${encodeURIComponent(artistName)}` }
  ];
  
  try {
    const page = await browser.newPage();
    // Block images/css to speed up navigation
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    for (const platform of platforms) {
      try {
        await page.goto(platform.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
        
        // Find the first link that looks like an event link
        let eventUrl = null;
        let targetedText = null;
        try {
            const extraction = await page.evaluate((artist) => {
              const links = Array.from(document.querySelectorAll('a'));
              const searchTerms = [artist.toLowerCase()];
              if (artist.toLowerCase().includes('kanye west')) searchTerms.push('ye');
              
              let bestLink = null;
              let bestText = null;
              for (const a of links) {
                const text = a.innerText.toLowerCase();
                const href = a.href.toLowerCase();
                
                const isEventLink = href.includes('/event/') || href.includes('/etkinlik/') || href.includes('/etkinlik-detay/') || href.includes('/bilet/');
                const matchesArtist = text.includes(searchTerms[0]) || (searchTerms[1] && text.includes(searchTerms[1]));
                
                if (isEventLink && matchesArtist && href.includes('http')) {
                   bestLink = a.href;
                   // Go up a few parents to get the block text
                   let parent = a.parentElement;
                   for(let i=0; i<3; i++) { if(parent && parent.parentElement) parent = parent.parentElement; }
                   bestText = parent ? parent.innerText : a.innerText;
                   break;
                }
              }
              return { url: bestLink, text: bestText };
            }, artistName);
            
            eventUrl = extraction.url;
            targetedText = extraction.text;
        } catch (e) {
            console.error("Failed to extract eventUrl", e.message);
        }

        let finalUrl = eventUrl || platform.url;
        
        // Wait on search page for rendering
        await new Promise(r => setTimeout(r, 2000));

        let text = targetedText;
        
        // If we couldn't target the specific text, fallback to body
        if (!text) {
          text = await page.evaluate(() => {
            return document.body ? document.body.innerText : '';
          }).catch(() => '');
          
          if (!text) {
            const html = await page.content().catch(() => '');
            text = html.replace(/<[^>]+>/g, ' ');
          }
          text = text.substring(0, 1500);
        }
        
        if (text && text.length > 10) {
          // Append the finalUrl so Ollama can extract dates from it if needed
          text += `\nEvent URL: ${finalUrl}`;
          rawData.push({ platform: platform.name, url: finalUrl, text: text });
        }
      } catch (err) {
        console.error(`Error fetching ${platform.name}:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }
  
  return rawData;
}

module.exports = { fetchRawTexts };

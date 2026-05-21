// scrapers/pythonBridge.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { fetchRawTexts } = require('./stealthScraper');

function getPythonCmd() {
  const absolutePath = 'C:\\Users\\Barlas\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  if (fs.existsSync(absolutePath)) {
    return `"${absolutePath}"`;
  }
  return 'python'; // Fallback to PATH
}

async function runPythonScraper(artistName) {
  try {
    // 1. Fetch raw HTML from protected sites using Puppeteer Stealth
    const rawData = await fetchRawTexts(artistName);
    
    // 2. Write to temp file
    const tempFile = path.join(__dirname, 'temp_scrape.json');
    fs.writeFileSync(tempFile, JSON.stringify(rawData));
    
    // 3. Call Python LLM parser
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'llm_scraper.py');
      const safeArtist = artistName.replace(/"/g, '\\"');
      
      const pyCmd = getPythonCmd();
      const cmd = `${pyCmd} "${scriptPath}" "${tempFile}" "${safeArtist}"`;
      
      exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        // Cleanup temp file
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        
        if (error) {
          console.error('Python Scraper Execution Error:', error);
          console.error('Stderr:', stderr);
          return resolve([]); 
        }
        
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          console.error('Python Scraper JSON Parse Error:', parseError);
          console.error('Raw Output:', stdout);
          resolve([]);
        }
      });
    });
  } catch (err) {
    console.error('Bridge error:', err);
    return [];
  }
}

module.exports = { runPythonScraper };

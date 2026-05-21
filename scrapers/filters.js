// scrapers/filters.js

function isFakeEvent(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  const badWords = [
    'tribute', 'cover', 'fan event', 'experience', 'night', 
    'candlelight', 'orchestra', 'symphony', 'philharmonic', 'symphonic',
    'party', 'club', 'impersonator', 'dj set', 'silent disco', 
    'laser', 'spectacular', 'project', 'tributes', 'hommage', 'celebration', 'bootleg'
  ];
  // Regex ile tam kelime eşleşmesi arıyoruz
  return badWords.some(word => new RegExp('\\b' + word + '\\b', 'i').test(name));
}

function isAuthenticArtist(searchedArtist, performerNames) {
  // Eğer performer listesi boşsa, isim ve info (diğer kısımlar) isFakeEvent testinden geçtiyse kabul edilebilir
  // ancak çok katı olmak istiyorsak reddedebiliriz. Biletix gibi sitelerde bazen performer açıkça ayrılmamış olabiliyor.
  if (!performerNames || performerNames.length === 0) return true; // Scraping için biraz esnetiyoruz, isim eşleşmesi yeterli olabilir
  
  const searchLower = searchedArtist.toLowerCase().trim();
  const normalizedSearch = searchLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

  return performerNames.some(name => {
     const nameLower = name.toLowerCase().trim();
     const normalizedName = nameLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
     
     if (nameLower === searchLower) return true;
     if (normalizedName === normalizedSearch) return true;
     
     if (nameLower.startsWith(searchLower) || normalizedName.startsWith(normalizedSearch)) {
         if (isFakeEvent(name)) return false;
         return true;
     }
     return false;
  });
}

module.exports = {
  isFakeEvent,
  isAuthenticArtist
};

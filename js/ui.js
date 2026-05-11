// ─── UI HELPERS v3 — Gidiş/Dönüş & En Ucuz Konaklama Uyumlu ──────────────────
let hotelMap = null;
let hotelMarkers = [];

function switchTab(tab) {
  ['concerts','flights','hotels','package'].forEach(t => {
    const el = document.getElementById(`${t}-tab`);
    if(el) el.style.display = t === tab ? '' : 'none';
    const btn = document.getElementById(`tab-${t}`);
    if(btn) btn.classList.toggle('active', t === tab);
  });
}

function showLoading(show) {
  const el = document.getElementById('loading-overlay');
  if(el) el.style.display = show ? 'grid' : 'none';
}

function setLoadingStep(step, percent) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`ls-${i}`);
    if(!el) continue;
    const icon = el.querySelector('i');
    if (i < step) {
      el.classList.remove('active'); el.classList.add('done');
      icon.className = 'fa-solid fa-check';
    } else if (i === step) {
      el.classList.add('active'); el.classList.remove('done');
      icon.className = 'fa-solid fa-circle-notch fa-spin';
    } else {
      el.classList.remove('active','done');
      icon.className = 'fa-solid fa-circle-notch';
    }
  }
  const bar = document.getElementById('loading-bar');
  if(bar) bar.style.width = `${percent}%`;
}

function showToast(msg, type = 'info') {
  const tc = document.getElementById('toast-container');
  if(!tc) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${msg}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── RENDER CONCERTS ──
function renderConcerts(concerts, userCurrency, selectedId) {
  const grid = document.getElementById('concerts-grid');
  if(!grid) return;
  if (!concerts.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-face-sad-tear"></i><p>Konser bulunamadı. (Tribute / Fan etkinlikleri elenmiş olabilir)</p></div>`;
    return;
  }
  grid.innerHTML = concerts.map(c => {
    const price = c.ticketPriceUSD > 0 
      ? CurrencyService.format(CurrencyService.convert(c.ticketPriceUSD, 'USD', userCurrency), userCurrency)
      : '<span style="font-size:0.8rem">Fiyat Belirtilmemiş</span>';
    const isSelected = c.id === selectedId;
    return `
    <div class="concert-card ${isSelected ? 'selected-card' : ''}" id="cc-${c.id}">
      <button class="card-fav-btn ${isFav(c.id) ? 'active' : ''}" onclick="toggleFav(event,'${c.id}')" id="fav-${c.id}">
        <i class="fa-${isFav(c.id) ? 'solid' : 'regular'} fa-heart"></i>
      </button>
      <div class="concert-card-img">${c.emoji}</div>
      <div class="concert-card-body">
        <span class="concert-badge ${c.domestic ? 'badge-domestic' : 'badge-international'}">
          <i class="fa-solid fa-${c.domestic ? 'house' : 'globe'}"></i>
          ${c.domestic ? 'Yurt İçi' : 'Yurt Dışı'}
        </span>
        <div class="concert-artist">${c.artist}</div>
        <div class="concert-venue"><i class="fa-solid fa-location-dot"></i>${c.venue}, ${c.city}</div>
        <div class="concert-meta">
          <span class="concert-date"><i class="fa-regular fa-calendar"></i> ${c.dateStr} ${c.timeStr}</span>
          <span class="concert-price">${price}</span>
        </div>
        <a href="${c.officialUrl}" target="_blank" class="concert-ticket-link">
          <i class="fa-solid fa-ticket"></i> Resmi Sağlayıcı (${c.officialProvider})
        </a>
        <a href="${c.resaleUrl}" target="_blank" class="concert-ticket-link" style="background:transparent;border-color:var(--text2);color:var(--text2);margin-top:.4rem">
          <i class="fa-solid fa-rotate"></i> İkinci El Seçenekleri
        </a>
        <button class="select-concert-btn" onclick="selectConcert('${c.id}')" style="margin-top:.8rem;background:var(--accent);color:#fff">
          <i class="fa-solid fa-plane"></i> Gidiş-Dönüş Paketi Oluştur
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── RENDER FLIGHTS (Round Trip) ──
function renderFlights(flights, userCurrency) {
  const grid = document.getElementById('flights-grid');
  if(!grid) return;

  const validFlights = flights.filter(f => f.arrivesInTime);
  const alertEl = document.getElementById('flight-time-alert');
  
  if(alertEl) {
    alertEl.innerHTML = `<i class="fa-solid fa-clock"></i> <b>T-4 Kuralı Aktif:</b> Sadece konsere en az 4 saat kala varış yapan uçuşlar gösterilmektedir. Dönüşler ise ertesi gündür.`;
    alertEl.style.display = 'flex';
  }

  if (!validFlights.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-plane-slash"></i><p>T-4 saat kuralına uyan gidiş-dönüş uçuş bulunamadı.</p></div>`;
    return;
  }
  
  grid.innerHTML = validFlights.slice(0, 12).map(f => {
    const price = CurrencyService.format(CurrencyService.convert(f.priceUSD, 'USD', userCurrency), userCurrency);
    return `
    <div class="flight-card ${f.isBestDeal ? 'best-deal' : ''}">
      <div class="flight-header">
        <div class="airline-info">
          <div class="airline-logo">${f.airlineLogo}</div>
          <div>
            <div class="airline-name">${f.airline}</div>
            <div class="airline-class">Gidiş-Dönüş</div>
          </div>
        </div>
        <div class="flight-price">
          ${f.isBestDeal ? '<span class="best-deal-badge">En Uygun</span><br/>' : ''}
          <div class="flight-price-main">${price}</div>
        </div>
      </div>
      
      <div style="font-size:.75rem;color:var(--text2);margin-top:.5rem">GİDİŞ: ${f.outbound.dateStr}</div>
      <div class="flight-route" style="margin-bottom:.3rem">
        <div class="route-city"><div class="code">${f.originCode}</div><div class="name">${f.outbound.depTime}</div></div>
        <div class="route-line"><div class="line"></div><div class="plane"><i class="fa-solid fa-plane"></i></div><div class="line"></div></div>
        <div class="route-city"><div class="code">${f.destCode}</div><div class="name">${f.outbound.arrTime}</div></div>
      </div>
      
      <div style="font-size:.75rem;color:var(--text2);margin-top:1rem">DÖNÜŞ: ${f.return.dateStr}</div>
      <div class="flight-route">
        <div class="route-city"><div class="code">${f.destCode}</div><div class="name">${f.return.depTime}</div></div>
        <div class="route-line"><div class="line"></div><div class="plane"><i class="fa-solid fa-plane fa-rotate-180"></i></div><div class="line"></div></div>
        <div class="route-city"><div class="code">${f.originCode}</div><div class="name">${f.return.arrTime}</div></div>
      </div>

      <div class="flight-card-footer">
        <span class="flight-arrives-badge">✓ Konsere En Az 4 Saat Kala</span>
      </div>
      <a href="${f.bookingUrl}" target="_blank" class="select-concert-btn" style="margin-top:.6rem;display:flex;align-items:center;justify-content:center;gap:.4rem;text-decoration:none;background:#00b8d9;color:#fff;border:none">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> Skyscanner'da Ara
      </a>
    </div>`;
  }).join('');
}

function renderPriceCalendar(calDays, userCurrency) {
  // Calendar not used in the new strict UI but keeping it safe
}

// ── RENDER HOTELS (En Ucuz 5 Seçenek) ──
function renderHotels(hotelData, userCurrency, concert) {
  const cont = document.getElementById('hotel-categories');
  if(!cont) return;

  const hotels = hotelData.all || [];

  if (!hotels.length) {
    cont.innerHTML = `
      <div class="empty-state" style="background: var(--card-bg); padding: 3rem; border-radius: 1.5rem; border: 1px dashed var(--border);">
        <i class="fa-solid fa-hotel" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;"></i>
        <h3>Yakın Konaklama Seçenekleri</h3>
        <p style="color: var(--text2); max-width: 400px; margin: 0.5rem auto 1.5rem;">
          <b>${hotelData.venue}</b> mekanı ve çevresi için en uygun konaklama seçeneklerini tarihlerinizle birlikte Booking.com'da hazırladık.
        </p>
        <a href="${hotelData.externalUrl}" target="_blank" class="select-concert-btn" style="background: #003580; color: #fff; padding: 1rem 2rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/be/Booking.com_logo.svg" alt="Booking" style="height: 1.2rem; filter: brightness(0) invert(1);">
          Seçenekleri Görüntüle
        </a>
      </div>`;
    return;
  }
}
// ── FAVORITES ──
function getFavs() { try { return JSON.parse(localStorage.getItem('concertjet_favs') || '[]'); } catch { return []; } }
function saveFavs(favs) { localStorage.setItem('concertjet_favs', JSON.stringify(favs)); }
function isFav(id) { return getFavs().some(f => f.id === id); }
function updateFavBadge() { 
  const el = document.getElementById('fav-badge');
  if(el) el.textContent = getFavs().length; 
}
function toggleFav(event, id) { /* ... */ }

window.openFavModal = function() { /* ... */ };
window.closeFavModal = function() { const el = document.getElementById('fav-modal'); if(el) el.style.display = 'none'; };

// ── AUTOCOMPLETE & STATS ANIMATION ──
window.setupAutocomplete = function(inputId, dropdownId, data, getName, getIcon, onSelect) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const val = input.value.toLowerCase().trim();
    if (!val) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('open');
      return;
    }

    const matches = data.filter(d => getName(d).toLowerCase().includes(val)).slice(0, 5);
    
    if (matches.length === 0) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('open');
      return;
    }

    dropdown.innerHTML = matches.map((m, index) => `
      <div class="autocomplete-item" data-index="${index}">
        ${getIcon ? `<span class="item-icon">${getIcon(m)}</span>` : ''}
        <span>${getName(m)}</span>
      </div>
    `).join('');
    
    dropdown.classList.add('open');

    dropdown.querySelectorAll('.autocomplete-item').forEach((item) => {
      item.addEventListener('click', () => {
        const match = matches[parseInt(item.getAttribute('data-index'))];
        input.value = getName(match);
        dropdown.innerHTML = '';
        dropdown.classList.remove('open');
        if (onSelect) onSelect(match);
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
};

function animateStats() {
  const stats = document.querySelectorAll('.stat-num');
  stats.forEach(stat => {
    const target = parseInt(stat.getAttribute('data-target'));
    const duration = 2000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        stat.textContent = target.toLocaleString('tr-TR');
        clearInterval(timer);
      } else {
        stat.textContent = Math.floor(current).toLocaleString('tr-TR');
      }
    }, stepTime);
  });
}

document.addEventListener('DOMContentLoaded', animateStats);

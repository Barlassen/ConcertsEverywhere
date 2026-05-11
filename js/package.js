// ─── PACKAGE PAGE RENDERER v3 — Çift Link & Gidiş-Dönüş ────────────────────
const PackageService = {
  render(concert, bestFlight, hotelsData, allFlights, currency) {
    const bestHotel   = hotelsData?.all?.[0];
    const ticketCost  = CurrencyService.convert(concert.ticketPriceUSD, 'USD', currency);
    const flightCost  = CurrencyService.convert(bestFlight?.priceUSD || 0, 'USD', currency);
    const hotelCost   = CurrencyService.convert(bestHotel?.totalUSD || 0, 'USD', currency);
    const total       = ticketCost + flightCost + hotelCost;
    const now         = new Date().toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });

    const validFlights = allFlights.filter(f => f.arrivesInTime);

    // ... (rest of the variables) ...
    const ticketButtons = `
      <a href="${concert.officialUrl}" target="_blank" class="book-btn book-btn-ticket" style="margin-bottom:.5rem;width:100%;justify-content:center">
        <i class="fa-solid fa-check-circle"></i> Resmi Satıcıdan Al (${concert.officialProvider})
      </a>
      ${concert.requiresVPN ? `<div style="font-size:.65rem;color:var(--yellow);text-align:center;margin-bottom:.5rem"><i class="fa-solid fa-triangle-exclamation"></i> Türkiye'den erişimde VPN gerekebilir</div>` : ''}
      <a href="${concert.resaleUrl}" target="_blank" class="book-btn" style="width:100%;justify-content:center;background:rgba(255,255,255,.1);color:var(--text)">
        <i class="fa-solid fa-rotate"></i> Alternatif / İkinci El (${concert.resaleProvider})
      </a>
    `;

    document.getElementById('package-content').innerHTML = `
    <div class="package-page">
      <div class="package-hero">
        <div class="package-hero-top">
          <div>
            <div class="hero-badge" style="margin-bottom:.7rem">
              <i class="fa-solid fa-suitcase-rolling"></i> Satın Alınabilir Seyahat Paketi
            </div>
            <div class="package-concert-title">${concert.emoji} ${concert.artist} — ${concert.city}</div>
            <div class="package-concert-sub">
              <i class="fa-solid fa-location-dot"></i> ${concert.venue} &nbsp;·&nbsp;
              <i class="fa-regular fa-calendar"></i> ${concert.dateStr} ${concert.timeStr}
            </div>
          </div>
          <div class="package-total">
            <div class="package-total-label">Toplam Tahmini Maliyet ${concert.ticketPriceUSD === 0 ? '<br><span style="font-size:0.65rem;color:var(--yellow)">(Konser Bileti Hariç)</span>' : ''}</div>
            <div class="package-total-price">${CurrencyService.format(total, currency)}</div>
            <div style="font-size:.7rem;color:var(--text2);margin-top:.3rem">Son Güncelleme: ${now}</div>
          </div>
        </div>
      </div>

      <div class="package-grid">
        <!-- TICKET CARD -->
        <div class="pkg-card">
          <div class="pkg-card-header">
            <span class="icon-ticket" style="width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:.9rem">🎟️</span>
            Konser Bileti
          </div>
          <div class="pkg-detail-row"><span class="pkg-detail-label">Sanatçı</span><span class="pkg-detail-value">${concert.artist}</span></div>
          <div class="pkg-detail-row"><span class="pkg-detail-label">Tarih</span><span class="pkg-detail-value">${concert.dateStr} ${concert.timeStr}</span></div>
          <div class="pkg-price-big">${concert.ticketPriceUSD > 0 ? CurrencyService.format(ticketCost, currency) : '<span style="font-size:1.2rem;color:var(--text2)">Belirtilmemiş</span>'}</div>
          <div style="margin-top:1rem;">${ticketButtons}</div>
        </div>

        <!-- FLIGHT CARD -->
        <div class="pkg-card">
          <div class="pkg-card-header">
            <span style="width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:.9rem;background:rgba(0,184,217,.2)">✈️</span>
            Gidiş-Dönüş Uçuş
          </div>
          ${bestFlight ? `
          <div style="background:var(--bg3);padding:.6rem;border-radius:var(--radius-sm);margin-bottom:.5rem">
            <div style="font-size:.75rem;color:var(--text2);margin-bottom:.3rem">GİDİŞ (${bestFlight.outbound.dateStr})</div>
            <div class="pkg-detail-row"><span class="pkg-detail-label">${bestFlight.originCode} → ${bestFlight.destCode}</span><span class="pkg-detail-value">${bestFlight.outbound.depTime} - ${bestFlight.outbound.arrTime}</span></div>
          </div>
          <div style="background:var(--bg3);padding:.6rem;border-radius:var(--radius-sm)">
            <div style="font-size:.75rem;color:var(--text2);margin-bottom:.3rem">DÖNÜŞ (${bestFlight.return.dateStr})</div>
            <div class="pkg-detail-row"><span class="pkg-detail-label">${bestFlight.destCode} → ${bestFlight.originCode}</span><span class="pkg-detail-value">${bestFlight.return.depTime} - ${bestFlight.return.arrTime}</span></div>
          </div>
          <div class="pkg-price-big" style="margin-top:.8rem">${CurrencyService.format(flightCost, currency)}</div>
          <a href="${bestFlight.bookingUrl}" target="_blank" class="book-btn book-btn-skyscanner" style="margin-top:.8rem;width:100%;justify-content:center">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Skyscanner'da Satın Al
          </a>
          ` : '<p style="color:var(--text2);font-size:.85rem">Uçuş bulunamadı.</p>'}
        </div>

        <!-- ACCOMMODATION CARD -->
        <div class="pkg-card">
          <div class="pkg-card-header">
            <span style="width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:.9rem;background:rgba(255,215,64,.2)">🛏️</span>
            Konaklama Seçenekleri
          </div>
          ${bestHotel ? `
          <div class="pkg-detail-row"><span class="pkg-detail-label">Tesis</span><span class="pkg-detail-value">${bestHotel.name}</span></div>
          <div class="pkg-price-big">${CurrencyService.format(hotelCost, currency)}</div>
          <a href="${bestHotel.bookingUrl}" target="_blank" class="book-btn book-btn-booking" style="margin-top:.8rem;width:100%;justify-content:center">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Rezervasyon Yap
          </a>
          ` : `
          <p style="color:var(--text2);font-size:.85rem;margin-bottom:1rem">Canlı otel fiyatları şu an çekilemiyor ancak size en uygun seçenekleri Booking.com'da hazırladık.</p>
          <a href="${hotelsData.externalUrl}" target="_blank" class="book-btn book-btn-booking" style="width:100%;justify-content:center;background:#003580">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Booking.com'da Gör
          </a>
          `}
        </div>
      </div>
    </div>`;
  },

  renderComparisonTable() {
    // Kullanılmayacaksa boş bırakabiliriz
    const el = document.getElementById('pkg-comparison-table');
    if (el) el.innerHTML = ''; 
  }
};

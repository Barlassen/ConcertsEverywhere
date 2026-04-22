// ─── CURRENCY SERVICE ─────────────────────────────────────────────────────────
const CurrencyService = (() => {
  let rates = {};
  let baseCurrency = 'USD';

  const SYMBOLS = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };

  async function fetchRates(base = 'USD') {
    if (CONFIG.DEMO_MODE) {
      // Mock rates relative to USD
      rates = { USD: 1, EUR: 0.92, GBP: 0.79, TRY: 32.5 };
      baseCurrency = base;
      return rates;
    }
    try {
      const r = await fetch(`${CONFIG.EXCHANGERATE_BASE}/${CONFIG.EXCHANGERATE_KEY}/latest/${base}`);
      const d = await r.json();
      if (d.result === 'success') { rates = d.conversion_rates; baseCurrency = base; }
    } catch (e) {
      rates = { USD: 1, EUR: 0.92, GBP: 0.79, TRY: 32.5 };
    }
    return rates;
  }

  function convert(amount, fromCurrency, toCurrency) {
    if (!amount || isNaN(amount)) return 0;
    if (fromCurrency === toCurrency) return amount;
    const usd = fromCurrency === 'USD' ? amount : amount / (rates[fromCurrency] || 1);
    return toCurrency === 'USD' ? usd : usd * (rates[toCurrency] || 1);
  }

  function format(amount, currency) {
    const sym = SYMBOLS[currency] || currency + ' ';
    const val = Math.round(amount).toLocaleString('tr-TR');
    return `${sym}${val}`;
  }

  function getSymbol(currency) { return SYMBOLS[currency] || currency; }

  return { fetchRates, convert, format, getSymbol, getRates: () => rates };
})();

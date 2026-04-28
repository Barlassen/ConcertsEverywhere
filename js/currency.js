// ─── CURRENCY SERVICE ─────────────────────────────────────────────────────────
const CurrencyService = (() => {
  let rates = {};
  let baseCurrency = 'USD';

  const SYMBOLS = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };

  async function fetchRates(base = 'USD') {
    try {
      const r = await fetch(`/api/rates?base=${base}`);
      if (!r.ok) throw new Error(`Rates API failed with ${r.status}`);
      const d = await r.json();
      if (d.result === 'success') { 
        rates = d.conversion_rates; 
        baseCurrency = base; 
        return rates;
      }
    } catch (e) {
      console.error('Fetch rates error:', e);
      throw e;
    }
    throw new Error('Rates API returned an invalid response');
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

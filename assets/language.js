(() => {
  'use strict';
  const supported = Object.freeze(['de', 'en', 'es', 'fr', 'it', 'pt-PT', 'pt-BR', 'th']);

  function browserLanguage(value) {
    if (typeof value !== 'string') return null;
    const parts = value.toLowerCase().split('-');
    if (parts[0] === 'pt') return parts.includes('br') ? 'pt-BR' : 'pt-PT';
    return supported.includes(parts[0]) ? parts[0] : null;
  }

  function resolve({ queryLanguage, storedLanguage, browserLanguages = [] } = {}) {
    if (supported.includes(queryLanguage)) return queryLanguage;
    if (supported.includes(storedLanguage)) return storedLanguage;
    for (const preference of browserLanguages) {
      const match = browserLanguage(preference);
      if (match) return match;
    }
    return 'de';
  }

  function initial() {
    let storedLanguage;
    try { storedLanguage = localStorage.getItem('lang'); } catch (_) { /* Storage is optional. */ }
    const browserLanguages = window.navigator.languages?.length
      ? window.navigator.languages
      : [window.navigator.language];
    return resolve({
      queryLanguage: new URLSearchParams(window.location.search).get('lang'),
      storedLanguage,
      browserLanguages
    });
  }

  window.SITE_LANGUAGE = Object.freeze({ supported, resolve, initial });
})();

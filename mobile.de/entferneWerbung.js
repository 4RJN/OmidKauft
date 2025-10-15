(() => {
  console.info("▶ mobile.de AdCleaner gestartet...");

  // Stichworte & Selektoren
  const BADGE_SELECTORS = [
    '[data-testid="sponsored-badge"]', // "Gesponsert"
    '.KwtUA.fpviJ.xGZ_B',              // "Top"-Badge
  ];
  const AD_SELECTORS = [
    'iframe[src*="googlesyndication"]',
    'iframe[src*="doubleclick"]',
    'iframe[id*="google_ads"]',
    '[id^="google_ads"]',
    '.ad-container',
    '.advertisement',
    'div[class*="adbanner"]',
    'div[class*="bannerAd"]',
  ];

  // Hilfsfunktion: nächsthöheren Anzeigencontainer finden
  function findListingContainer(el) {
    let p = el;
    for (let i = 0; i < 12 && p; i++) {
      const hasTitle = p.querySelector?.('h2[id^="result-listing-"]');
      const hasSeller = p.querySelector?.('[data-testid="seller-info"]');
      if (hasTitle && hasSeller) return p;
      p = p.parentElement;
    }
    return el;
  }

  // Werbeelemente ausblenden
  function hideAds(root = document) {
    // mobile.de "Gesponsert"/"Top"
    root.querySelectorAll(BADGE_SELECTORS.join(',')).forEach(b => {
      const txt = (b.textContent || '').trim().toLowerCase();
      if (txt.includes('top') || txt.includes('gesponsert')) {
        const card = findListingContainer(b);
        if (card && !card.dataset.hiddenByAdCleaner) {
          card.style.setProperty('display', 'none', 'important');
          card.dataset.hiddenByAdCleaner = 'true';
        }
      }
    });

    // Google-Ads, Banner usw.
    root.querySelectorAll(AD_SELECTORS.join(',')).forEach(el => {
      if (!el.dataset.hiddenByAdCleaner) {
        el.style.setProperty('display', 'none', 'important');
        el.dataset.hiddenByAdCleaner = 'true';
      }
    });
  }

  // Sofort ausführen
  hideAds();

  // Beobachte DOM auf Nachladen / Infinite Scroll
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.addedNodes?.length) hideAds(m.target.nodeType === 1 ? m.target : document);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Optional: Style-Regel für Ad-Klassen (Flicker verhindern)
  const css = document.createElement('style');
  css.textContent = `
    [data-testid="sponsored-badge"],
    .KwtUA.fpviJ.xGZ_B,
    iframe[src*="googlesyndication"],
    iframe[src*="doubleclick"],
    [id^="google_ads"],
    .ad-container,
    .advertisement,
    [class*="adbanner"],
    [class*="bannerAd"] {
      display: none !important;
      visibility: hidden !important;
    }`;
  document.head.appendChild(css);

  console.info("✅ mobile.de Werbung & Sponsored Cards werden nun automatisch ausgeblendet.");
})();

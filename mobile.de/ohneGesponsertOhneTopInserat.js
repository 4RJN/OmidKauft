(() => {
  // Erkennungsmerkmale aus deinem HTML
  const BADGE_SELECTORS = [
    '[data-testid="sponsored-badge"]',   // "Gesponsert"
    '.KwtUA.fpviJ.xGZ_B'                 // "Top"-Badge
  ];

  // Finde die umschließende Card des Listings
  function findListingContainer(el) {
    // Priorität: Container, der sowohl Details als auch Verkäuferinfo enthält
    let p = el;
    for (let i = 0; i < 12 && p; i++) {
      const hasDetails = p.querySelector?.('[data-testid="listing-details"]');
      const hasSeller  = p.querySelector?.('[data-testid="seller-info"]');
      const hasH2Id    = p.querySelector?.('h2[id^="result-listing-"]');
      if ((hasDetails && hasSeller) || hasH2Id) return p;
      p = p.parentElement;
    }
    // Fallback: ein paar Ebenen hoch
    p = el;
    for (let i = 0; i < 6 && p?.parentElement; i++) p = p.parentElement;
    return p || el;
  }

  function hideBadges(root = document) {
    const badges = root.querySelectorAll(BADGE_SELECTORS.join(','));
    badges.forEach(b => {
      // "Top" Badge wirklich nur wenn Text passt
      if (b.matches('.KwtUA.fpviJ.xGZ_B') && !/^\s*top\s*$/i.test(b.textContent || '')) return;
      const card = findListingContainer(b);
      if (card && card.style.display !== 'none') {
        card.style.setProperty('display', 'none', 'important');
        card.setAttribute('data-hidden-by', 'mobilede-hide-sponsored');
      }
    });
  }

  // Initial + bei dynamischem Nachladen
  hideBadges();
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.addedNodes?.length) hideBadges(m.target.nodeType === 1 ? m.target : document);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  console.info('mobile.de: Sponsored/TOP werden ausgeblendet.');
})();

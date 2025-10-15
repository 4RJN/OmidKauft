(() => {
  // ======= Utils =======
  const norm = s => (s||'').replace(/\s+/g,' ').trim();
  const asNumber = s => Number((s||'').replace(/\./g,'').replace(',', '.').replace(/[^\d.-]/g,''));
  const parseEuroPrice = s => {
    if (!s) return {raw:'', num:NaN};
    const raw = norm(s);
    const cleaned = raw.replace(/\u00A0/g,' ').replace(/[^\d.,-]/g,'').replace(/\./g,'').replace(',', '.');
    const num = parseFloat(cleaned);
    return { raw, num: Number.isFinite(num) ? num : NaN };
  };

  function parseAttrs(text) {
    const t = norm(text || '');
    const kmMatch = t.match(/([\d\.]+)\s*km/i);
    const km = kmMatch ? asNumber(kmMatch[1]) : null;
    let baujahr = null;
    const ezMatch = t.match(/EZ\s+(\d{2})\/(\d{4})/i) || t.match(/EZ\s+(\d{4})/i);
    if (ezMatch) baujahr = ezMatch.length === 3 ? parseInt(ezMatch[2],10) : parseInt(ezMatch[1],10);
    const unfallfrei = /(^|[\s•])unfallfrei([\s•]|$)/i.test(t);
    return { km, baujahr, unfallfrei, raw: t };
  }

  function findCardFromTitleH2(h2) {
    let p = h2;
    for (let i = 0; i < 14 && p; i++) {
      const hasDetails = p.querySelector?.('[data-testid="listing-details"]');
      const hasSeller  = p.querySelector?.('[data-testid="seller-info"]');
      if (hasDetails && hasSeller) return p;
      p = p.parentElement;
    }
    p = h2; for (let i = 0; i < 6 && p?.parentElement; i++) p = p.parentElement;
    return p || h2;
  }
  function detectSellerType(card) {
    const sellerRoot = card.querySelector('[data-testid="seller-info"]');
    const txt = norm(sellerRoot?.textContent || '');
    if (/privat|privatanbieter/i.test(txt)) return 'Privat';
    if (sellerRoot?.querySelector('img[alt], svg') || /\b(GmbH|AG|KG|OHG|e\.K\.)\b/i.test(txt)) return 'Händler';
    return 'Händler';
  }
  function extractPLZ(card) {
    const sellerRoot = card.querySelector('[data-testid="seller-info"]') || card;
    const m = (sellerRoot.textContent || '').match(/\b\d{5}\b/);
    return m ? m[0] : '';
  }
  function extractLink(card, h2) {
    const a1 = h2?.closest('a');
    const a2 = card.querySelector('a[href*="details.html?id="], a[href*="/fahrzeuge/details"], a[href*="/angebote/"]');
    return a1?.href || a2?.href || '';
  }

  // ======= Parser für ein Document (aktuelle Seite ODER fetch-Ergebnis) =======
  function parseDocument(doc) {
    const cards = [];
    doc.querySelectorAll('h2[id^="result-listing-"]').forEach(h2 => {
      const card = findCardFromTitleH2(h2);
      if (card && !cards.includes(card)) cards.push(card);
    });

    const rows = cards.map(card => {
      const h2 = card.querySelector('h2[id^="result-listing-"]');
      const titleMain = h2?.querySelector('.eO87w')?.getAttribute('title') || h2?.querySelector('.eO87w')?.textContent || '';
      const titleSub  = h2?.querySelector('.dc_Br')?.getAttribute('title')  || h2?.querySelector('.dc_Br')?.textContent  || '';
      const title = norm([titleMain, titleSub].filter(Boolean).join(' '));

      const priceEl = card.querySelector('[data-testid="price-label"], [data-testid="main-price-label"] [data-testid="price-label"], .GYhxV[data-testid="price-label"]');
      const { raw: price_text, num: preis_eur } = parseEuroPrice(priceEl?.textContent || '');

      const attrsEl = card.querySelector('[data-testid="listing-details-attributes"] div');
      const { km, baujahr, unfallfrei } = parseAttrs(attrsEl?.textContent || '');

      const anbieter = detectSellerType(card);
      const plz = extractPLZ(card);
      const link = extractLink(card, h2);

      return {
        preis_text: price_text || '',
        preis_eur,
        baujahr: baujahr || '',
        kilometer: (km ?? '').toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.'),
        anbieter,
        unfallfrei: unfallfrei ? 'Ja' : '—',
        plz,
        titel: title,
        link
      };
    });
    // de-dupe
    const seen = new Set();
    return rows.filter(r => {
      const key = r.link || r.titel;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ======= UI Overlay (re-used wenn schon vorhanden) =======
  const ID = 'mobilede-extract-overlay';
  document.getElementById(ID)?.remove();

  const style = document.createElement('style');
  style.textContent = `
    #${ID}{position:fixed;inset:5% 5% auto 5%;max-height:80vh;z-index:2147483647;background:#111;color:#eee;border:1px solid #444;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.5);font:13px/1.4 system-ui,sans-serif;overflow:hidden}
    #${ID} header{display:flex;gap:8px;align-items:center;padding:10px 12px;background:#1b1b1b;border-bottom:1px solid #333}
    #${ID} header h3{margin:0;font-size:14px;font-weight:600}
    #${ID} header button,#${ID} header input{border:1px solid #444;background:#222;color:#eee;padding:6px 10px;border-radius:7px}
    #${ID} header input{width:5em;text-align:center}
    #${ID} header button{cursor:pointer}
    #${ID} header button:hover{background:#2a2a2a}
    #${ID} .body{overflow:auto;max-height:calc(80vh - 56px)}
    #${ID} table{width:100%;border-collapse:collapse}
    #${ID} thead th{position:sticky;top:0;background:#161616;border-bottom:1px solid #333;padding:8px;text-align:left;font-weight:600;cursor:pointer}
    #${ID} td{padding:8px;border-bottom:1px solid #2a2a2a;vertical-align:top}
    #${ID} a{color:#8ab4ff;text-decoration:underline}
    #${ID} .right{text-align:right;white-space:nowrap}
    #${ID} .nowrap{white-space:nowrap}
    #${ID} .muted{opacity:.8}
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = ID;
  wrap.innerHTML = `
    <header>
      <h3>mobile.de – extrahierte Inserate</h3>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <span class="muted">zusätzliche Seiten:</span>
        <input id="${ID}-pages" type="number" min="1" value="5" />
        <button id="${ID}-more">Weitere Seiten laden</button>
        <button id="${ID}-csv">CSV speichern</button>
        <button id="${ID}-copy">CSV kopieren</button>
        <button id="${ID}-close">Schließen</button>
      </div>
    </header>
    <div class="body">
      <table>
        <thead>
          <tr>
            <th data-k="preis_eur">Preis</th>
            <th data-k="baujahr">Baujahr</th>
            <th data-k="kilometer">Kilometer</th>
            <th data-k="anbieter">Privat/Händler</th>
            <th data-k="unfallfrei">Unfallfrei</th>
            <th data-k="plz">PLZ</th>
            <th data-k="titel">Titel</th>
            <th>Direktlink</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>`;
  document.body.appendChild(wrap);

  const tbody = wrap.querySelector('tbody');

  function renderRows(arr) {
    tbody.innerHTML = arr.map(r => `
      <tr>
        <td class="right nowrap">${r.preis_text||''}</td>
        <td class="right">${r.baujahr||''}</td>
        <td class="right nowrap">${r.kilometer ? (r.kilometer + ' km') : ''}</td>
        <td>${r.anbieter}</td>
        <td>${r.unfallfrei}</td>
        <td class="right">${r.plz||''}</td>
        <td>${r.titel ? r.titel.replace(/</g,'&lt;') : ''}</td>
        <td><a href="${r.link}" target="_blank" rel="noopener">Öffnen</a></td>
      </tr>
    `).join('');
  }

  // ======= Start: aktuelle Seite parsen =======
  const allData = parseDocument(document);
  renderRows(allData);

  // Sortier-Handler
  let sortKey = 'preis_eur', sortDir = 1;
  function sortData(k) {
    if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
    const arr = [...allData].sort((a,b) => {
      const av = (k === 'kilometer') ? asNumber(a[k]) : a[k];
      const bv = (k === 'kilometer') ? asNumber(b[k]) : b[k];
      const aNaN = (av===null || av==='' || Number.isNaN(av));
      const bNaN = (bv===null || bv==='' || Number.isNaN(bv));
      if (aNaN && bNaN) return 0;
      if (aNaN) return 1;
      if (bNaN) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv),'de',{numeric:true}) * sortDir;
    });
    renderRows(arr);
  }
  wrap.querySelectorAll('thead th[data-k]').forEach(th => th.addEventListener('click', () => sortData(th.getAttribute('data-k'))));

  function toCSV(arr) {
    const header = ['Preis','Baujahr','Kilometer','Privat/Händler','Unfallfrei','PLZ','Titel','Direktlink'];
    const rows = arr.map(r => [r.preis_text, r.baujahr, r.kilometer ? `${r.kilometer} km` : '', r.anbieter, r.unfallfrei, r.plz, r.titel, r.link]);
    return [header, ...rows].map(row => row.map(c => `"${(c??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
  }
  function downloadCSV(arr) {
    const csv = toCSV(arr);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `mobilede_inserate_${new Date().toISOString().replace(/[:.]/g,'-')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }
  wrap.querySelector(`#${ID}-csv`).onclick = () => downloadCSV(allData);
  wrap.querySelector(`#${ID}-copy`).onclick = () => { const csv = toCSV(allData); try { copy(csv); } catch { navigator.clipboard?.writeText(csv).catch(()=>{}); } };
  wrap.querySelector(`#${ID}-close`).onclick = () => { document.getElementById(ID)?.remove(); style.remove(); };

  // ======= Mehr Seiten laden per fetch (same-origin) =======
  function buildPageUrl(baseUrl, page) {
    const u = new URL(baseUrl);
    const keys = ['page','pageNumber']; // beiden Varianten unterstützen
    let had = false;
    for (const k of keys) if (u.searchParams.has(k)) { u.searchParams.set(k, String(page)); had = true; }
    if (!had) u.searchParams.set('pageNumber', String(page));
    return u.toString();
  }
  function getCurrentPage(url) {
    const u = new URL(url);
    return Number(u.searchParams.get('page') || u.searchParams.get('pageNumber') || '1') || 1;
  }

  async function fetchPageDoc(url) {
    const res = await fetch(url, {credentials:'same-origin'});
    const html = await res.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  async function loadMorePages() {
    const moreBtn = wrap.querySelector(`#${ID}-more`);
    const pagesInput = wrap.querySelector(`#${ID}-pages`);
    const addCount = Math.max(1, Number(pagesInput.value||'5'));
    const base = location.href;
    const startPage = getCurrentPage(base) + 1;

    moreBtn.disabled = true;
    moreBtn.textContent = `Lade ${addCount} Seiten...`;

    const delay = ms => new Promise(r => setTimeout(r, ms));

    const seen = new Set(allData.map(r => r.link || r.titel));
    for (let p = startPage; p < startPage + addCount; p++) {
      const url = buildPageUrl(base, p);
      try {
        const doc = await fetchPageDoc(url);
        const rows = parseDocument(doc);
        rows.forEach(r => {
          const key = r.link || r.titel;
          if (!seen.has(key)) { seen.add(key); allData.push(r); }
        });
        renderRows(allData);
        await delay(600 + Math.random()*400); // kleine Pause
      } catch (e) {
        console.warn('Seite konnte nicht geladen werden:', url, e);
      }
    }

    moreBtn.disabled = false;
    moreBtn.textContent = 'Weitere Seiten laden';
  }

  wrap.querySelector(`#${ID}-more`).onclick = loadMorePages;

  console.info('Bereit. Aktuelle Seite geparst. Zum Aggregieren auf „Weitere Seiten laden“ klicken.');
})();

(() => {
  // ====== Hilfsfunktionen ======
  const norm = s => (s||'').replace(/\s+/g,' ').trim();
  const asNumber = s => Number((s||'').replace(/\./g,'').replace(',', '.').replace(/[^\d.-]/g,''));
  const parseEuroPrice = s => {
    if (!s) return {raw:'', num:NaN};
    const raw = norm(s);
    const cleaned = raw.replace(/\u00A0/g,' ').replace(/[^\d.,-]/g,'').replace(/\./g,'').replace(',', '.');
    const num = parseFloat(cleaned);
    return { raw, num: Number.isFinite(num) ? num : NaN };
  };

  function findCardFromTitleH2(h2) {
    // vom H2 zur Kartenwurzel
    let p = h2;
    for (let i = 0; i < 14 && p; i++) {
      const hasDetails = p.querySelector?.('[data-testid="listing-details"]');
      const hasSeller  = p.querySelector?.('[data-testid="seller-info"]');
      if (hasDetails && hasSeller) return p;
      p = p.parentElement;
    }
    // Fallback: paar Ebenen hoch
    p = h2; for (let i = 0; i < 6 && p?.parentElement; i++) p = p.parentElement;
    return p || h2;
  }

  // Attribute zerlegen: "Unfallfrei • EZ 08/2023 • 30.000 km • 393 kW (534 PS) • Elektro"
  function parseAttrs(text) {
    const t = norm(text || '');
    const kmMatch = t.match(/([\d\.]+)\s*km/i);
    const km = kmMatch ? asNumber(kmMatch[1]) : null;

    // EZ: 08/2023 oder 2023
    let baujahr = null;
    const ezMatch = t.match(/EZ\s+(\d{2})\/(\d{4})/i) || t.match(/EZ\s+(\d{4})/i);
    if (ezMatch) {
      baujahr = ezMatch.length === 3 ? parseInt(ezMatch[2],10) : parseInt(ezMatch[1],10);
    }

    const unfallfrei = /(^|[\s•])unfallfrei([\s•]|$)/i.test(t);

    return { km, baujahr, unfallfrei, raw: t };
  }

  function detectSellerType(card) {
    const sellerRoot = card.querySelector('[data-testid="seller-info"]');
    const txt = norm(sellerRoot?.textContent || '');
    // Heuristiken
    if (/privat|privatanbieter/i.test(txt)) return 'Privat';
    // Sterne/Logo/Unternehmen → eher Händler
    if (sellerRoot?.querySelector('img[alt], svg') || /\bstern/i.test(txt) || /\bGmbH|AG|KG|OHG|e\.K\.\b/i.test(txt)) return 'Händler';
    // Fallback: wenn Firmenname-Stil vorhanden (z.B. Großbuchstaben + Rechtsform)
    return 'Händler';
  }

  function extractPLZ(card) {
    const sellerRoot = card.querySelector('[data-testid="seller-info"]') || card;
    const txt = sellerRoot.textContent || '';
    const m = txt.match(/\b\d{5}\b/);
    return m ? m[0] : '';
  }

  function extractLink(card, h2) {
    // bevorzugt den Titellink, ansonsten generische Links zur Detailseite
    const a1 = h2?.closest('a');
    const a2 = card.querySelector('a[href*="details.html?id="]') || card.querySelector('a[href*="/fahrzeuge/details"]') || card.querySelector('a[href*="/angebote/"]');
    return (a1?.href || a2?.href || '');
  }

  // ====== Daten einsammeln ======
  const cards = [];
  document.querySelectorAll('h2[id^="result-listing-"]').forEach(h2 => {
    const card = findCardFromTitleH2(h2);
    if (card && !cards.includes(card)) cards.push(card);
  });

  const rows = cards.map(card => {
    const h2 = card.querySelector('h2[id^="result-listing-"]');
    const titleMain = h2?.querySelector('.eO87w')?.getAttribute('title') || h2?.querySelector('.eO87w')?.textContent || '';
    const titleSub  = h2?.querySelector('.dc_Br')?.getAttribute('title')  || h2?.querySelector('.dc_Br')?.textContent  || '';
    const title = norm([titleMain, titleSub].filter(Boolean).join(' '));

    const priceEl = card.querySelector('[data-testid="price-label"], [data-testid="main-price-label"] [data-testid="price-label"], .GYhxV[data-testid="price-label"]');
    const { raw: priceRaw, num: priceNum } = parseEuroPrice(priceEl?.textContent || '');

    const attrsEl = card.querySelector('[data-testid="listing-details-attributes"] div');
    const { km, baujahr, unfallfrei } = parseAttrs(attrsEl?.textContent || '');

    const sellerType = detectSellerType(card);
    const plz = extractPLZ(card);
    const link = extractLink(card, h2);

    return {
      preis_text: priceRaw || '',
      preis_eur: priceNum,
      baujahr: baujahr || '',
      kilometer: (km ?? '').toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.'), // schön formatiert
      anbieter: sellerType,
      unfallfrei: unfallfrei ? 'Ja' : '—',
      plz,
      titel: title,
      link
    };
  });

  // Duplikate durch gleiche Links entfernen
  const seen = new Set();
  const data = rows.filter(r => {
    const key = r.link || r.titel;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ====== Overlay mit Tabelle rendern ======
  const ID = 'mobilede-extract-overlay';
  document.getElementById(ID)?.remove();

  const style = document.createElement('style');
  style.textContent = `
    #${ID} {
      position: fixed; inset: 5% 5% auto 5%; max-height: 80vh; z-index: 2147483647;
      background: #111; color: #eee; border: 1px solid #444; border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,.5); font: 13px/1.4 system-ui, sans-serif;
      overflow: hidden;
    }
    #${ID} header {
      display:flex; gap:8px; align-items:center; padding:10px 12px; background:#1b1b1b; border-bottom:1px solid #333;
    }
    #${ID} header h3 { margin:0; font-size:14px; font-weight:600; }
    #${ID} header button {
      border:1px solid #444; background:#222; color:#eee; padding:6px 10px; border-radius:7px; cursor:pointer;
    }
    #${ID} header button:hover { background:#2a2a2a; }
    #${ID} .body { overflow:auto; max-height: calc(80vh - 56px); }
    #${ID} table { width:100%; border-collapse: collapse; }
    #${ID} thead th {
      position: sticky; top: 0; background:#161616; border-bottom:1px solid #333;
      padding:8px; text-align:left; font-weight:600; cursor:pointer;
    }
    #${ID} td { padding:8px; border-bottom:1px solid #2a2a2a; vertical-align: top; }
    #${ID} a { color:#8ab4ff; text-decoration: underline; }
    #${ID} .right { text-align:right; white-space:nowrap; }
    #${ID} .nowrap { white-space:nowrap; }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = ID;
  wrap.innerHTML = `
    <header>
      <h3>mobile.de – extrahierte Inserate (${data.length})</h3>
      <div style="margin-left:auto; display:flex; gap:8px;">
        <button id="${ID}-rescan">Neu scannen</button>
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
        <td class="right nowrap">${r.preis_text || ''}</td>
        <td class="right">${r.baujahr || ''}</td>
        <td class="right nowrap">${r.kilometer ? (r.kilometer + ' km') : ''}</td>
        <td>${r.anbieter}</td>
        <td>${r.unfallfrei}</td>
        <td class="right">${r.plz || ''}</td>
        <td>${r.titel ? r.titel.replace(/</g,'&lt;') : ''}</td>
        <td><a href="${r.link}" target="_blank" rel="noopener">Öffnen</a></td>
      </tr>
    `).join('');
  }
  renderRows(data);

  // Sortier-Handler
  let sortKey = 'preis_eur', sortDir = 1;
  function sortData(k) {
    if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
    const arr = [...data].sort((a,b) => {
      const av = (k === 'kilometer') ? asNumber(a[k]) : a[k];
      const bv = (k === 'kilometer') ? asNumber(b[k]) : b[k];
      const aNaN = (av===null || av==='' || Number.isNaN(av));
      const bNaN = (bv===null || bv==='' || Number.isNaN(bv));
      if (aNaN && bNaN) return 0;
      if (aNaN) return 1;
      if (bNaN) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv), 'de', {numeric:true}) * sortDir;
    });
    renderRows(arr);
  }
  wrap.querySelectorAll('thead th[data-k]').forEach(th => {
    th.addEventListener('click', () => sortData(th.getAttribute('data-k')));
  });

  // CSV erzeugen
  function toCSV(arr) {
    const header = ['Preis','Baujahr','Kilometer','Privat/Händler','Unfallfrei','PLZ','Titel','Direktlink'];
    const rows = arr.map(r => [
      r.preis_text,
      r.baujahr,
      r.kilometer ? `${r.kilometer} km` : '',
      r.anbieter,
      r.unfallfrei,
      r.plz,
      r.titel,
      r.link
    ]);
    return [header, ...rows].map(row => row.map(c => `"${(c??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
  }

  function downloadCSV(arr) {
    const csv = toCSV(arr);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `mobilede_alle_inserate_${new Date().toISOString().replace(/[:.]/g,'-')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // Buttons
  wrap.querySelector(`#${ID}-csv`).onclick = () => downloadCSV(data);
  wrap.querySelector(`#${ID}-copy`).onclick = () => {
    const csv = toCSV(data);
    // DevTools copy() Fallback
    try { copy(csv); console.info('CSV mit copy() in Zwischenablage.'); }
    catch { navigator.clipboard?.writeText(csv).catch(()=>console.warn('Clipboard blockiert.')); }
  };
  wrap.querySelector(`#${ID}-rescan`).onclick = () => { document.getElementById(ID)?.remove(); setTimeout(()=>eval(`(${arguments.callee.caller?.toString()||''})()`),0); };
  wrap.querySelector(`#${ID}-close`).onclick = () => { document.getElementById(ID)?.remove(); style.remove(); };

  console.info('Tabelle eingeblendet. Spalten klickbar zum Sortieren. CSV über Buttons verfügbar.');
})();

/**
 * One-time extraction: cache Census English village names for Navsari + Surat
 * Output: census-english-cache.json
 *   { district: { taluka: [englishName, ...] } }
 */
const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('src/data/DH_2011_DCHB_Village_Release_2400.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

const TARGET_DISTRICTS = new Set(['Navsari', 'Surat']);

// Census taluka names (English) -> our English taluka names (with aliases)
const TALUKA_ALIASES = {
    Navsari: { Bansda: 'Vansda', Vansda: 'Vansda', Navsari: 'Navsari' },
    Surat: { Chorasi: 'Choryasi', Choryasi: 'Choryasi' },
};

const result = { Navsari: {}, Surat: {} };

for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 8) continue;
    const district = String(row[3] || '').trim();
    if (!TARGET_DISTRICTS.has(district)) continue;
    const taluka = String(row[5] || '').trim();
    const village = String(row[7] || '').trim();
    if (!taluka || !village) continue;

    // Apply alias mapping
    let engTaluka = taluka;
    if (TALUKA_ALIASES[district] && TALUKA_ALIASES[district][taluka]) {
        engTaluka = TALUKA_ALIASES[district][taluka];
    }

    if (!result[district][engTaluka]) result[district][engTaluka] = [];
    const list = result[district][engTaluka];
    if (!list.includes(village)) list.push(village);
}

// Sort each list
for (const d of Object.keys(result)) {
    for (const t of Object.keys(result[d])) {
        result[d][t].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }
}

fs.writeFileSync('census-english-cache.json', JSON.stringify(result, null, 2));
console.log('DONE - wrote census-english-cache.json');
console.log('Navsari:', Object.entries(result.Navsari).map(([t, v]) => `${t}=${v.length}`).join(', '));
console.log('Surat:', Object.entries(result.Surat).map(([t, v]) => `${t}=${v.length}`).join(', '));
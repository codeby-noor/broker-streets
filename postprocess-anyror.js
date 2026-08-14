/**
 * POST-PROCESS: Reconcile the built dataset against official AnyRoR.
 *
 * Fixes transliteration collisions that caused missing villages:
 *  - ગણદેવા (Gandeva) vs ગણદેવી (Gandevi)  → both mapped to "Gandeva"
 *  - છાપર (Gandevi) vs છાપરા (Navsari City) → both mapped to "Chhapar"
 *
 * For each AnyRoR village ensure it exists in the dataset with its correct
 * English name (prefer Census English name; else existing translation).
 */
const fs = require('fs');

const anyror = JSON.parse(fs.readFileSync('anyror-hierarchy.json', 'utf8'));
const d = JSON.parse(fs.readFileSync('src/data/gujarat-villages.json', 'utf8'));
const gen = JSON.parse(fs.readFileSync('src/data/generated-village-translations.json', 'utf8'));
const census = JSON.parse(fs.readFileSync('census-english-cache.json', 'utf8'));

const TALUKA_MAP = {
    'નવસારી': 'Navsari', 'જલાલપોર': 'Jalalpore', 'ગણદેવી': 'Gandevi', 'ચીખલી': 'Chikhli',
    'વાંસદા': 'Vansda', 'ખેરગામ': 'Khergam', 'નવસારી શહેર': 'Navsari City',
    'ઓલપાડ': 'Olpad', 'માંગરોલ': 'Mangrol', 'ઉમરપાડા': 'Umarpada', 'માંડવી': 'Mandvi',
    'કામરેજ': 'Kamrej', 'ચોરાસી': 'Choryasi', 'પલસાણા': 'Palsana', 'બારડોલી': 'Bardoli',
    'મહુવા': 'Mahuva', 'અડાજણ': 'Adajan', 'કતારગામ': 'Katargam', 'પુણા': 'Puna',
    'ઉધના': 'Udhna', 'મજુરા': 'Majura', 'અબ્રામા': 'Abrama', 'અરેઠ': 'Areth', 'અંબિકા': 'Ambika',
};

// Census English name per (district, guj taluka) - for new villages
// Use census taluka name -> our English taluka
const CENSUS_TALUKA_TO_ENG = {
    'Navsari': 'Navsari', 'Jalalpore': 'Jalalpore', 'Gandevi': 'Gandevi',
    'Chikhli': 'Chikhli', 'Vansda': 'Vansda', 'Bansda': 'Vansda',
    'Olpad': 'Olpad', 'Mangrol': 'Mangrol', 'Umarpada': 'Umarpada',
    'Mandvi': 'Mandvi', 'Kamrej': 'Kamrej', 'Choryasi': 'Choryasi',
    'Chorasi': 'Choryasi', 'Palsana': 'Palsana', 'Bardoli': 'Bardoli', 'Mahuva': 'Mahuva',
};

function stripCode(label) { return label.replace(/\s*-\s*\d+$/, '').trim(); }
const norm = (s) => String(s || '').replace(/઼/g, '').replace(/્/g, '').replace(/\s+/g, '').replace(/ૅ/g, 'ૈ').replace(/ં/g, '').trim();

// Build census english set for quick lookup
const censusEnglishInGujMap = new Map(); // normGujFromEnglish -> english (from translations)
for (const [dist, talukas] of Object.entries(census)) {
    for (const [taluka, villages] of Object.entries(talukas)) {
        for (const eng of villages) {
            const guj = gen[eng];
            if (guj) censusEnglishInGujMap.set(norm(guj), eng);
        }
    }
}

// Manual English names for known AnyRoR villages that collide or lack census match
const MANUAL_ENGLISH = {
    'ગણદેવી': 'Gandevi',       // village in Gandevi taluka (same name as taluka)
    'ગણદેવા': 'Gandeva',       // distinct village
    'છાપર': 'Chhapar',          // Gandevi village
    'નવસારી(શહેર)': 'Navsari (City)',
};

const fixes = [];
for (const [district, distData] of Object.entries(anyror)) {
    for (const [gujTaluka, vills] of Object.entries(distData.talukas)) {
        const talukaEng = TALUKA_MAP[gujTaluka];
        if (!talukaEng || !d.Gujarat[district][talukaEng]) continue;
        const list = d.Gujarat[district][talukaEng];

        for (const v of vills) {
            const guj = stripCode(v.label);
            const n = norm(guj);

            // Check if this official village is already represented in the taluka list
            let present = list.some((eng) => gen[eng] && norm(gen[eng]) === n);

            if (!present) {
                // Determine English name
                let english = MANUAL_ENGLISH[guj]
                    || (censusEnglishInGujMap.get(n))
                    || null;

                if (!english) {
                    // Search all current translations for this guj
                    for (const [eng, g] of Object.entries(gen)) {
                        if (norm(g) === n) { english = eng; break; }
                    }
                }
                if (!english) {
                    console.log(`WARN: no english for ${district}/${talukaEng}: ${guj} (${v.value})`);
                    continue;
                }

                list.push(english);
                if (!gen[english]) gen[english] = guj;
                fixes.push({ district, taluka: talukaEng, gujarati: guj, english });
                console.log(`ADDED ${district}/${talukaEng}: ${english} [${guj}] code=${v.value}`);
            }
        }
        list.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }
}

fs.writeFileSync('src/data/gujarat-villages.json', JSON.stringify(d, null, 2) + '\n');
fs.writeFileSync('src/data/generated-village-translations.json', JSON.stringify(gen, null, 2) + '\n');

const totalVillages = Object.values(d.Gujarat).reduce((s, tal) => s + Object.values(tal).reduce((x, v) => x + v.length, 0), 0);
console.log(`\n=== POST-PROCESS SUMMARY ===`);
console.log(`Fixes applied: ${fixes.length}`);
console.log(`Total villages now: ${totalVillages}`);
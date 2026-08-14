/**
 * Build corrected location dataset from the official AnyRoR hierarchy.
 *
 * Source of truth:
 *  - anyror-hierarchy.json      : official Gujarati village names + codes, per taluka
 *  - census-english-cache.json  : official Census English village names (Latin script)
 *  - gujarat-villages.json      : existing English village lists (for continuity)
 *  - generated-village-translations.json : existing English->Gujarati map
 *
 * Strategy:
 *  1. AnyRoR defines the authoritative District -> Taluka -> Village hierarchy
 *     (including official Gujarati names and village codes).
 *  2. For each AnyRoR village, determine the English name by:
 *       a. exact/normalized Gujarati match against existing English->Gujarati map
 *       b. transliteration skeleton match against Census English names
 *       c. transliteration skeleton match against existing English names
 *       d. fallback: transliterate the official Gujarati name
 *  3. Write corrected gujarat-villages.json + generated-village-translations.json.
 */
const fs = require('fs');

const anyror = JSON.parse(fs.readFileSync('anyror-hierarchy.json', 'utf8'));
const current = JSON.parse(fs.readFileSync('src/data/gujarat-villages.json', 'utf8')).Gujarat;
const generated = JSON.parse(fs.readFileSync('src/data/generated-village-translations.json', 'utf8'));
const census = JSON.parse(fs.readFileSync('census-english-cache.json', 'utf8'));

const TALUKA_MAP = {
    'નવસારી': 'Navsari', 'જલાલપોર': 'Jalalpore', 'ગણદેવી': 'Gandevi', 'ચીખલી': 'Chikhli',
    'વાંસદા': 'Vansda', 'ખેરગામ': 'Khergam', 'નવસારી શહેર': 'Navsari City',
    'ઓલપાડ': 'Olpad', 'માંગરોલ': 'Mangrol', 'ઉમરપાડા': 'Umarpada', 'માંડવી': 'Mandvi',
    'કામરેજ': 'Kamrej', 'ચોરાસી': 'Choryasi', 'પલસાણા': 'Palsana', 'બારડોલી': 'Bardoli',
    'મહુવા': 'Mahuva', 'અડાજણ': 'Adajan', 'કતારગામ': 'Katargam', 'પુણા': 'Puna',
    'ઉધના': 'Udhna', 'મજુરા': 'Majura', 'અબ્રામા': 'Abrama', 'અરેઠ': 'Areth', 'અંબિકા': 'Ambika',
};

const MANUAL_OVERRIDES = {
    'Gandevi': 'ગણદેવી', 'Chikhli': 'ચીખલી', 'Vansda': 'વાંસદા', 'Bansda': 'વાંસદા',
    'Bilimora': 'બિલીમોરા', 'Amalsad': 'અમલસાડ', 'Navsari': 'નવસારી', 'Surat': 'સુરત',
    'Jalalpore': 'જલાલપોર', 'Jalalpor': 'જલાલપોર', 'Olpad': 'ઓલપાડ', 'Mangrol': 'માંગરોલ',
    'Umarpada': 'ઉમરપાડા', 'Mandvi': 'માંડવી', 'Kamrej': 'કામરેજ', 'Choryasi': 'ચોરાસી',
    'Chorasi': 'ચોરાસી', 'Palsana': 'પલસાણા', 'Bardoli': 'બારડોલી', 'Mahuva': 'મહુવા',
    'Khergam': 'ખેરગામ', 'Adajan': 'અડાજણ', 'Katargam': 'કતારગામ', 'Puna': 'પુણા',
    'Udhna': 'ઉધના', 'Majura': 'મજુરા', 'Abrama': 'અબ્રામા', 'Areth': 'અરેઠ', 'Ambika': 'અંબિકા',
};

const engToGuj = { ...generated, ...MANUAL_OVERRIDES };

function stripCode(label) {
    return label.replace(/\s*-\s*\d+$/, '').trim();
}

// Conservative Gujarati normalizer: remove nukta/virama/whitespace, normalize ૅ/ૈ and anusvara
function normalizeGuj(s) {
    return String(s || '')
        .replace(/઼/g, '').replace(/્/g, '').replace(/\s+/g, '')
        .replace(/ૅ/g, 'ૈ').replace(/ં/g, '')
        .trim();
}

// Gujarati -> English transliterator (abugida-aware)
const CONS = { 'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ઙ': 'ng', 'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'jh', 'ઞ': 'ny', 'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n', 'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n', 'પ': 'p', 'ફ': 'ph', 'બ': 'b', 'ભ': 'bh', 'મ': 'm', 'ય': 'y', 'ર': 'r', 'લ': 'l', 'વ': 'v', 'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h', 'ળ': 'l' };
const MATRAS = { 'ા': 'a', 'િ': 'i', 'ી': 'i', 'ુ': 'u', 'ૂ': 'u', 'ૃ': 'ru', 'ે': 'e', 'ૈ': 'ai', 'ો': 'o', 'ૌ': 'au', 'ૅ': 'e', 'ં': 'n', 'ઃ': 'h', '઼': '', '્': '' };
const VOWELS = { 'અ': 'a', 'આ': 'a', 'ઇ': 'i', 'ઈ': 'i', 'ઉ': 'u', 'ઊ': 'u', 'ઋ': 'ru', 'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au', 'ઍ': 'e', 'ઑ': 'o' };
function transliterate(guj) {
    let out = '';
    for (let i = 0; i < guj.length;) {
        const ch = guj[i];
        if (VOWELS[ch] !== undefined) { out += VOWELS[ch]; i++; continue; }
        if (MATRAS[ch] !== undefined) { out += MATRAS[ch]; i++; continue; }
        if (CONS[ch] !== undefined) {
            let c = CONS[ch]; i++;
            let conjunct = '';
            while (i < guj.length && guj[i] === '્') {
                i++;
                if (i < guj.length && CONS[guj[i]]) { conjunct += CONS[guj[i]]; i++; }
                else break;
            }
            if (conjunct) {
                out += c + conjunct;
                if (i < guj.length && MATRAS[guj[i]] !== undefined && guj[i] !== '્') { out += MATRAS[guj[i]]; i++; }
                continue;
            }
            if (i < guj.length && MATRAS[guj[i]] !== undefined && guj[i] !== '્') { out += c + MATRAS[guj[i]]; i++; }
            else out += c + 'a';
            continue;
        }
        out += ch; i++;
    }
    return out.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Consonant skeleton: strip vowels for robust fuzzy matching
const skeleton = (s) => s.toLowerCase().replace(/[aeiou]+/g, '');

// Build lookup: normalized Gujarati -> English candidates (from current + census)
const gujNormToEnglish = new Map();
function addGujNorm(guj, english, district, taluka) {
    const norm = normalizeGuj(guj);
    if (!gujNormToEnglish.has(norm)) gujNormToEnglish.set(norm, []);
    gujNormToEnglish.get(norm).push({ english, district, taluka });
}
for (const [district, talukas] of Object.entries(current)) {
    for (const [taluka, villages] of Object.entries(talukas)) {
        for (const eng of villages) {
            const guj = engToGuj[eng];
            if (guj) addGujNorm(guj, eng, district, taluka);
        }
    }
}
for (const [district, talukas] of Object.entries(census)) {
    for (const [taluka, villages] of Object.entries(talukas)) {
        for (const eng of villages) {
            const guj = engToGuj[eng];
            if (guj) addGujNorm(guj, eng, district, taluka);
        }
    }
}

// Build skeleton -> English candidates (from census + current) for transliteration matching
const skeletonToEnglish = new Map();
function addSkeleton(english, district, taluka) {
    const sk = skeleton(english);
    if (!skeletonToEnglish.has(sk)) skeletonToEnglish.set(sk, []);
    skeletonToEnglish.get(sk).push({ english, district, taluka });
}
for (const [district, talukas] of Object.entries(census)) {
    for (const [taluka, villages] of Object.entries(talukas)) {
        for (const eng of villages) addSkeleton(eng, district, taluka);
    }
}
for (const [district, talukas] of Object.entries(current)) {
    for (const [taluka, villages] of Object.entries(talukas)) {
        for (const eng of villages) addSkeleton(eng, district, taluka);
    }
}

// Pick best English candidate for a given AnyRoR village
function pickEnglish(guj, district, talukaEng) {
    const norm = normalizeGuj(guj);
    // 1. normalized Gujarati match
    const normCands = gujNormToEnglish.get(norm) || [];
    if (normCands.length) {
        let best = normCands[0];
        for (const c of normCands) {
            if (c.district === district && best.district !== district) { best = c; continue; }
            if (c.district === district && c.taluka === talukaEng && (best.district !== district || best.taluka !== talukaEng)) { best = c; continue; }
        }
        return { english: best.english, source: 'gujarati-match' };
    }
    // 2. transliteration skeleton match
    const translit = transliterate(guj).toLowerCase();
    const sk = skeleton(translit);
    const skCands = skeletonToEnglish.get(sk) || [];
    if (skCands.length) {
        let best = skCands[0];
        for (const c of skCands) {
            if (c.district === district && best.district !== district) { best = c; continue; }
            if (c.district === district && c.taluka === talukaEng && (best.district !== district || best.taluka !== talukaEng)) { best = c; continue; }
        }
        return { english: best.english, source: 'transliteration-match' };
    }
    // 3. fallback: transliterate
    return { english: transliterate(guj), source: 'transliterated' };
}

// ---------- Build ----------
const corrected = { Gujarat: {} };
const englishNameMap = {}; // english -> {gujarati, code, district, taluka}
const addedVillages = [];
const spellingCorrections = [];

for (const [district, distData] of Object.entries(anyror)) {
    corrected.Gujarat[district] = corrected.Gujarat[district] || {};
    for (const [gujTaluka, vills] of Object.entries(distData.talukas)) {
        const talukaEng = TALUKA_MAP[gujTaluka];
        if (!talukaEng) { console.log('SKIP unmapped taluka', district, gujTaluka); continue; }
        corrected.Gujarat[district][talukaEng] = corrected.Gujarat[district][talukaEng] || [];

        for (const v of vills) {
            const guj = stripCode(v.label);
            const code = v.value;
            const { english, source } = pickEnglish(guj, district, talukaEng);

            if (source === 'transliterated') {
                addedVillages.push({ village: english, gujarati: guj, to: `${district}/${talukaEng}`, reason: 'new village (transliterated)' });
            } else if (source === 'transliteration-match') {
                addedVillages.push({ village: english, gujarati: guj, to: `${district}/${talukaEng}`, reason: 'matched via transliteration' });
            }

            englishNameMap[english] = { gujarati: guj, code, district, taluka: talukaEng };

            const existingGuj = engToGuj[english];
            if (existingGuj && existingGuj !== guj && normalizeGuj(existingGuj) === normalizeGuj(guj)) {
                spellingCorrections.push({ english, old: existingGuj, new: guj, taluka: talukaEng });
            }

            if (!corrected.Gujarat[district][talukaEng].includes(english)) {
                corrected.Gujarat[district][talukaEng].push(english);
            }
        }
        corrected.Gujarat[district][talukaEng].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }
}

fs.writeFileSync('src/data/gujarat-villages.json', JSON.stringify(corrected, null, 2) + '\n');

// Translations
const newTranslations = {};
for (const [english, info] of Object.entries(englishNameMap)) newTranslations[english] = info.gujarati;
for (const [guj, eng] of Object.entries(TALUKA_MAP)) newTranslations[eng] = guj;
for (const [eng, guj] of Object.entries(MANUAL_OVERRIDES)) if (!newTranslations[eng]) newTranslations[eng] = guj;
for (const [eng, guj] of Object.entries(generated)) if (!newTranslations[eng]) newTranslations[eng] = guj;
fs.writeFileSync('src/data/generated-village-translations.json', JSON.stringify(newTranslations, null, 2) + '\n');

fs.writeFileSync('anyror-official-english-map.json', JSON.stringify(englishNameMap, null, 2));

const totalVillages = Object.values(corrected.Gujarat).reduce((s, talukas) => s + Object.values(talukas).reduce((x, v) => x + v.length, 0), 0);
const totalTalukas = Object.values(corrected.Gujarat).reduce((s, talukas) => s + Object.keys(talukas).length, 0);

console.log('\n=== BUILD SUMMARY ===');
console.log(`Districts: ${Object.keys(corrected.Gujarat).length}`);
console.log(`Talukas: ${totalTalukas}`);
console.log(`Villages: ${totalVillages}`);
console.log(`\nNew/assigned villages (${addedVillages.length}):`);
for (const a of addedVillages) console.log(`  ${a.village} (${a.gujarati}) -> ${a.to} [${a.reason}]`);
console.log(`\nSpelling corrections (${spellingCorrections.length}):`);
for (const s of spellingCorrections) console.log(`  ${s.english}: ${s.old} -> ${s.new} (${s.taluka})`);
console.log('\nDONE');
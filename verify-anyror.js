/**
 * Verify the built dataset against the official AnyRoR hierarchy.
 * Uses transliteration (matra-insensitive) matching per taluka.
 */
const fs = require('fs');

const anyror = JSON.parse(fs.readFileSync('anyror-hierarchy.json', 'utf8'));
const d = JSON.parse(fs.readFileSync('src/data/gujarat-villages.json', 'utf8')).Gujarat;
const gen = JSON.parse(fs.readFileSync('src/data/generated-village-translations.json', 'utf8'));

const TALUKA_MAP = {
    'નવસારી': 'Navsari', 'જલાલપોર': 'Jalalpore', 'ગણદેવી': 'Gandevi', 'ચીખલી': 'Chikhli',
    'વાંસદા': 'Vansda', 'ખેરગામ': 'Khergam', 'નવસારી શહેર': 'Navsari City',
    'ઓલપાડ': 'Olpad', 'માંગરોલ': 'Mangrol', 'ઉમરપાડા': 'Umarpada', 'માંડવી': 'Mandvi',
    'કામરેજ': 'Kamrej', 'ચોરાસી': 'Choryasi', 'પલસાણા': 'Palsana', 'બારડોલી': 'Bardoli',
    'મહુવા': 'Mahuva', 'અડાજણ': 'Adajan', 'કતારગામ': 'Katargam', 'પુણા': 'Puna',
    'ઉધના': 'Udhna', 'મજુરા': 'Majura', 'અબ્રામા': 'Abrama', 'અરેઠ': 'Areth', 'અંબિકા': 'Ambika',
};

const strip = (l) => l.replace(/\s*-\s*\d+$/, '').trim();

// Consonant skeleton matching actually collapses too much in Gujarati.
// Better: use transliteration -> lowercase -> remove vowels/trailing noise, but
// keep a slightly longer key. We'll use the full transliteration minus vowel chars
// but preserving order, and also compare with a normalized phonetic key.
const CONS = { 'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ઙ': 'ng', 'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'jh', 'ઞ': 'ny', 'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n', 'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n', 'પ': 'p', 'ફ': 'ph', 'બ': 'b', 'ભ': 'bh', 'મ': 'm', 'ય': 'y', 'ર': 'r', 'લ': 'l', 'વ': 'v', 'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h', 'ળ': 'l' };
const MATRAS = { 'ા': 'a', 'િ': 'i', 'ી': 'i', 'ુ': 'u', 'ૂ': 'u', 'ૃ': 'ru', 'ે': 'e', 'ૈ': 'ai', 'ો': 'o', 'ૌ': 'au', 'ૅ': 'e', 'ં': 'n', 'ઃ': 'h', '઼': '', '્': '' };
const VOWELS = { 'અ': 'a', 'આ': 'a', 'ઇ': 'i', 'ઈ': 'i', 'ઉ': 'u', 'ઊ': 'u', 'ઋ': 'ru', 'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au', 'ઍ': 'e', 'ઑ': 'o' };

function transliterate(guj) {
    let out = '';
    for (let i = 0; i < guj.length;) {
        const c = guj[i];
        if (VOWELS[c] !== undefined) { out += VOWELS[c]; i++; continue; }
        if (MATRAS[c] !== undefined) { out += MATRAS[c]; i++; continue; }
        if (CONS[c] !== undefined) {
            out += CONS[c];
            i++;
            if (i < guj.length && guj[i] === '્') {
                while (i < guj.length && guj[i] === '્') {
                    i++;
                    if (i < guj.length && CONS[guj[i]]) { out += CONS[guj[i]]; i++; }
                    else break;
                }
            }
            continue;
        }
        out += c; i++;
    }
    return out;
}

// Hard key: single unique matra-stable form
function hardKey(guj) {
    return transliterate(guj).toLowerCase().replace(/[aeiou]+/g, '');
}

let out = '';
let totalOfficial = 0;
let totalBuilt = 0;
let missingAll = [];
let extraAll = [];

for (const [district, distData] of Object.entries(anyror)) {
    out += `\n=== ${district} ===\n`;
    for (const [gujTaluka, vills] of Object.entries(distData.talukas)) {
        const talukaEng = TALUKA_MAP[gujTaluka];
        if (!talukaEng) { out += `  ${gujTaluka}: NO MAPPING\n`; continue; }
        const builtList = (d[district] || {})[talukaEng] || [];
        const builtKeys = builtList.map((e) => hardKey(gen[e] || e));
        const builtKeySet = new Set(builtKeys);

        const missing = [];
        for (const v of vills) {
            const guj = strip(v.label);
            const key = hardKey(guj);
            totalOfficial++;
            if (!builtKeySet.has(key)) missing.push(`${guj} (${v.value})`);
        }

        const extra = [];
        for (const e of builtList) {
            totalBuilt++;
            const key = hardKey(gen[e] || e);
            const officialHas = vills.some((v) => hardKey(strip(v.label)) === key);
            if (!officialHas) extra.push(`${e} [${gen[e] || '?'}]`);
        }

        out += `  ${talukaEng} (${gujTaluka}): official=${vills.length}, built=${builtList.length}\n`;
        if (missing.length) out += `    MISSING (${missing.length}):\n      ${missing.join('\n      ')}\n`;
        if (extra.length) out += `    EXTRA (${extra.length}):\n      ${extra.join('\n      ')}\n`;
        if (!missing.length && !extra.length) out += `    OK\n`;

        missingAll.push(...missing.map((m) => `${district}/${talukaEng}: ${m}`));
        extraAll.push(...extra.map((e) => `${district}/${talukaEng}: ${e}`));
    }
}

fs.writeFileSync('anyror-verify.txt', out);
console.log('=== VERIFY SUMMARY ===');
console.log(`Official villages: ${totalOfficial}`);
console.log(`Built villages: ${totalBuilt}`);
console.log(`Missing (${missingAll.length}):`);
missingAll.forEach((m) => console.log(`  ${m}`));
console.log(`Extra (${extraAll.length}):`);
extraAll.forEach((m) => console.log(`  ${m}`));
console.log('Wrote anyror-verify.txt');
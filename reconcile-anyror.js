/**
 * Comprehensive reconciliation of current dataset + translations
 * against the official AnyRoR hierarchy (anyror-hierarchy.json).
 *
 * Matching strategy:
 *  - Current dataset stores ENGLISH village names in gujarat-villages.json
 *  - generated-village-translations.json maps ENGLISH -> GUJARATI
 *  - translations.js locationTranslationsGu has manual overrides
 *  - AnyRoR provides official GUJARATI names + codes
 *
 * We match by: current English -> translation -> AnyRoR Gujarati set.
 * Also reversed: AnyRoR Gujarati -> find English name in current whose
 * translation matches.
 */
const fs = require('fs');

const current = JSON.parse(fs.readFileSync('src/data/gujarat-villages.json', 'utf8')).Gujarat;
const generatedTranslations = JSON.parse(fs.readFileSync('src/data/generated-village-translations.json', 'utf8'));
// Manual overrides from translations.js locationTranslationsGu (extracted below in JS form)
const manualOverrides = {
    'Gandevi': 'ગણદેવી',
    'Chikhli': 'ચીખલી',
    'Vansda': 'વાંસદા',
    'Bansda': 'વાંસદા',
    'Bilimora': 'બિલીમોરા',
    'Amalsad': 'અમલસાડ',
    'Navsari': 'નવસારી',
    'Surat': 'સુરત',
    'Jalalpore': 'જલાલપોર',
    'Jalalpor': 'જલાલપોર',
    'Olpad': 'ઓલપાડ',
    'Mangrol': 'માંગરોલ',
    'Umarpada': 'ઉમરપાડા',
    'Mandvi': 'માંડવી',
    'Kamrej': 'કામરેજ',
    'Choryasi': 'ચોરાસી',
    'Chorasi': 'ચોરાસી',
    'Palsana': 'પલસાણા',
    'Bardoli': 'બારડોલી',
    'Mahuva': 'મહુવા',
    'Khergam': 'ખેરગામ',
};

const engToGuj = { ...generatedTranslations, ...manualOverrides };

// Build gujToEng reverse map (first-wins, prefer manual overrides)
const gujToEng = {};
for (const [eng, guj] of Object.entries(engToGuj)) {
    if (!gujToEng[guj]) gujToEng[guj] = eng;
}

const anyror = JSON.parse(fs.readFileSync('anyror-hierarchy.json', 'utf8'));

// AnyRoR taluka keys are Gujarati. Map to English names.
const talukaMapAnyRoRToCurrent = {
    'નવસારી': 'Navsari',
    'જલાલપોર': 'Jalalpore',
    'ગણદેવી': 'Gandevi',
    'ચીખલી': 'Chikhli',
    'વાંસદા': 'Vansda',
    'ખેરગામ': 'Khergam',
    'નવસારી શહેર': 'Navsari City',
    'ઓલપાડ': 'Olpad',
    'માંગરોલ': 'Mangrol',
    'ઉમરપાડા': 'Umarpada',
    'માંડવી': 'Mandvi',
    'કામરેજ': 'Kamrej',
    'ચોરાસી': 'Choryasi',
    'પલસાણા': 'Palsana',
    'બારડોલી': 'Bardoli',
    'મહુવા': 'Mahuva',
    'અડાજણ': 'Adajan',
    'કતારગામ': 'Katargam',
    'પુણા': 'Puna',
    'ઉધના': 'Udhna',
    'મજુરા': 'Majura',
    'અબ્રામા': 'Abrama',
    'અરેઠ': 'Areth',
    'અંબિકા': 'Ambika',
};
const currentToAnyRoR = {};
for (const [guj, eng] of Object.entries(talukaMapAnyRoRToCurrent)) currentToAnyRoR[eng] = guj;

function stripCode(label) {
    return label.replace(/\s*-\s*\d+$/, '').trim();
}

let out = '';

// Overview of AnyRoR talukas
out += '=== ANYROR TALUKA SUMMARY ===\n';
for (const [district, dist] of Object.entries(anyror)) {
    out += `\n${district} (${dist.districtCode}):\n`;
    for (const [taluka, villages] of Object.entries(dist.talukas)) {
        out += `  ${taluka} -> ${talukaMapAnyRoRToCurrent[taluka] || 'NO MAPPING'}: ${villages.length} villages\n`;
    }
}

// For each current (district, taluka), compare with AnyRoR
out += '\n\n=== DETAILED TALUKA COMPARISON (using translations) ===\n';

function buildAnyRoRSet(anyrorTalukaEntries) {
    const set = new Set();
    for (const e of anyrorTalukaEntries) {
        set.add(stripCode(e.label));
    }
    return set;
}

function matchEnglishToAnyRoR(englishVillages, anyrorSet) {
    // Returns { matched: [], unmatchedEnglish: [], unmatchedAnyRoR: [] }
    const matched = [];
    const unmatchedEnglish = [];
    const anyrorRemaining = new Set(anyrorSet);
    for (const ev of englishVillages) {
        const gujName = engToGuj[ev];
        if (gujName && anyrorRemaining.has(gujName)) {
            matched.push({ english: ev, gujarati: gujName });
            anyrorRemaining.delete(gujName);
        } else {
            unmatchedEnglish.push(ev);
        }
    }
    return { matched, unmatchedEnglish, unmatchedAnyRoR: [...anyrorRemaining] };
}

// Track overall stats
const stats = {
    navsari: { talukas: 0, villages: 0 },
    surat: { talukas: 0, villages: 0 },
    missingVillages: [],
    wrongSpellings: [],
    wrongMappings: [],
};

for (const [district, talukas] of Object.entries(current)) {
    out += `\n########## DISTRICT: ${district} ##########\n`;
    for (const [taluka, villages] of Object.entries(talukas)) {
        const anyrorTalukaKey = currentToAnyRoR[taluka];
        const anyrorDistrict = anyror[district];
        if (!anyrorTalukaKey || !anyrorDistrict || !anyrorDistrict.talukas[anyrorTalukaKey]) {
            out += `\n### TALUKA ${taluka}: ** NO ANYROR COUNTERPART **\n`;
            continue;
        }

        const anyrorEntries = anyrorDistrict.talukas[anyrorTalukaKey];
        const anyrorSet = buildAnyRoRSet(anyrorEntries);
        const result = matchEnglishToAnyRoR(villages, anyrorSet);

        out += `\n### TALUKA ${taluka} (AnyRoR: ${anyrorTalukaKey}) ###\n`;
        out += `Current villages: ${villages.length} | AnyRoR villages: ${anyrorSet.size} | Matched: ${result.matched.length}\n`;

        if (result.unmatchedEnglish.length) {
            out += `\n-- IN CURRENT BUT NOT FOUND IN ANYROR (${result.unmatchedEnglish.length}) --\n`;
            for (const ev of result.unmatchedEnglish) {
                const guj = engToGuj[ev] || '(no translation)';
                out += `  ${ev} [${guj}]\n`;
            }
        }
        if (result.unmatchedAnyRoR.length) {
            out += `\n-- IN ANYROR BUT NOT FOUND IN CURRENT (${result.unmatchedAnyRoR.length}) --\n`;
            for (const gujName of result.unmatchedAnyRoR) {
                const engFromReverse = gujToEng[gujName] || '(no reverse match)';
                out += `  ${gujName} [english? ${engFromReverse}]\n`;
            }
        }

        // Reverse lookup for missing: AnyRoR gujarati name might match an English village
        // whose translation is WRONG (incorrect spelling). Try fuzzy match.
        if (result.unmatchedAnyRoR.length && result.unmatchedEnglish.length) {
            out += `\n-- POSSIBLE SPELLING CORRECTIONS (fuzzy) --\n`;
            for (const gujName of result.unmatchedAnyRoR) {
                for (const ev of result.unmatchedEnglish) {
                    const gujOfEv = engToGuj[ev] || '';
                    // Compare gujarati strings by normalized length/prefix
                    const normalize = (s) => s.replace(/ા$/g, '');
                    const a = normalize(gujName);
                    const b = normalize(gujOfEv);
                    if (a.slice(0, 3) === b.slice(0, 3) || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4))) {
                        out += `  AnyRoR "${gujName}" <-> current "${ev}" (current guj: "${gujOfEv}")\n`;
                    }
                }
            }
        }

        if (stats[district.toLowerCase()]) {
            stats[district.toLowerCase()].talukas++;
            stats[district.toLowerCase()].villages += anyrorSet.size;
        }
    }
}

// Check talukas in AnyRoR not in current
out += '\n\n=== TALUKAS IN ANYROR NOT IN CURRENT ===\n';
for (const [district, dist] of Object.entries(anyror)) {
    for (const [taluka, villages] of Object.entries(dist.talukas)) {
        const engName = talukaMapAnyRoRToCurrent[taluka];
        if (!engName || !current[district]?.[engName]) {
            out += `${district} / ${taluka} (${engName || 'unmapped'}): ${villages.length} villages\n`;
            for (const v of villages) {
                out += `    ${v.label} [english? ${gujToEng[stripCode(v.label)] || '?'}]\n`;
            }
        }
    }
}

// Specific checks
out += '\n\n=== SPECIFIC CHECKS ===\n';
function checkVillage(district, talukaEng, englishName) {
    const anyrorDist = anyror[district];
    const gujTaluka = currentToAnyRoR[talukaEng];
    if (!anyrorDist || !gujTaluka || !anyrorDist.talukas[gujTaluka]) {
        out += `${district}/${talukaEng}/${englishName}: ** NO ANYROR TALUKA **\n`;
        return;
    }
    const set = buildAnyRoRSet(anyrorDist.talukas[gujTaluka]);
    const guj = engToGuj[englishName];
    const found = guj ? set.has(guj) : false;
    out += `${district}/${talukaEng}/${englishName} (guj: ${guj || '?'}): ${found ? 'FOUND in AnyRoR' : 'NOT FOUND in AnyRoR'}\n`;
}
checkVillage('Navsari', 'Gandevi', 'Bilimora');
checkVillage('Navsari', 'Gandevi', 'Amalsad');
checkVillage('Navsari', 'Gandevi', 'Gandevi');
checkVillage('Navsari', 'Chikhli', 'Chikhli');
checkVillage('Navsari', 'Jalalpore', 'Jalalpore');
checkVillage('Navsari', 'Navsari', 'Navsari');
checkVillage('Navsari', 'Vansda', 'Vansda');
checkVillage('Surat', 'Olpad', 'Olpad');
checkVillage('Surat', 'Bardoli', 'Bardoli');
checkVillage('Surat', 'Mahuva', 'Mahuva');
checkVillage('Surat', 'Kamrej', 'Kamrej');

fs.writeFileSync('anyror-reconciliation.txt', out);
console.log('DONE - wrote anyror-reconciliation.txt');
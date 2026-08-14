/**
 * Compare existing gujarat-villages.json against official AnyRoR hierarchy
 * (anyror-hierarchy.json), identifying:
 *  - Missing talukas
 *  - Missing villages per taluka
 *  - Extra villages (not in official source)
 *  - Villages whose taluka assignment differs
 */
const fs = require('fs');

const current = JSON.parse(fs.readFileSync('src/data/gujarat-villages.json', 'utf8')).Gujarat;
const anyror = JSON.parse(fs.readFileSync('anyror-hierarchy.json', 'utf8'));

// AnyRoR labels are Gujarati + code, like "અછારણ - 050"
// We need to map Gujarati taluka names to our English names.
// The current data uses English taluka keys (Navsari, Jalalpore, Gandevi, Chikhli, Vansda)
// The AnyRoR uses Gujarati taluka keys.
// We will build a mapping manually from known official spellings.
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

// Also map the current English names to their Gujarati counterparts for reporting
const gujaratiOfCurrent = {};
for (const [guj, eng] of Object.entries(talukaMapAnyRoRToCurrent)) {
    gujaratiOfCurrent[eng] = guj;
}

let out = '';

// 1) Report AnyRoR talukas and counts
out += '=== ANYROR OFFICIAL TALUKA SUMMARY ===\n';
for (const [district, distData] of Object.entries(anyror)) {
    out += `\n${district} (${distData.districtCode}):\n`;
    for (const [taluka, villages] of Object.entries(distData.talukas)) {
        out += `  ${taluka} (${talukaMapAnyRoRToCurrent[taluka] || '?'}): ${villages.length} villages\n`;
    }
}

// 2) For each current district/taluka, compare village lists
out += '\n\n=== PER-TALUKA COMPARISON ===\n';

const totals = { anyrorVillages: 0, currentVillages: 0, missingFromCurrent: 0, extraInCurrent: 0 };
const missingPerTaluka = {};
const extraPerTaluka = {};
const correctedSpellings = {}; // gujarati official -> english current (where we can match)

// Build lookup: for each AnyRoR taluka, map gujarati village name (without code) to village entry
function stripCode(label) {
    // Remove trailing " - 050" style codes
    return label.replace(/\s*-\s*\d+$/, '').trim();
}

// For each current district in the dataset
for (const [district, talukas] of Object.entries(current)) {
    out += `\n--- District: ${district} ---\n`;
    for (const [taluka, villages] of Object.entries(talukas)) {
        // Find the matching AnyRoR taluka
        const anyrorDistrict = anyror[district];
        let anyrorTalukaKey = null;
        for (const [gujKey, engKey] of Object.entries(talukaMapAnyRoRToCurrent)) {
            if (engKey === taluka && anyrorDistrict && anyrorDistrict.talukas[gujKey]) {
                anyrorTalukaKey = gujKey;
                break;
            }
        }

        if (!anyrorDistrict || !anyrorTalukaKey) {
            out += `\n  ${taluka}: ** NO ANYROR MATCH **\n`;
            continue;
        }

        const anyrorEntries = anyrorDistrict.talukas[anyrorTalukaKey] || [];
        const anyrorVillages = new Set(anyrorEntries.map((v) => stripCode(v.label)));
        const currentSet = new Set(villages);

        const missing = [];
        for (const av of anyrorVillages) {
            // Try to match: exact match, or match English current to Gujarati
            // We don't have English translations for all, so check if current has the guj name
            let found = false;
            for (const cv of currentSet) {
                if (cv.toLowerCase() === av.toLowerCase()) { found = true; break; }
            }
            if (!found) missing.push(av);
        }

        const extra = [];
        for (const cv of currentSet) {
            // Is this village in AnyRoR for this taluka?
            let found = false;
            for (const av of anyrorVillages) {
                if (cv.toLowerCase() === av.toLowerCase()) { found = true; break; }
            }
            if (!found) extra.push(cv);
        }

        out += `\n  ${taluka} (${anyrorTalukaKey}):\n`;
        out += `    AnyRoR count: ${anyrorVillages.size}\n`;
        out += `    Current count: ${currentSet.size}\n`;
        if (missing.length) {
            out += `    MISSING (${missing.length}):\n      ${missing.join('\n      ')}\n`;
            missingPerTaluka[`${district}|${taluka}`] = missing;
        } else {
            out += `    MISSING: none\n`;
        }
        if (extra.length) {
            out += `    EXTRA (${extra.length}):\n      ${extra.join('\n      ')}\n`;
            extraPerTaluka[`${district}|${taluka}`] = extra;
        } else {
            out += `    EXTRA: none\n`;
        }

        totals.anyrorVillages += anyrorVillages.size;
        totals.currentVillages += currentSet.size;
        totals.missingFromCurrent += missing.length;
        totals.extraInCurrent += extra.length;
    }
}

// 3) Check specific villages: Bilimora, Gandevi, Amalsad
out += '\n\n=== SPECIFIC VILLAGE CHECKS ===\n';
const checks = [
    ['Navsari', 'Gandevi', 'Bilimora'],
    ['Navsari', 'Gandevi', 'Amalsad'],
    ['Navsari', 'Gandevi', 'Gandevi'],
    ['Navsari', 'Chikhli', 'Chikhli'],
    ['Navsari', 'Jalalpore', 'Jalalpore'],
    ['Navsari', 'Navsari', 'Navsari'],
];
for (const [district, taluka, village] of checks) {
    const anyrorDistrict = anyror[district];
    let anyrorTalukaKey = null;
    for (const [gujKey, engKey] of Object.entries(talukaMapAnyRoRToCurrent)) {
        if (engKey === taluka && anyrorDistrict && anyrorDistrict.talukas[gujKey]) {
            anyrorTalukaKey = gujKey;
            break;
        }
    }
    const entries = anyrorDistrict?.talukas[anyrorTalukaKey] || [];
    const inAnyRoR = entries.some((v) => stripCode(v.label).toLowerCase() === village.toLowerCase());
    const inCurrent = (current[district]?.[taluka] || []).some((v) => v.toLowerCase() === village.toLowerCase());
    out += `${district}/${taluka}/${village}: AnyRoR=${inAnyRoR ? 'YES' : 'NO'}, Current=${inCurrent ? 'YES' : 'NO'}\n`;
}

// 4) Report new talukas that exist in AnyRoR but not in current dataset
out += '\n\n=== TALUKAS IN ANYROR BUT NOT IN CURRENT ===\n';
for (const [district, distData] of Object.entries(anyror)) {
    for (const [taluka, villages] of Object.entries(distData.talukas)) {
        const engName = talukaMapAnyRoRToCurrent[taluka];
        if (!engName || !current[district]?.[engName]) {
            out += `${district} / ${taluka} (${engName || 'unmapped'}): ${villages.length} villages\n`;
        }
    }
}

out += `\n\n=== TOTALS ===\n`;
out += `AnyRoR villages across matched talukas: ${totals.anyrorVillages}\n`;
out += `Current villages across matched talukas: ${totals.currentVillages}\n`;
out += `Missing from current: ${totals.missingFromCurrent}\n`;
out += `Extra in current: ${totals.extraInCurrent}\n`;

fs.writeFileSync('anyror-comparison.txt', out);
console.log('DONE - wrote anyror-comparison.txt');
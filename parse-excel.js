const XLSX = require('xlsx');
const fs = require('fs');

const currentData = JSON.parse(fs.readFileSync('src/data/gujarat-villages.json', 'utf8'));
const currentMap = {}; // "District|Taluka" -> Set(villages)

Object.entries(currentData.Gujarat || {}).forEach(([district, talukas]) => {
    Object.entries(talukas).forEach(([taluka, villages]) => {
        const key = `${district}|${taluka}`;
        currentMap[key] = new Set(villages);
    });
});

const wb = XLSX.readFile('src/data/DH_2011_DCHB_Village_Release_2400.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

const excelMap = {}; // "District|SubDistrict" -> Map(villageUpper -> village)

for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 8) continue;
    const district = String(row[3] || '').trim();
    const subDistrict = String(row[5] || '').trim();
    const village = String(row[7] || '').trim();
    if (!district || !subDistrict || !village) continue;
    const key = `${district}|${subDistrict}`;
    if (!excelMap[key]) excelMap[key] = new Map();
    excelMap[key].set(village.toUpperCase(), village);
}

let out = '';

Object.keys(currentMap).sort().forEach((key) => {
    const [district, taluka] = key.split('|');
    // Try matching exactly; also try Bansda/Vansda alias
    let excelKey = `${district}|${taluka}`;
    let excelVillages = excelMap[excelKey];
    if (!excelVillages && taluka === 'Vansda') {
        excelVillages = excelMap[`${district}|Bansda`];
    }
    if (!excelVillages && taluka === 'Choryasi') {
        excelVillages = excelMap[`${district}|Chorasi`];
    }
    if (!excelVillages) {
        out += `\n=== ${district} / ${taluka}: NO EXCEL DATA FOUND ===\n`;
        return;
    }

    const current = currentMap[key];
    const currentUpper = new Set([...current].map((v) => v.toUpperCase()));
    const missing = [];
    excelVillages.forEach((village, upper) => {
        if (!currentUpper.has(upper)) missing.push(village);
    });
    // Villages in current but not in excel (may be cities/towns, not necessarily wrong)
    const extra = [];
    current.forEach((v) => {
        if (!excelVillages.has(v.toUpperCase())) extra.push(v);
    });

    out += `\n=== ${district} / ${taluka} ===\n`;
    out += `Excel count: ${excelVillages.size}\n`;
    out += `Current count: ${current.size}\n`;
    if (missing.length) {
        out += `MISSING (${missing.length}):\n  ${missing.sort().join('\n  ')}\n`;
    } else {
        out += 'MISSING: none\n';
    }
    if (extra.length) {
        out += `EXTRA (${extra.length}):\n  ${extra.sort().join('\n  ')}\n`;
    } else {
        out += 'EXTRA: none\n';
    }
});

// Also list all sub-districts in Navsari and Surat from Excel
out += '\n\n=== ALL SUB-DISTRICTS IN NAVSARI & SURAT (from Excel) ===\n';
const navsariSubDistricts = new Set();
const suratSubDistricts = new Set();
Object.keys(excelMap).forEach((key) => {
    const [district, sub] = key.split('|');
    if (district === 'Navsari') navsariSubDistricts.add(sub);
    if (district === 'Surat') suratSubDistricts.add(sub);
});
out += 'Navsari sub-districts: ' + [...navsariSubDistricts].sort().join(', ') + '\n';
out += 'Surat sub-districts: ' + [...suratSubDistricts].sort().join(', ') + '\n';

fs.writeFileSync('excel-comparison.txt', out);
console.log('DONE - wrote excel-comparison.txt');
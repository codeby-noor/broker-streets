const fs = require('fs');

const villages = JSON.parse(fs.readFileSync('src/data/gujarat-villages.json', 'utf8'));
const translations = JSON.parse(fs.readFileSync('src/data/generated-village-translations.json', 'utf8'));

let missing = [];
let total = 0;

Object.entries(villages.Gujarat || {}).forEach(([district, talukas]) => {
    Object.entries(talukas).forEach(([taluka, villageList]) => {
        villageList.forEach((village) => {
            total++;
            if (!translations[village]) {
                missing.push(`${district} / ${taluka} / ${village}`);
            }
        });
    });
});

console.log('Total villages:', total);
console.log('Missing translations:', missing.length);
if (missing.length) {
    console.log('Missing:');
    missing.forEach((m) => console.log('  ' + m));
}
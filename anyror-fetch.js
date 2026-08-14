/**
 * AnyRoR Portal Scraper - extracts District → Taluka → Village hierarchy
 * from the official Gujarat Revenue Department portal (anyror.gujarat.gov.in)
 *
 * The portal is ASP.NET WebForms. District options are server-rendered.
 * Taluka/Village options load via postback events. We must preserve the
 * ASP.NET session cookie and re-encode form values correctly.
 */
const fs = require('fs');

const BASE = 'https://anyror.gujarat.gov.in';
const PAGE_URL = `${BASE}/LandRecordRural.aspx`;

const DISTRICTS = {
    '24': 'Navsari',
    '22': 'Surat',
};

// --- Minimal cookie jar (Node native fetch does not persist cookies) ---
let cookieJar = '';
function setCookies(setCookieHeaders) {
    const toStore = [];
    for (const sc of setCookieHeaders || []) {
        const parts = sc.split(';');
        const cookiePart = parts[0].trim();
        if (!cookiePart) continue;
        // Drop expired/deleted cookies (Max-Age=0 / Expires in past)
        const lower = sc.toLowerCase();
        if (lower.includes('max-age=0') || lower.includes('expires=thu, 01 jan 1970')) {
            const name = cookiePart.split('=')[0];
            cookieJar = cookieJar
                .split(';')
                .map((c) => c.trim())
                .filter((c) => c && !c.startsWith(name + '='))
                .join('; ');
            continue;
        }
        if (cookiePart && !cookieJar.split(';').map((c) => c.trim()).some((c) => c.startsWith(cookiePart.split('=')[0] + '='))) {
            toStore.push(cookiePart);
        } else {
            // replace existing
            const name = cookiePart.split('=')[0];
            cookieJar = cookieJar
                .split(';')
                .map((c) => c.trim())
                .filter((c) => c && !c.startsWith(name + '='))
                .join('; ');
            toStore.push(cookiePart);
        }
    }
    if (toStore.length) {
        cookieJar = [cookieJar, ...toStore].filter(Boolean).join('; ');
    }
}

async function fetchPage(url, options = {}) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,gu;q=0.8',
        'Connection': 'keep-alive',
        ...options.headers,
    };
    if (cookieJar) headers['Cookie'] = cookieJar;

    const res = await fetch(url, { ...options, headers, redirect: 'follow', credentials: 'include' });
    setCookies(res.headers.getSetCookie && res.headers.getSetCookie());
    const text = await res.text();
    return { status: res.status, text, headers: res.headers };
}

function decodeEntities(s) {
    const amp = String.fromCharCode(97, 109, 112); // "amp"
    const lt = String.fromCharCode(108, 116); // "lt"
    const gt = String.fromCharCode(103, 116); // "gt"
    const quot = String.fromCharCode(113, 117, 111, 116); // "quot"
    const hash = String.fromCharCode(35); // "#"
    return s
        .replace(new RegExp('&' + amp + ';', 'g'), '&')
        .replace(new RegExp('&' + lt + ';', 'g'), '<')
        .replace(new RegExp('&' + gt + ';', 'g'), '>')
        .replace(new RegExp('&' + quot + ';', 'g'), '"')
        .replace(new RegExp('&' + hash + '39;', 'g'), "'")
        .replace(new RegExp('&' + hash + '64;', 'g'), '@');
}

function extractHiddenFields(html) {
    const fields = {};
    // Match hidden inputs: name="..." id="..." value="..."  (attributes in any order)
    const re = /<input[^>]*type="hidden"[^>]*>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const tag = m[0];
        const nameM = /name="([^"]+)"/i.exec(tag);
        const valueM = /value="([^"]*)"/i.exec(tag);
        if (nameM) {
            fields[nameM[1]] = valueM ? decodeEntities(valueM[1]) : '';
        }
    }
    return fields;
}

function encodeForm(fields, overrides = {}) {
    const merged = { ...fields, ...overrides };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
        if (typeof value === 'string') {
            params.append(key, value);
        }
    }
    return params.toString();
}

function extractOptions(html, selectId) {
    const escaped = selectId.replace(/[$]/g, '\\$');
    const re = new RegExp(`<select[^>]*?id="${selectId}"[^>]*?>([\\s\\S]*?)<\\/select>`, 'i');
    const m = re.exec(html);
    if (!m) return { found: false, options: [] };
    const options = [];
    const optRe = /<option[^>]*?value="([^"]*)"[^>]*?>([\s\S]*?)<\/option>/gi;
    let om;
    while ((om = optRe.exec(m[1])) !== null) {
        const label = om[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        options.push({ value: decodeEntities(om[1]), label: decodeEntities(label) });
    }
    return { found: true, options };
}

async function postback(fields, overrides, label) {
    const body = encodeForm(fields, overrides);
    const { status, text } = await fetchPage(PAGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': BASE,
            'Referer': PAGE_URL,
        },
        body,
    });
    console.log(`  [${label}] HTTP ${status}, len ${text.length}`);
    return text;
}

async function getTalukas(fields, districtCode) {
    const text = await postback(fields, {
        'ctl00$ContentPlaceHolder1$drpLandRecord': '13',
        'ctl00$ContentPlaceHolder1$ddlDistrict': districtCode,
        'ctl00$ContentPlaceHolder1$ddlTaluka': '',
        'ctl00$ContentPlaceHolder1$ddlVillage': '',
        '__EVENTTARGET': 'ctl00$ContentPlaceHolder1$ddlDistrict',
        '__EVENTARGUMENT': '',
    }, 'taluka fetch');
    if (!text.includes('ddlTaluka')) {
        fs.writeFileSync('anyror_taluka_error.html', text);
        console.log('  (taluka select not found - saved anyror_taluka_error.html)');
    }
    const sel = extractOptions(text, 'ContentPlaceHolder1_ddlTaluka');
    const newFields = extractHiddenFields(text);
    return { html: text, talukaOptions: sel.options, talukaFound: sel.found, fields: newFields };
}

async function getVillages(fields, districtCode, talukaValue) {
    const text = await postback(fields, {
        'ctl00$ContentPlaceHolder1$drpLandRecord': '13',
        'ctl00$ContentPlaceHolder1$ddlDistrict': districtCode,
        'ctl00$ContentPlaceHolder1$ddlTaluka': talukaValue,
        'ctl00$ContentPlaceHolder1$ddlVillage': '',
        '__EVENTTARGET': 'ctl00$ContentPlaceHolder1$ddlTaluka',
        '__EVENTARGUMENT': '',
    }, 'village fetch');
    const sel = extractOptions(text, 'ContentPlaceHolder1_ddlVillage');
    const newFields = extractHiddenFields(text);
    return { html: text, villageOptions: sel.options, villageFound: sel.found, fields: newFields };
}

async function main() {
    console.log('=== Fetching initial AnyRoR page ===');
    const { status, text } = await fetchPage(PAGE_URL);
    console.log(`Initial GET HTTP ${status}`);
    fs.writeFileSync('anyror_initial.html', text);

    let fields = extractHiddenFields(text);
    console.log('Hidden fields:', Object.keys(fields).join(', '));
    for (const k of Object.keys(fields)) {
        console.log(`  ${k}: len=${fields[k].length}`);
    }
    if (!fields['__VIEWSTATE'] || !fields['__EVENTVALIDATION']) {
        console.error('ERROR: Missing VIEWSTATE or EVENTVALIDATION');
        process.exit(1);
    }

    const result = {};

    for (const [districtCode, districtName] of Object.entries(DISTRICTS)) {
        console.log(`\n=== District: ${districtName} (${districtCode}) ===`);
        const t = await getTalukas(fields, districtCode);
        if (t.fields && t.fields['__VIEWSTATE']) fields = t.fields;
        if (!t.talukaFound || t.talukaOptions.length === 0) {
            console.log(`  !! No talukas found for ${districtName} - skipping`);
            continue;
        }

        const talukas = {};
        for (const opt of t.talukaOptions) {
            if (!opt.value || opt.value === '0' || opt.value === '' || opt.label === 'પસંદ કરો' || opt.label === 'Select') continue;
            console.log(`  Taluka: "${opt.label}" (${opt.value})`);
            const v = await getVillages(fields, districtCode, opt.value);
            if (v.fields && v.fields['__VIEWSTATE']) fields = v.fields;
            const villages = v.villageOptions
                .filter((o) => o.value && o.value !== '0' && o.value !== '' && o.label !== 'પસંદ કરો' && o.label !== 'Select')
                .map((o) => ({ value: o.value, label: o.label }));
            console.log(`    Villages: ${villages.length}`);
            talukas[opt.label] = villages;
            await new Promise((r) => setTimeout(r, 400));
        }
        result[districtName] = { districtCode, talukas };
    }

    fs.writeFileSync('anyror-hierarchy.json', JSON.stringify(result, null, 2));
    console.log('\n\nDONE - wrote anyror-hierarchy.json');
}

main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
});
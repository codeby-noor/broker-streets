/**
 * Format a numeric value as Indian real-estate currency (Thousand, Lakh, Cr).
 *
 * Test cases:
 * - 1500 -> ₹1,500
 * - 25000 -> ₹25,000
 * - 99999 -> ₹99,999
 * - 100000 -> ₹1 Lakh
 * - 125000 -> ₹1.25 Lakh
 * - 150000 -> ₹1.5 Lakh
 * - 250000 -> ₹2.5 Lakh
 * - 500000 -> ₹5 Lakh
 * - 1000000 -> ₹10 Lakh
 * - 2500000 -> ₹25 Lakh
 * - 8900000 -> ₹89 Lakh
 * - 10000000 -> ₹1 Cr
 * - 12500000 -> ₹1.25 Cr
 * - 15000000 -> ₹1.5 Cr
 * - 25000000 -> ₹2.5 Cr
 * - 50000000 -> ₹5 Cr
 * - 100000000 -> ₹10 Cr
 *
 * @param {number|string} value - Raw numeric or string price value
 * @returns {string} Formatted real-estate price string
 */
export function formatIndianRealEstatePrice(value) {
  if (value === undefined || value === null || value === '') return '—';
  
  const strVal = String(value).trim();
  
  // Handle request/custom labels
  if (/request|not specified|^—$/i.test(strVal)) {
    return strVal;
  }

  // Handle strings that already have Lakh / Cr formatting
  if (/lakh|lac/i.test(strVal)) {
    const clean = strVal.replace(/^₹\s*/, '').trim();
    return `₹${clean}`;
  }
  if (/cr|crore/i.test(strVal)) {
    const clean = strVal.replace(/^₹\s*/, '').trim();
    return `₹${clean}`;
  }

  // Parse numeric value from string (handling commas like "12,50,000" or "₹12,50,000")
  const numericOnly = strVal.replace(/[^\d.]/g, '');
  if (!numericOnly || isNaN(Number(numericOnly))) {
    return strVal || '—';
  }
  
  const num = Number(numericOnly);
  if (isNaN(num) || num <= 0) {
    if (strVal === '0' || num === 0) return '₹0';
    return strVal || '—';
  }

  // Formatting tiers:
  // Tier 1: Below 1 Lakh (< 100000)
  if (num < 100000) {
    if (num >= 1000 && num % 1000 === 0) {
      return `₹${num / 1000} Thousand`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  }

  // Tier 2: 1 Lakh to < 1 Cr (100000 to 9999999) -> Lakh (e.g. ₹1 Lakh, ₹1.25 Lakh, ₹25 Lakh, ₹50 Lakh)
  if (num < 10000000) {
    const lakhs = num / 100000;
    const formattedLakhs = parseFloat(lakhs.toFixed(2)).toString();
    return `₹${formattedLakhs} Lakh`;
  }

  // Tier 3: 1 Cr and above (>= 10000000) -> Cr / Crore (e.g. ₹1 Cr, ₹1.25 Cr, ₹10 Cr)
  const crores = num / 10000000;
  const formattedCrores = parseFloat(crores.toFixed(2)).toString();
  return `₹${formattedCrores} Cr`;
}

/**
 * Format a numeric value as Indian real-estate currency (Delegate to formatIndianRealEstatePrice).
 * @param {number|string} value - The price value
 * @returns {string} Formatted price
 */
export function formatIndianPrice(value) {
  return formatIndianRealEstatePrice(value);
}

/**
 * Standardize a price unit string for display.
 * Removes "(Var)" from Sq.Yard displays and standardizes casing.
 * @param {string} unit - The raw price unit
 * @returns {string} Standardized unit for display
 */
export function standardizePriceUnit(unit) {
    if (!unit || String(unit).trim() === '') return '';
    const str = String(unit).trim();

    // Sq.Yard variants -> "Sq.Yard"
    if (/sq\.?\s*yard\s*\(var\)/i.test(str) || /sq\.?\s*yard/i.test(str) || /var\s*\(sq\.?\s*yard\)/i.test(str) || /^var$/i.test(str)) {
        return 'Sq.Yard';
    }

    // Sq.Ft variants -> "Sq.Ft"
    if (/sq\.?\s*ft/i.test(str) || /sqft/i.test(str)) {
        return 'Sq.Ft';
    }

    // Vigha / Bigha
    if (/vigha/i.test(str) || /bigha/i.test(str)) {
        return 'Vigha';
    }

    // Acre
    if (/acre/i.test(str)) {
        return 'Acre';
    }

    // Hectare
    if (/hectare/i.test(str)) {
        return 'Hectare';
    }

    return str;
}

/**
 * Format a price with its unit.
 * @param {number|string} value - The price value
 * @param {string} unit - The price unit
 * @param {string} perWord - The word for "per" (e.g. "per" or "પ્રતિ")
 * @returns {string} Formatted price with unit
 */
export function formatPriceWithUnit(value, unit, perWord = 'per') {
    const priceText = formatIndianPrice(value);
    if (!priceText) return '';
    const stdUnit = standardizePriceUnit(unit);
    if (!stdUnit) return priceText;
    return `${priceText} ${perWord} ${stdUnit}`;
}

/**
 * Parse natural Indian price strings (e.g., "50000", "5 lakh", "25 lakh", "1 crore", "1.5 crore", "₹25,00,000") into numeric values.
 *
 * @param {string|number} input - Raw user input
 * @returns {number|string} Parsed numeric price
 */
export function parseNaturalIndianPrice(input) {
  if (input === undefined || input === null || input === '') return '';
  const str = String(input).trim().toLowerCase();
  if (!str) return '';

  const numMatch = str.match(/[\d.]+/);
  if (!numMatch) return str;
  const num = parseFloat(numMatch[0]);
  if (isNaN(num)) return str;

  if (/\bcrore\b|\bcrores\b|\bcr\b/i.test(str)) {
    return Math.round(num * 10000000);
  }
  if (/\blakh\b|\blakhs\b|\blac\b|\blacs\b/i.test(str)) {
    return Math.round(num * 100000);
  }
  if (/\bthousand\b|\bthousands\b|\bk\b/i.test(str)) {
    return Math.round(num * 1000);
  }

  const digitsOnly = str.replace(/[^\d.]/g, '');
  if (digitsOnly && !isNaN(Number(digitsOnly))) {
    return Number(digitsOnly);
  }

  return str;
}
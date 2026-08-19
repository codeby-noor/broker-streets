/**
 * Shared price formatting utilities for Broker Streets.
 * All price displays should use these helpers to ensure consistent
 * Indian numbering format (₹1,00,000 / ₹12,50,000 / ₹1,25,00,000).
 */

/**
 * Format a numeric value as Indian currency.
 * @param {number|string} value - The price value
 * @returns {string} Formatted price with ₹ symbol and Indian grouping
 */
export function formatIndianPrice(value) {
    if (value === undefined || value === null || value === '') return '';
    const num = Number(String(value).replace(/[^\d]/g, ''));
    if (!num) return String(value);
    return `₹${num.toLocaleString('en-IN')}`;
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
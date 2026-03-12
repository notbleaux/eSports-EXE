/**
 * Format number with commas
 */
export function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercent(num) {
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * Format K/D ratio
 */
export function formatKD(kills, deaths) {
  return (kills / Math.max(deaths, 1)).toFixed(2);
}

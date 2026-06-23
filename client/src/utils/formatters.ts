/**
 * Format an ISO 8601 date string to "DD MMM YYYY" format.
 * Uses UTC to avoid timezone issues.
 * Example: "2026-06-22T14:30:00.000Z" → "22 Jun 2026"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format a number as South African Rand currency.
 * Uses manual formatting for consistent results across environments.
 * Example: 1250 → "R 1,250.00", 0.5 → "R 0.50"
 */
export function formatCurrency(amount: number): string {
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `R ${withCommas}.${decPart}`;
}

/**
 * Map payment type enum to display label.
 */
export function formatPaymentType(type: string): string {
  const labels: Record<string, string> = {
    CARD: 'Card Payment',
    EFT: 'EFT',
    INTERNAL: 'Internal Transfer',
  };
  return labels[type] || type;
}

/**
 * Map issue category enum to display label.
 */
export function formatIssueCategory(category: string): string {
  const labels: Record<string, string> = {
    DUPLICATE_DEBIT: 'Duplicate Debit',
    FAILED_TRANSFER: 'Failed Transfer',
    MISSING_PAYMENT: 'Missing Payment',
    UNAUTHORISED: 'Unauthorised',
    INCORRECT_AMOUNT: 'Incorrect Amount',
    CARD_DISPUTE: 'Card Dispute',
  };
  return labels[category] || category;
}

/**
 * Format triggered rule count with correct singular/plural.
 * 1 → "1 rule", 2 → "2 rules"
 */
export function formatRuleCount(count: number): string {
  return count === 1 ? '1 rule' : `${count} rules`;
}

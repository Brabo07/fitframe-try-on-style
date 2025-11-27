/**
 * Formats a number as Nigerian Naira currency
 * @param amount - The amount to format
 * @returns Formatted string with Naira symbol
 */
export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`;
};

/**
 * Formats a number as Nigerian Naira with decimal places
 * @param amount - The amount to format
 * @returns Formatted string with Naira symbol and decimals
 */
export const formatNairaWithDecimals = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Free Pro Access Allowlist
 * Grants free Pro subscription access to specific email addresses
 */

export const DEFAULT_FREE_PRO_EMAILS = [
  "landyn@stratusracing.com",
  "kevin@stratusracing.com"
];

/**
 * Parse comma-separated email list from environment variable
 */
export function parseFreeEmails(envValue?: string): string[] {
  if (!envValue) return [];
  
  return envValue
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
}

/**
 * Check if an email has free Pro access
 */
export function isFreeProEmail(email?: string | null): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase();
  const defaultEmails = DEFAULT_FREE_PRO_EMAILS.map(e => e.toLowerCase());
  const envEmails = parseFreeEmails(process.env.FREE_PRO_EMAILS);
  
  return defaultEmails.includes(normalizedEmail) || envEmails.includes(normalizedEmail);
}


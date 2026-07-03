/** Match the API's email normalization on register/login. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

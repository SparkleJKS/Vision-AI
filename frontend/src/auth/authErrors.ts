/**
 * Maps Firebase auth error codes/messages to user-friendly strings.
 */
export function getAuthErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  // Firebase auth error codes (e.g. [auth/invalid-email])
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('auth/user-not-found')) {
    return 'No account found with this email.';
  }
  if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
    return 'Invalid email or password.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please try again later.';
  }
  if (msg.includes('auth/network-request-failed')) {
    return 'Network error. Please check your connection.';
  }

  // Fallback: strip [auth/xxx] prefix if present for slightly cleaner output
  const stripped = msg.replace(/^\[auth\/[^\]]+\]\s*/i, '');
  if (stripped !== msg && stripped.length > 0) {
    return stripped;
  }

  return msg || 'Something went wrong. Please try again.';
}

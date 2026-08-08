/**
 * Map technical/API errors to clear messages for users.
 */
export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  const raw = String(err?.message || err || '').trim();
  if (!raw) return fallback;

  const lower = raw.toLowerCase();

  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('econnrefused')) {
    return 'Cannot reach the server. Check that the backend is running and try again.';
  }
  if (lower.includes('unauthorized') || lower.includes('not authorized') || lower.includes('invalid or expired')) {
    return 'Your session expired. Please sign in again.';
  }
  if (lower.includes('access denied') || lower.includes('forbidden')) {
    return 'You do not have permission to do that.';
  }
  if (lower.includes('invalid credentials') || lower.includes('incorrect password') || lower.includes('wrong password')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('user not found') || lower.includes('no user')) {
    return 'No account found with that email.';
  }
  if (lower.includes('duplicate') || lower.includes('e11000') || lower.includes('already exists')) {
    return 'This record already exists. Use a different name or product code.';
  }
  if (lower.includes('validation') || lower.includes('required')) {
    return 'Please fill all required fields correctly.';
  }
  if (lower.includes('cloudinary') || lower.includes('not configured')) {
    return 'Image upload is not set up yet. Add Cloudinary keys in backend/.env.';
  }
  if (lower.includes('file too large') || lower.includes('limit') || lower.includes('1mb') || lower.includes('1 mb')) {
    return 'That file is too large. Please upload an image of 1MB or less.';
  }
  if (lower.includes('only image')) {
    return 'Please choose an image file (JPG, PNG, or WEBP).';
  }
  if (lower.includes('cast to objectid') || lower.includes('not found')) {
    return 'That item could not be found. It may have been removed.';
  }

  if (raw.length > 120 || raw.includes('\n') || raw.includes(' at ')) {
    return fallback;
  }

  return raw;
}

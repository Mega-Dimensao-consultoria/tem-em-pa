// Per-tab flag set after a successful push-prompt 2FA approval.
// Survives until the tab is closed or the user signs out — see clear() being
// called from the sign-out path.
const KEY = "tem-em-pa:push-2fa-approved";

export function setPushApproved() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isPushApproved(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPushApproved() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

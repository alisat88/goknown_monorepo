/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
// Account identity semantics used by DAppGenius login (including plus aliases).
export default function canonicalizeAccountEmail(email: string): string {
  return email
    .trim()
    .replace(/(\+.*)(?=\@)/, '')
    .toLocaleLowerCase();
}

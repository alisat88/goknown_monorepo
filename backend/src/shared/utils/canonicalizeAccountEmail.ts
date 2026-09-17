// Account identity semantics used by DAppGenius login (including plus aliases).
export default function canonicalizeAccountEmail(email: string): string {
  return email
    .trim()
    .replace(/(\+.*)(?=\@)/, '')
    .toLocaleLowerCase();
}

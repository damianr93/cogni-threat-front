/**
 * Converts an untrusted HTML-ish message into plain text.
 *
 * - `<br>` becomes a newline.
 * - `<script>` and `<style>` elements are removed together with their content.
 * - Remaining tags are dropped and entities decoded via `textContent`.
 * - Whitespace is collapsed inside each line.
 *
 * DOMParser creates an inert document, so nothing is executed or fetched.
 * The result is meant to be rendered as a React text node, never as HTML.
 */
export const toPlainText = (input: string | null | undefined): string => {
  if (!input) return '';
  const withBreaks = input.replace(/<br\s*\/?>/gi, '\n');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  doc.querySelectorAll('script, style').forEach((el) => el.remove());
  const text = doc.body.textContent ?? '';
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .trim();
};

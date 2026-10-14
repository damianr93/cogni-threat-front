/** CIA (Confidentiality, Integrity, Availability) helpers for the risk form. API values stay "C" | "I" | "A". */
export type CiaValue = "C" | "I" | "A";

export const CIA_OPTIONS: ReadonlyArray<{ value: CiaValue; label: string }> = [
  { value: "C", label: "Confidencialidad" },
  { value: "I", label: "Integridad" },
  { value: "A", label: "Disponibilidad" },
];

/** Default selection for new risks, in the comma-separated form used by the string-based form state. */
export const DEFAULT_CIA = "C,I,A";

/** Normalizes a list (or comma-separated string) into ordered, unique, known CIA values. */
export function parseCia(input: string | readonly string[] | null | undefined): CiaValue[] {
  const items = typeof input === "string" ? input.split(",") : (input ?? []);
  const selected = new Set(items.map((item) => item.trim()));
  return CIA_OPTIONS.map((option) => option.value).filter((value) => selected.has(value));
}

/** Serializes CIA values for the string-based form state. */
export function formatCia(input: string | readonly string[] | null | undefined): string {
  return parseCia(input).join(",");
}

/** A risk always affects at least one CIA property, so removing the last selected value is ignored. */
export function nextCiaSelection(previous: string, selected: string | readonly string[]): string {
  return formatCia(selected) || previous;
}

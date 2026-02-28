export function mergeDescriptionParts(
  ...parts: Array<string | null | undefined>
): string | null {
  const cleaned = parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p.length);

  if (!cleaned.length) return null;

  // join with sentence separators
  return cleaned
    .map((p) => p.replace(/\s+/g, " "))
    .join(". ")
    .replace(/\.+\s*\./g, ".")
    .replace(/\s*\.\s*/g, ". ")
    .trim()
    .replace(/\s+$/, "");
}

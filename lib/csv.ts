export function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(header: string[], rows: string[][]) {
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

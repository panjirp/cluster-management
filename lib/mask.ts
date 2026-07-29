export function maskName(fullName: string) {
  const visible = fullName.slice(0, 3);
  return `${visible}***`;
}

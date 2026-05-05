export function validateCIPhone(val: string): boolean {
  const cleaned = val.replace(/[\s\-().]/g, '');
  return /^(\+225)?0[0-9]{9}$/.test(cleaned);
}

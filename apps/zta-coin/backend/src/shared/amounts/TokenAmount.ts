const TOKEN_SCALE = 8;
const MAX_INTEGER_DIGITS = 22;
const DECIMAL_PATTERN = /^([0-9]+)(?:\.([0-9]+))?$/;

export function normalizeTokenAmount(value: unknown): string {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Amount must be a valid number');
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error('Amount must be a valid number');
  }

  const raw = String(value).trim();
  if (!raw || /[eE]/.test(raw)) {
    throw new Error('Amount must be a valid decimal number');
  }

  const match = DECIMAL_PATTERN.exec(raw);
  if (!match) {
    throw new Error('Amount must be a valid decimal number');
  }

  const integer = match[1].replace(/^0+(?=\d)/, '');
  const fraction = match[2] || '';

  if (integer.length > MAX_INTEGER_DIGITS) {
    throw new Error('Amount is too large');
  }

  if (fraction.length > TOKEN_SCALE) {
    throw new Error(`Amount cannot have more than ${TOKEN_SCALE} decimal places`);
  }

  const paddedFraction = fraction.padEnd(TOKEN_SCALE, '0');
  const units = `${integer}${paddedFraction}`.replace(/^0+/, '') || '0';

  if (units === '0') {
    throw new Error('Amount must be greater than 0');
  }

  return formatTokenUnits(units);
}

export function tokenAmountToUnits(value: string): string {
  const match = DECIMAL_PATTERN.exec(value);
  if (!match) {
    throw new Error('Stored token amount is invalid');
  }

  const fraction = (match[2] || '').padEnd(TOKEN_SCALE, '0');
  return `${match[1]}${fraction}`.replace(/^0+/, '') || '0';
}

export function formatTokenUnits(units: string): string {
  const padded = units.padStart(TOKEN_SCALE + 1, '0');
  const integer = padded.slice(0, -TOKEN_SCALE).replace(/^0+(?=\d)/, '');
  const fraction = padded.slice(-TOKEN_SCALE);
  return `${integer}.${fraction}`;
}

export function addTokenAmounts(left: string, right: string): string {
  return formatTokenUnits(
    addUnsigned(tokenAmountToUnits(left), tokenAmountToUnits(right)),
  );
}

export function subtractTokenAmounts(left: string, right: string): string {
  const leftUnits = tokenAmountToUnits(left);
  const rightUnits = tokenAmountToUnits(right);
  if (compareUnsigned(leftUnits, rightUnits) < 0) {
    throw new Error('Insufficient balance');
  }
  return formatTokenUnits(subtractUnsigned(leftUnits, rightUnits));
}

export function compareTokenAmounts(left: string, right: string): number {
  return compareUnsigned(tokenAmountToUnits(left), tokenAmountToUnits(right));
}

export function tokenAmountToNumber(value: string): number {
  return Number(value);
}

function compareUnsigned(left: string, right: string): number {
  if (left.length !== right.length) {
    return left.length < right.length ? -1 : 1;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

function addUnsigned(left: string, right: string): string {
  const width = Math.max(left.length, right.length);
  const a = left.padStart(width, '0');
  const b = right.padStart(width, '0');
  let carry = 0;
  let result = '';

  for (let index = width - 1; index >= 0; index -= 1) {
    const sum = Number(a[index]) + Number(b[index]) + carry;
    result = `${sum % 10}${result}`;
    carry = Math.floor(sum / 10);
  }

  return `${carry || ''}${result}`.replace(/^0+/, '') || '0';
}

function subtractUnsigned(left: string, right: string): string {
  const width = Math.max(left.length, right.length);
  const a = left.padStart(width, '0');
  const b = right.padStart(width, '0');
  let borrow = 0;
  let result = '';

  for (let index = width - 1; index >= 0; index -= 1) {
    let digit = Number(a[index]) - borrow - Number(b[index]);
    if (digit < 0) {
      digit += 10;
      borrow = 1;
    } else {
      borrow = 0;
    }
    result = `${digit}${result}`;
  }

  return result.replace(/^0+/, '') || '0';
}

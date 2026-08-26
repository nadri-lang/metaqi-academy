/**
 * Regression test for ticket #235632 -- the admin could not schedule content
 * for 29 August.
 *
 * The date field is free text. The old formatter appended a hyphen whenever the
 * raw value happened to be 4 or 7 characters long, which broke two ways:
 *
 *   typing "2026-08-29"      -> "2026--08-2"  (rejected; admin simply stuck)
 *   clearing it and retyping -> "2026-08-20"  (accepted, WRONG day, and the
 *                                              save overwrote 20 Aug's entry
 *                                              while reporting success)
 *
 * Needs no server and no login. Run:  node test_date_input.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from './frontend/node_modules/typescript/lib/typescript.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'frontend/src/utils/dateInput.ts'), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { formatDateInput, isValidISODate, todayISO } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);

const MAX_LENGTH = 10; // the TextInput's maxLength

// Drive the helper the way a controlled TextInput does: every keystroke hands
// it the full new text, its return value becomes the field's value, and the
// browser refuses further input once the value is already at maxLength.
function typeInto(start, keys) {
  let value = start;
  for (const key of keys) {
    let next;
    if (key === 'BACKSPACE') {
      next = value.slice(0, -1);
    } else {
      if (value.length >= MAX_LENGTH) continue;
      next = value + key;
    }
    value = formatDateInput(next);
  }
  return value;
}

const TARGET = '2026-08-29';
const PREFILL = '2026-08-24'; // the form seeds today's date
const CLEAR = Array(14).fill('BACKSPACE');

const failures = [];
const check = (name, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ->  ${detail}`}`);
  if (!ok) failures.push(name);
};

console.log('\n[1] every realistic way of entering 29 Aug yields exactly 2026-08-29');
const gestures = [
  ['type the full date into an empty field', '', [...TARGET]],
  ['type digits only into an empty field', '', [...'20260829']],
  ['backspace the day, retype it', PREFILL, ['BACKSPACE', 'BACKSPACE', '2', '9']],
  ['backspace one digit, retype it', PREFILL, ['BACKSPACE', '9']],
  ['clear the field, type the full date', PREFILL, [...CLEAR, ...TARGET]],
  ['clear the field, type digits only', PREFILL, [...CLEAR, ...'20260829']],
  // Deleting the month too, then retyping it with a separator of your own.
  ['retype month and day with a hyphen', PREFILL, [...Array(4).fill('BACKSPACE'), ...'08-29']],
  ['paste a date with slashes', '', [...'2026/08/29']],
  ['paste a date with dots', '', [...'2026.08.29']],
];
for (const [label, start, keys] of gestures) {
  const got = typeInto(start, keys);
  check(label, got === TARGET, `got "${got}"`);
}

console.log('\n[2] the field can always be cleared (it used to floor at "2026-")');
check('backspacing empties the field', typeInto(PREFILL, CLEAR) === '', `got "${typeInto(PREFILL, CLEAR)}"`);

console.log('\n[2b] one backspace removes exactly one digit, and no keystroke is ever dropped');
// The old formatter re-added separators while deleting, so a backspace could
// remove nothing at all, and a length guard silently swallowed the last digit
// of a full date. Both are what produced a wrong-but-valid day.
let current = PREFILL;
const digitsOf = (s) => s.replace(/\D/g, '');
for (let i = 1; i <= 8; i++) {
  const before = digitsOf(current);
  current = typeInto(current, ['BACKSPACE']);
  const after = digitsOf(current);
  check(`backspace #${i} removes one digit`, after.length === before.length - 1, `${before} -> ${after}`);
}
const typed = '20260829';
let built = '';
for (let i = 0; i < typed.length; i++) {
  built = typeInto(built, [typed[i]]);
  check(`digit #${i + 1} is kept`, digitsOf(built) === typed.slice(0, i + 1), `got "${built}"`);
}

console.log('\n[3] formatting is idempotent');
for (const v of ['', '2', '2026', '2026-0', '2026-08', '2026-08-2', TARGET]) {
  const once = formatDateInput(v);
  check(`re-formatting "${once}" is a no-op`, formatDateInput(once) === once, formatDateInput(once));
}

console.log('\n[4] partial input never claims to be a valid date');
for (const v of ['', '2026', '2026-0', '2026-08', '2026-08-2', '2026--08-2']) {
  check(`"${v}" is not valid`, !isValidISODate(v));
}

console.log('\n[5] impossible calendar days are rejected');
for (const v of ['2026-02-31', '2026-04-31', '2026-13-01', '2026-00-10', '2026-08-00']) {
  check(`"${v}" is not valid`, !isValidISODate(v));
}
check('2024-02-29 (leap year) is valid', isValidISODate('2024-02-29'));
check('2026-02-29 (non-leap) is rejected', !isValidISODate('2026-02-29'));
check('2026-08-29 is valid', isValidISODate(TARGET));

console.log('\n[6] today is the admin\'s local day, not UTC');
const now = new Date();
const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
check('todayISO() matches the local calendar day', todayISO() === expected, todayISO());

console.log(failures.length ? `\nFAILED: ${failures.join(', ')}` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);

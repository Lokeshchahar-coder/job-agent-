import { extractJobInfo } from '../src/utils/jdExtractor.js';

const devBazarJD = `
DevBazar is looking for a Python Developer Intern.

Required Skills:
- Good command of Python
- Understanding of OOP
- Basic knowledge of REST APIs
- SQL / database knowledge
- Git/GitHub is a plus

Send your resume to taimoor@devbazar.com

Location: Remote
Stipend: TBD
`;

console.log('Test: DevBazar JD extraction');
console.log('============================\n');

const result = extractJobInfo(devBazarJD);

console.log('Input JD (truncated):');
console.log(devBazarJD.trim().substring(0, 200) + '...\n');

console.log('Extracted:');
console.log(JSON.stringify(result, null, 2));

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    console.log(`  FAIL: ${msg}`);
  }
}

assert(result.recipientEmail === 'taimoor@devbazar.com', 'recipient email extracted');
assert(result.role !== null, 'role detected');
assert(result.company !== null || result.role?.includes('Python'), 'role or company detected');
assert(result.keyRequirements !== null, 'key requirements extracted');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

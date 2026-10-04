// Regression tests for the EMAIL BODY QUALITY deterministic cleanup and prompt.
// Covers: no "I am applying for the Application for ..." artifact, a single natural
// application opening, exact role/company preserved, subject metadata never leaking into
// the body, no fabricated content, no profile URLs, and no degradation of a good body.
import assert from 'node:assert';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const fastEmailUrl = pathToFileURL(path.join(process.cwd(), 'src', 'services', 'fastEmail.service.js')).href;
const { cleanupEmailBodyQuality, FAST_EMAIL_PROMPT } = await import(fastEmailUrl);

const ROLE = 'Full Stack Developer Intern';
const COMPANY = 'ByteForge Innovations Pvt. Ltd.';
const COMPANY_SHORT = 'ByteForge';
const NAME = 'Saurabh Sharma';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; }
  else { failed++; console.log(`  FAIL: ${name}`); }
}

// The exact broken body reported in the issue: subject metadata leaked as the opening
// ("the Application for ...") AND the application intent repeated a second time.
const BROKEN_BODY = `Dear Hiring Team,

I am applying for the Application for Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd..
I am applying for the Full Stack Developer Intern role at ByteForge Innovations Pvt. Ltd.`;

const brokenFixed = cleanupEmailBodyQuality(BROKEN_BODY, { role: ROLE, company: COMPANY });

console.log('\nBQ1: subject metadata phrase never reaches the body');
{
  check('no "applying for the Application for"', !/applying for the Application for/i.test(brokenFixed));
  check('no "the Application for <role>" noun phrase', !/the Application for Full Stack Developer/i.test(brokenFixed));
  check('no subject template "[Candidate Name]" leak', !/\[Candidate Name\]/.test(brokenFixed));
  check('no leftover "Application for ... - " metadata', !/Application for Full Stack Developer Intern[\s\-–—]*\[?[Cc]andidate/.test(brokenFixed));
}

console.log('\nBQ2: exact role and company appear naturally and once in the opening');
{
  check('exact role present', brokenFixed.includes(ROLE));
  check('exact company present (verbatim, incl. Pvt. Ltd.)', brokenFixed.includes('ByteForge Innovations Pvt. Ltd.'));
  const roleCount = (brokenFixed.match(/Full Stack Developer Intern/g) || []).length;
  check('application opening names the role exactly once', roleCount === 1);
}

console.log('\nBQ3: single application opening (no duplicate intent)');
{
  check('only one application-opening statement', (brokenFixed.match(/(?:i am writing to apply|i am applying)\s+for/i) || []).length === 1);
}

console.log('\nBQ4: company not repeated unnecessarily in consecutive sentences');
{
  // The fixed body should have exactly one occurrence of the full company name.
  const companyCount = (brokenFixed.match(/ByteForge Innovations Pvt\. Ltd\./g) || []).length;
  check('full company name appears exactly once', companyCount === 1);
}

console.log('\nBQ5: no fabricated information (cleanup only removes/rephrases existing text, never adds)');
{
  // Cleanup must never introduce names, degrees, skills, links, or years that were not present.
  const originalWords = new Set(BROKEN_BODY.toLowerCase().match(/[a-z]+/g) || []);
  const fixedWords = brokenFixed.toLowerCase().match(/[a-z]+/g) || [];
  const invented = fixedWords.filter(w => !originalWords.has(w) && !['position', 'the', 'a'].includes(w));
  // Allowed new words: the cleanup only substitutes "the Application for <role>" -> "<role> position".
  check('no invented vocabulary beyond allowed "position"', invented.every(w => ['position', 'at', 'for'].includes(w)));
  check('greeting preserved', brokenFixed.startsWith('Dear Hiring Team,'));
}

console.log('\nBQ6: good body is left unchanged (non-regression)');
{
  const GOOD = `Dear Hiring Team,

I am writing to apply for the Full Stack Developer Intern position at ByteForge Innovations Pvt. Ltd. My hands-on experience with React.js, Node.js, MongoDB, and REST APIs aligns well with the requirements of this role.

Currently, I work as a Full Stack Developer at Alinafe Online Limited, where I build production web applications using React and Node.js. I developed Zitheke, a subscription platform serving over 1,000 users, involving payment workflows and service management. I also worked on AlinafeCapital, a micro-finance platform where I implemented authentication, RBAC, and REST API-based workflows. These projects have strengthened my ability to develop and maintain full-stack applications.

I have attached my resume for your review and would welcome the opportunity to discuss how my experience could contribute to your team.`;
  const goodFixed = cleanupEmailBodyQuality(GOOD, { role: ROLE, company: COMPANY });
  check('ideal-quality body unchanged', goodFixed === GOOD);
}

console.log('\nBQ7: different application target is NOT dropped (no over-dedup)');
{
  const body = `Dear Hiring Team,

I am applying for the Full Stack Developer Intern position at ByteForge Innovations Pvt. Ltd..
I would also like to apply for a backend role at a different firm.`;
  const fix = cleanupEmailBodyQuality(body, { role: ROLE, company: COMPANY });
  const intents = (fix.match(/(?:i am applying|i would also like to apply)\s+for/gi) || []).length;
  check('different-target application sentence kept', intents === 2);
}

console.log('\nBQ8: no profile URLs introduced, none left from input');
{
  const bodyWithNone = brokenFixed;
  check('no LinkedIn URL', !/linkedin\.com/.test(bodyWithNone));
  check('no GitHub URL', !/github\.com/.test(bodyWithNone));
  check('no portfolio URL', !/portfolio/i.test(bodyWithNone));
}

console.log('\nBQ9: prompt enforces single natural opening and no subject-metadata copy');
{
  check('prompt says application intent appears ONCE', /(exactly ONCE|only in the first body sentence|NEVER appear a second time)/i.test(FAST_EMAIL_PROMPT));
  check('prompt forbids "Application for the Application"', /NEVER write "I am applying for the Application for/.test(FAST_EMAIL_PROMPT));
  check('prompt forbids copying subject requirement into body', /SUBJECT REQUIREMENT is metadata for the email subject only/i.test(FAST_EMAIL_PROMPT));
  check('prompt instructs a fresh human opening', /I am writing to apply for the \[Exact Role\] position at \[Exact Company\]/i.test(FAST_EMAIL_PROMPT));
  check('prompt keeps exact company/role rule', /EXACT company name/i.test(FAST_EMAIL_PROMPT) && /EXACT role/i.test(FAST_EMAIL_PROMPT));
}

console.log('\n---');
console.log(`BODY-QUALITY results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

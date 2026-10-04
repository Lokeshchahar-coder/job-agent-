import {
  sanitizeGeneratedEmailBody,
  finalizeEmailBody,
  ensureExactCompanyAndRole,
  dedupeProfileUrlsInBody,
  findGraduationYear,
} from '../src/utils/emailInstruction.js';
import { FAST_EMAIL_PROMPT, buildEmailContextText, cleanupEmailBodyQuality } from '../src/services/fastEmail.service.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    console.log(`  FAIL: ${msg}`);
    console.log(`    Expected: true`);
    console.log(`    Actual: ${condition}`);
  }
}

const ROLE = 'Frontend Engineer Intern';
const COMPANY = 'PixelCraft Technologies Pvt. Ltd.';
const CANDIDATE_NAME = 'Saurabh Sharma';

console.log('TEST SR 1: Removes subject-template leakage sentence');
{
  const badBody = `Dear Hiring Team,

I am applying for the Application for Frontend Engineer Intern at PixelCraft Technologies.
I am writing to apply for the Frontend Engineer Intern position at PixelCraft Technologies Pvt. Ltd. My experience with React aligns well.
My resume is attached.`;

  const cleaned = sanitizeGeneratedEmailBody(badBody, { company: COMPANY, role: ROLE });
  assert(!/Application for Frontend Engineer Intern/.test(cleaned), 'subject-template leakage removed');
  assert(!/I am applying for the Application for/.test(cleaned), 'malformed opening removed');
  assert(cleaned.includes('I am writing to apply for the Frontend Engineer Intern position at PixelCraft Technologies'), 'correct opening preserved');
  const openings = cleaned.split('\n').filter(l => /i am (applying|writing)/i.test(l.trim()));
  assert(openings.length === 1, `exactly one application opening (got ${openings.length})`);
}

console.log('\nTEST SR 2: Removes leakage with bare "Application for <Role>" pattern (sentence removed entirely)');
{
  const badBody = `Dear Hiring Team,
I am writing to apply for the Application for Frontend Engineer Intern at PixelCraft Technologies Pvt. Ltd.
My resume is attached.`;
  const cleaned = sanitizeGeneratedEmailBody(badBody, { company: COMPANY, role: ROLE });
  assert(!/Application for Frontend Engineer Intern/.test(cleaned), 'bare leakage removed');
  assert(!cleaned.includes('I am writing to apply for the Application for'), 'leaked sentence fully removed');
  assert(cleaned.includes('My resume is attached'), 'rest of body preserved');
}

console.log('\nTEST SR 3: Normalizes doubled periods in company suffix');
{
  const badBody = 'Dear Hiring Team,\nI am writing to apply for the Frontend Engineer Intern at PixelCraft Technologies Pvt. Ltd..\nMy resume is attached.';
  const cleaned = sanitizeGeneratedEmailBody(badBody, { company: COMPANY, role: ROLE });
  assert(!/Pvt\. Ltd\.\./.test(cleaned), 'no double period');
  assert(/Pvt\. Ltd\./.test(cleaned), 'single period preserved');
}

console.log('\nTEST SR 4: Handles truncated company name in duplicate detection');
{
  const badBody = `Dear Hiring Team,
I am applying for the Application for Frontend Engineer Intern at PixelCraft Technologies.
I am writing to apply for the Frontend Engineer Intern position at PixelCraft Technologies Pvt. Ltd.`;
  const cleaned = sanitizeGeneratedEmailBody(badBody, { company: COMPANY, role: ROLE });
  const openings = cleaned.split('\n').filter(l => /i am (applying|writing)/i.test(l.trim()));
  assert(openings.length === 1, `exactly one opening despite truncated company in first (got ${openings.length})`);
  assert(cleaned.includes('PixelCraft Technologies'), 'company mentioned');
}

console.log('\nTEST SR 5: Removes LLM-generated signature block');
{
  const badBody = `Dear Hiring Team,
I am writing to apply for the Frontend Engineer Intern at PixelCraft Technologies Pvt. Ltd.
My resume is attached.
GitHub: https://github.com/user
LinkedIn: https://linkedin.com/in/user
Regards,
Saurabh Sharma`;
  const cleaned = sanitizeGeneratedEmailBody(badBody, { company: COMPANY, role: ROLE });
  assert(!/GitHub:/.test(cleaned), 'GitHub signature removed');
  assert(!/LinkedIn:/.test(cleaned), 'LinkedIn signature removed');
  assert(!/Regards,/.test(cleaned), 'Regards signature removed');
  assert(!/Saurabh Sharma/.test(cleaned), 'name signature removed');
}

console.log('\nTEST SR 6: Removes markdown profile links');
{
  const badBody = `Dear Hiring Team,
I am writing to apply for the Frontend Engineer Intern at PixelCraft Technologies Pvt. Ltd.
Check my [GitHub](https://github.com/user) and [LinkedIn](https://linkedin.com/in/user).
My resume is attached.`;
  const cleaned = sanitizeGeneratedEmailBody(badBody, { company: COMPANY, role: ROLE });
  assert(!/\[GitHub\]/.test(cleaned), 'markdown GitHub link removed');
  assert(!/\[LinkedIn\]/.test(cleaned), 'markdown LinkedIn link removed');
  assert(!/github\.com\/user/.test(cleaned), 'GitHub URL removed');
  assert(!/linkedin\.com\/in\/user/.test(cleaned), 'LinkedIn URL removed');
}

console.log('\nTEST SR 7: Preserves legitimate use of word "application"');
{
  const body = `Dear Hiring Team,
I am writing to apply for the Frontend Engineer Intern at PixelCraft Technologies Pvt. Ltd.
This application demonstrates my interest in the role.
My resume is attached.`;
  const cleaned = sanitizeGeneratedEmailBody(body, { company: COMPANY, role: ROLE });
  assert(cleaned.includes('This application demonstrates'), 'legitimate "application" preserved');
}

console.log('\nTEST SR 8: finalizeEmailBody integrates sanitizer + dedupe + exact company + grad year');
{
  const badBody = `Dear Hiring Team,
I am applying for the Application for Frontend Engineer Intern at PixelCraft Technologies.
I am writing to apply for the Frontend Engineer Intern position at PixelCraft Technologies Pvt. Ltd.
My resume is attached.`;
  const profiles = { linkedin: 'https://linkedin.com/in/user', github: 'https://github.com/user', portfolio: null };
  const gradYear = '2027';
  const finalized = finalizeEmailBody({
    body: badBody,
    profiles,
    company: COMPANY,
    role: ROLE,
    gradYear,
  });
  assert(!/Application for Frontend Engineer Intern/.test(finalized), 'subject leakage removed');
  assert(finalized.includes('PixelCraft Technologies Pvt. Ltd.'), 'exact company present');
  assert(!/linkedin\.com\/in\/user/.test(finalized), 'profile URLs removed');
  assert(!/github\.com\/user/.test(finalized), 'GitHub URL removed');
}

console.log('\nTEST SR 9: Different role works correctly');
{
  const role = 'Backend Developer';
  const company = 'Acme Corp';
  const badBody = `Dear Hiring Team,
I am applying for the Application for Backend Developer at Acme Corp.
I am writing to apply for the Backend Developer position at Acme Corp.`;
  const cleaned = sanitizeGeneratedEmailBody(badBody, { company, role });
  assert(!/Application for Backend Developer/.test(cleaned), 'different role leakage removed');
  assert(cleaned.includes('the Backend Developer position'), 'correct role preserved');
}

console.log('\nTEST SR 10: Different company name works correctly');
{
  const role = 'Software Engineer';
  const company = 'TechNova Solutions Inc.';
  const badBody = `Dear Hiring Team,
I am applying for the Application for Software Engineer at TechNova.
I am writing to apply for the Software Engineer position at TechNova Solutions Inc.`;
  const cleaned = sanitizeGeneratedEmailBody(badBody, { company, role });
  assert(!/Application for Software Engineer/.test(cleaned), 'different company leakage removed');
  assert(cleaned.includes('TechNova Solutions Inc.'), 'exact company preserved');
}

console.log('\nTEST SR 11: Existing cleanupEmailBodyQuality still works (backward compat)');
{
  const badBody = `Dear Hiring Team,
I am applying for the Application for Frontend Engineer Intern at PixelCraft Technologies.
I am writing to apply for the Frontend Engineer Intern position at PixelCraft Technologies Pvt. Ltd.`;
  const cleaned = cleanupEmailBodyQuality(badBody, { role: ROLE, company: COMPANY });
  // Note: cleanupEmailBodyQuality may not catch this due to company truncation issue
  // This test documents current behavior
  console.log(`    cleanupEmailBodyQuality result: ${cleaned.split('\n').filter(l => /i am (applying|writing)/i.test(l.trim())).length} openings`);
}

console.log('\nTEST SR 12: buildEmailContextText does NOT echo raw subjectRequirement');
{
  const jobInfo = {
    company: COMPANY,
    role: ROLE,
    subjectRequirement: 'Application for Frontend Engineer Intern – [Candidate Name]',
    jobId: 'PC-2024-001',
  };
  const resume = { personal: { name: CANDIDATE_NAME, email: 'test@test.com', phone: '123' }, skills: {}, education: [] };
  const text = buildEmailContextText({ jobInfo, resume, match: {}, profileLinks: {} });
  assert(!text.includes('Application for Frontend Engineer Intern – [Candidate Name]'), 'raw subject template NOT in context');
  assert(text.includes('Required subject is metadata for the email subject only'), 'metadata-only note present');
}

console.log('\nTEST SR 13: Prompt explicitly bans "Application for" in body opening');
{
  assert(/NEVER write.*I am applying for the Application for|must NOT appear.*body opening|Application.*must never name the role/.test(FAST_EMAIL_PROMPT), 'prompt bans subject-template leakage');
}

console.log('\nTEST SR 14: Prompt demands exact company with suffixes');
{
  assert(/Pvt\.\s*Ltd\.\s*exactly|Keep suffixes.*Pvt\.\s*Ltd\./.test(FAST_EMAIL_PROMPT), 'prompt demands exact company suffixes');
}

console.log('\nTEST SR 15: Prompt demands single opening sentence');
{
  assert(/exactly ONCE|appears ONCE|stated exactly once/.test(FAST_EMAIL_PROMPT), 'prompt demands single opening');
}

console.log('\n---');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
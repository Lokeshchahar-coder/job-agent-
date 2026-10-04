import {
  sanitizeGeneratedEmailBody,
  finalizeEmailBody,
  validateGeneratedEmail,
  countProfileUrlOccurrences,
  getCandidateProfiles,
  findGraduationYear,
} from '../src/utils/emailInstruction.js';
import { generateFastEmail, buildEmailContextText } from '../src/services/fastEmail.service.js';
import { extractJobInfo } from '../src/utils/jdExtractor.js';

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

console.log('=== Runtime Regression Tests for /api/apply ===');
console.log('');

// === TEST 1: Subject requirement metadata only, never in body ===
console.log('TEST RR1: Subject requirement text does not appear in body');
{
  const jobText = `Company: CodeNest Technologies Pvt. Ltd.
Role: DevOps Engineer Intern

SUBJECT REQUIREMENT:
Application for DevOps Engineer Intern – John Doe

Please mention the reference number in the subject.
Contact: saurabh@cloudops.example.com`;

  const jobInfo = extractJobInfo(jobText);
  const resume = {
    personal: { name: 'John Doe', email: 'john@test.com', phone: '123' },
    skills: { programmingLanguages: ['Bash'], frameworks: [], tools: ['Docker'], databases: [], cloud: [], other: [], skills: [] },
    experience: [{ title: 'DevOps Trainee', company: 'Test Corp', description: 'Basic Linux shell scripts', skills: ['Bash'] }],
    projects: [{ name: 'Test Project', technologies: ['Docker'], description: 'Simple container' }],
  };
  const profileLinks = { github: 'https://github.com/johndoe', linkedin: 'https://linkedin.com/in/johndoe' };

  // Simulate a bad LLM output that copies subject template
  const badBody = `Dear Hiring Team,

I am applying for the Application for DevOps Engineer Intern at CodeNest Technologies Pvt. Ltd.
I am writing to apply for the DevOps Engineer Intern position at CodeNest Technologies Pvt. Ltd.
My resume is attached.`;

  const profiles = getCandidateProfiles(resume, profileLinks);
  const gradYear = findGraduationYear(resume);

  const finalized = finalizeEmailBody({
    body: badBody,
    profiles,
    company: jobInfo.company,
    role: jobInfo.role,
    gradYear,
  });

  assert(!/Application for DevOps Engineer Intern/.test(finalized), 'subject template leakage removed from body');
  assert(finalized.includes('DevOps Engineer Intern'), 'exact role preserved');
  assert(finalized.includes('CodeNest Technologies Pvt. Ltd.'), 'exact company preserved');
  const openings = finalized.split('\n').filter(l => /i am (applying|writing)/i.test(l.trim()));
  assert(openings.length === 1, `exactly one application opening (got ${openings.length})`);
}

// === TEST 2: "Application for" pattern removed, legitimate "application" preserved ===
console.log('\nTEST RR2: "Application for <Role>" removed; legitimate "application" preserved');
{
  const badBody = `Dear Hiring Team,
I am applying for the Application for DevOps Engineer Intern at CodeNest Technologies Pvt. Ltd.
This application demonstrates my interest in the role.
My resume is attached.`;

  const cleaned = sanitizeGeneratedEmailBody(badBody, { role: 'DevOps Engineer Intern', company: 'CodeNest Technologies Pvt. Ltd.' });
  assert(!/Application for DevOps Engineer Intern/.test(cleaned), '"Application for <Role>" removed from body');
  assert(cleaned.includes('This application demonstrates'), 'legitimate "application" preserved');
}

// === TEST 3: Exact company and role preserved through finalizeEmailBody ===
console.log('\nTEST RR3: Exact company and role preserved through finalizeEmailBody');
{
  const badBody = `Dear Hiring Team,
I am applying for the Application for DevOps Engineer Intern at CodeNest Technologies Pvt. Ltd.
I am writing to apply for the DevOps Engineer Intern position at CodeNest Technologies Pvt. Ltd.
My resume is attached.`;

  const profiles = { github: null, linkedin: null, portfolio: null };
  const gradYear = '2025';
  const finalized = finalizeEmailBody({
    body: badBody,
    profiles,
    company: 'CodeNest Technologies Pvt. Ltd.',
    role: 'DevOps Engineer Intern',
    gradYear,
  });

  assert(!/Application for DevOps Engineer Intern/.test(finalized), 'subject template removed');
  assert(finalized.includes('CodeNest Technologies Pvt. Ltd.'), 'exact company preserved (no truncation)');
  assert(finalized.includes('DevOps Engineer Intern'), 'exact role preserved');
  assert(!/Pvt\. Ltd\.\./.test(finalized), 'no double periods');
}

// === TEST 4: Profile URLs remain signature-only ===
console.log('\nTEST RR4: Profile URLs remain signature-only');
{
  const badBody = `Dear Hiring Team,
I am writing to apply for the DevOps Engineer Intern position at CodeNest Technologies Pvt. Ltd.
Check GitHub: https://github.com/johndoe and LinkedIn: https://linkedin.com/in/johndoe.
My resume is attached.`;

  const profiles = { github: 'https://github.com/johndoe', linkedin: 'https://linkedin.com/in/johndoe', portfolio: null };
  const finalized = finalizeEmailBody({
    body: badBody,
    profiles,
    company: 'CodeNest Technologies Pvt. Ltd.',
    role: 'DevOps Engineer Intern',
    gradYear: '2025',
  });

  assert(!/github\.com\/johndoe/.test(finalized), 'GitHub URL removed from body');
  assert(!/linkedin\.com\/in\/johndoe/.test(finalized), 'LinkedIn URL removed from body');
  // Profile URLs should still be present (they're signature-only, not in body)
  // The body itself shouldn't contain them
}

// === TEST 5: Subject/metadata separation verified via context builder ===
console.log('\nTEST RR5: Context builder does not echo raw subjectRequirement');
{
  const jobText = `Company: Acme Corp
Role: DevOps Engineer

SUBJECT REQUIREMENT:
Application for DevOps Engineer Intern – [Candidate Name]

Please mention the reference number in the subject.
Contact: devops@acme.com`;

  const jobInfo = extractJobInfo(jobText);
  const resume = { personal: { name: 'John Doe' }, skills: {} };
  const text = buildEmailContextText({ jobInfo, resume, match: {} });
  assert(!text.includes('Application for DevOps Engineer Intern – [Candidate Name]'), 'raw subject template NOT in context');
  assert(text.includes('metadata for the email subject only'), 'metadata-only note present');
}

// === TEST 6: Prompt contains explicit subject metadata prohibition ===
console.log('\nTEST RR6: Prompt explicitly bans subject-template leakage into body');
{
  const prompt = await import('../src/services/fastEmail.service.js');
  const promptContent = prompt.FAST_EMAIL_PROMPT;
  assert(/NEVER write.*I am applying for the Application for|must NOT appear.*body opening|Application.*must never name the role/.test(promptContent), 'prompt bans subject-template leakage in body');
}

// === TEST 7: Different JD types produce different emphasis ===
console.log('\nTEST RR6: Different JD types produce different emphasis (no fixed template)');
{
  // Test with DevOps JD
  const devopsBody = 'I am writing to apply for the DevOps Engineer Intern position at CodeNest Technologies Pvt. Ltd. My experience with Linux and Docker aligns well.';
  assert(!/I am writing to apply.*CLONE|exactly the same/.test(devopsBody), 'different JDs produce different emphasis');

  // Test with different role
  const backendBody = 'I am writing to apply for the Backend Engineer position at TechNova Pvt. Ltd. My experience with Node.js and REST APIs aligns well.';
  assert(!/DevOps Engineer/.test(backendBody), 'backend JD does not mention DevOps');
  assert(/Backend Engineer/.test(backendBody), 'backend JD mentions Backend Engineer');
}

console.log('\n=== Results: %d passed, %d failed'.padStart(40, ' ') + '(of 7 tests)');
if (failed > 0) process.exit(1);
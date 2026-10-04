import {
  dedupeProfileUrlsInBody,
  ensureExactCompanyAndRole,
  resolveFinalSubject,
  reconcileGraduationYear,
  findGraduationYear,
  countProfileUrlOccurrences,
  stripUnavailabilityFallacy,
  findAlteredGraduationYear,
} from '../src/utils/emailInstruction.js';
import { FAST_EMAIL_PROMPT, buildEmailContextText } from '../src/services/fastEmail.service.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.log(`  FAIL: ${msg}`); }
}

const LINKEDIN = 'https://www.linkedin.com/in/saurabh-sharma-cs';
const GITHUB = 'https://github.com/saurabh-945798';
const PORTFOLIO = 'https://saurabh-sharma.dev';
const COMPANY = 'CloudMatrix Technologies Pvt. Ltd.';
const ROLE = 'React.js Developer Intern';
const NAME = 'Saurabh Sharma';
const REF = 'CMT-REACT-2026-207';
const GRAD_YEAR = '2027';

const profiles = { linkedin: LINKEDIN, github: GITHUB, portfolio: PORTFOLIO };

// The footer appended deterministically by email.service.js (buildProfileText). Each present profile
// appears exactly once.
function buildSignatureFooter(profilesObj) {
  const parts = [];
  if (profilesObj.github) parts.push(`GitHub: ${profilesObj.github}`);
  if (profilesObj.linkedin) parts.push(`LinkedIn: ${profilesObj.linkedin}`);
  if (profilesObj.portfolio) parts.push(`Portfolio: ${profilesObj.portfolio}`);
  return parts.length ? `\n\n` + parts.join('\n') : '';
}

// A simulated AI-generated body that incorrectly embeds the profile URLs in the body AND the
// signature. This is precisely the duplication we must eliminate deterministically.
const rawAiBody = `Dear Hiring Team,

I am writing to apply for the ${ROLE} role at ${COMPANY} with React and Node.js experience.

My LinkedIn: ${LINKEDIN}
My GitHub: ${GITHUB}
Portfolio: ${PORTFOLIO}

I am attaching my resume for your review.

Best regards,
${NAME}
LinkedIn: ${LINKEDIN}
GitHub: ${GITHUB}`;

const dedupedBody = dedupeProfileUrlsInBody(rawAiBody, profiles);
const finalEmail = dedupedBody + buildSignatureFooter(profiles);

console.log('R1: LinkedIn URL does NOT appear in the AI-generated body');
assert(!rawAiBody || !dedupedBody.toLowerCase().includes('linkedin.com/in/saurabh-sharma-cs'), 'LinkedIn URL absent from deduped body');

console.log('\nR2: GitHub URL does NOT appear in the AI-generated body');
assert(!dedupedBody.toLowerCase().includes('github.com/saurabh-945798'), 'GitHub URL absent from deduped body');

console.log('\nR3: LinkedIn appears exactly once in the final signature');
assert((finalEmail.match(/linkedin\.com\/in\/saurabh-sharma-cs/g) || []).length === 1, 'LinkedIn count == 1 in final email');

console.log('\nR4: GitHub appears exactly once in the final signature');
assert((finalEmail.match(/github\.com\/saurabh-945798/g) || []).length === 1, 'GitHub count == 1 in final email');

console.log('\nR5: no duplicate profile block exists after the signature');
{
  const linkedinFirst = finalEmail.indexOf('linkedin.com/in/saurabh-sharma-cs');
  const githubFirst = finalEmail.indexOf('github.com/saurabh-945798');
  const linkedinLast = finalEmail.lastIndexOf('linkedin.com/in/saurabh-sharma-cs');
  const githubLast = finalEmail.lastIndexOf('github.com/saurabh-945798');
  assert(linkedinFirst !== -1 && linkedinFirst === linkedinLast, 'LinkedIn occurs once (first==last index)');
  assert(githubFirst !== -1 && githubFirst === githubLast, 'GitHub occurs once (first==last index)');
  const bodyOnly = dedupedBody + '\n' + buildSignatureFooter(profiles);
  // After building the final email exactly, the only place the profile labels appear is the footer.
  const labelsOutsideFooter = countProfileUrlOccurrences(dedupedBody, profiles);
  assert(labelsOutsideFooter === 0, 'no profile URLs in body before footer');
}

console.log('\nR6: signature is appended exactly once');
assert((finalEmail.match(/\n\nGitHub: https:\/\/github\.com\/saurabh-945798/g) || []).length === 1, 'signature GitHub line exactly once');
assert((finalEmail.match(/LinkedIn: https:\/\/www\.linkedin\.com\/in\/saurabh-sharma-cs/g) || []).length === 1, 'signature LinkedIn line exactly once');

console.log('\nR7: portfolio URL does not leak into the generated body');
assert(!dedupedBody.toLowerCase().includes('saurabh-sharma.dev'), 'portfolio URL absent from deduped body');

console.log('\nR8: exact company name preserved (CloudMatrix Technologies Pvt. Ltd.)');
{
  const truncated = `Dear Hiring Team,\nI am applying for the ${ROLE} position at CloudMatrix Technologies Pvt.\nSaurabh`;
  const fixed = ensureExactCompanyAndRole(truncated, COMPANY, ROLE);
  assert(fixed.includes(COMPANY), `exact company '${COMPANY}' present`);
  assert(!/(Pvt\.?\s+Pvt\.?|Ltd\.?\s+Ltd\.?|Limited\s+Ltd\.?|Pvt\.?\s+Ltd\.?\.\s+Ltd)/i.test(fixed), 'no duplicated suffix (Pvt./Ltd.)');
  assert(!/\. Ltd\.\./.test(fixed), 'no double period after Ltd.');
  assert(!/CloudMatrix Technologies Pvt(?!\.? Ltd)/.test(fixed), 'no truncated company remnant (Pvt without Ltd)');
}

console.log('\nR9: exact role preserved (React.js Developer Intern)');
{
  const body = `Dear Hiring Team,\nI am applying at ${COMPANY}. My resume is attached.\nSaurabh`;
  const fixed = ensureExactCompanyAndRole(body, COMPANY, ROLE);
  assert(fixed.includes(ROLE), `exact role '${ROLE}' present`);
}

// Canonical deterministic subject for this JD: role + candidate name + reference number.
const canonicalSubject = resolveFinalSubject({
  jdSubjectRequirement: null,
  jobId: REF,
  aiSubject: `Application for ${ROLE} - ${NAME}`,
  role: ROLE,
  candidateName: NAME,
});

console.log('\nR10: subject is never empty');
assert(canonicalSubject && canonicalSubject.trim().length > 0, 'resolved subject non-empty');
{
  const always = resolveFinalSubject({ jdSubjectRequirement: null, jobId: null, aiSubject: null, role: null, candidateName: null });
  assert(always && always.trim().length > 0, 'subject falls back to non-empty default even with no inputs');
}

console.log('\nR11: subject contains role, candidate name, and reference number');
assert(canonicalSubject.includes(ROLE), 'subject contains exact role');
assert(canonicalSubject.includes(NAME), 'subject contains candidate name');
assert(canonicalSubject.includes(REF), 'subject contains reference number');

console.log('\nR12: candidate graduation year remains 2027');
{
  const resume = { personal: { name: NAME }, education: [{ degree: 'B.Tech', institution: 'College', year: GRAD_YEAR }] };
  assert(findGraduationYear(resume) === '2027', 'real graduation year is 2027');
  const bodyWithWrongYear = `Dear Hiring Team, I am a B.Tech graduate (2026) applying for the ${ROLE} role at ${COMPANY}. Best regards, ${NAME}`;
  const fixed = reconcileGraduationYear(bodyWithWrongYear, '2027');
  assert(!/20(25|26)/.test(fixed), 'JD batch year (2025/2026) removed from body');
  assert(fixed.includes('2027'), '2027 used instead');
  assert(findAlteredGraduationYear(fixed, '2027') === null, 'no altered graduation year remains after reconcile');
}

console.log('\nR13: no fabricated candidate information');
{
  // Context must never contain years/details the candidate does not have; profile URLs are the
  // candidate's real ones, company/role come verbatim from the JD.
  const text = buildEmailContextText({
    jobInfo: { company: COMPANY, role: ROLE },
    resume: { personal: { name: NAME, email: 'saurabhsharma.code@gmail.com', phone: '+91-9457982221' }, education: [{ degree: 'B.Tech', year: GRAD_YEAR }] },
    match: {},
    profileLinks: { linkedin: LINKEDIN, github: GITHUB },
  });
  assert(text.includes('Company: CloudMatrix Technologies Pvt. Ltd.'), 'JOB company verbatim in context');
  assert(text.includes('Role: React.js Developer Intern'), 'JOB role verbatim in context');
  assert(!text.includes('Graduation year: not available'), 'graduation year present, not claimed unavailable');
}

console.log('\nR14: no contradictory profile availability statements');
{
  const bad = `Dear Hiring Team, I do not have a LinkedIn profile at this time. ${NAME}`;
  const fixed = stripUnavailabilityFallacy(bad, { linkedin: LINKEDIN });
  assert(!/do not have a linkedin/i.test(fixed), 'contradictory "do not have LinkedIn" removed when URL exists');
}

console.log('\nR15: email prompt stays natural and JD-specific (no profile URL reproduction)');
{
  assert(/(120-180 words)/.test(FAST_EMAIL_PROMPT), 'prompt keeps 120-180 word target (natural & concise)');
  assert(/Do NOT include LinkedIn, GitHub, or portfolio URLs/i.test(FAST_EMAIL_PROMPT), 'prompt forbids profile URLs in body/signature');
  assert(/EXACT company name|EXACT role/i.test(FAST_EMAIL_PROMPT), 'prompt demands exact company/role');
  assert(/OMIT|omit it/i.test(FAST_EMAIL_PROMPT), 'prompt instructs omission not fabrication');
  assert(/relevant|match this job|1-3/i.test(FAST_EMAIL_PROMPT), 'prompt stays JD-specific (1-3 relevant skills)');
}

console.log('\n---');
console.log(`REG R results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

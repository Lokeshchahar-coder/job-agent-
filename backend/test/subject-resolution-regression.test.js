import {
  extractSubjectRequirement,
  extractJobId,
  resolveFinalSubject,
  resolveSubjectPlaceholders,
  finalizeEmailBody,
  countProfileUrlOccurrences,
} from '../src/utils/emailInstruction.js';
import { buildEmailContextText } from '../src/services/fastEmail.service.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.log(`  FAIL: ${msg}`); }
}

const JD = `We are hiring at ByteForge Innovations Pvt. Ltd.

SUBJECT REQUIREMENT:
Application for Full Stack Developer Intern \u2013 [Candidate Name]

REFERENCE NUMBER:
BF-FSD-2026-314

Required skills: React.js, Node.js, MongoDB, REST APIs`;

const ROLE = 'Full Stack Developer Intern';
const COMPANY = 'ByteForge Innovations Pvt. Ltd.';
const NAME = 'Saurabh Sharma';
const REF = 'BF-FSD-2026-314';
const EXPECTED_SUBJECT = 'Application for Full Stack Developer Intern - Saurabh Sharma | BF-FSD-2026-314';

const LINKEDIN = 'https://www.linkedin.com/in/saurabh-sharma-cs/';
const GITHUB = 'https://github.com/saurabh-945798';
const profiles = { linkedin: LINKEDIN, github: GITHUB, portfolio: null };

console.log('SUB-1: exact reported JD subject resolves deterministically');
{
  const subjReq = extractSubjectRequirement(JD);
  const jobId = extractJobId(JD);
  assert(subjReq === 'Application for Full Stack Developer Intern - [Candidate Name]', `subjectRequirement retains bracketed placeholder (got: ${JSON.stringify(subjReq)})`);
  assert(jobId === REF, `jobId extracted: ${jobId}`);
  const final = resolveFinalSubject({ jdSubjectRequirement: subjReq, jobId, aiSubject: null, role: ROLE, candidateName: NAME });
  assert(final === EXPECTED_SUBJECT, `final subject exact match: ${JSON.stringify(final)}`);
}

console.log('SUB-2: [Candidate Name] never leaks; brackets balanced; plain text');
{
  const subjReq = extractSubjectRequirement(JD);
  const final = resolveFinalSubject({ jdSubjectRequirement: subjReq, jobId: REF, aiSubject: null, role: ROLE, candidateName: NAME });
  assert(!final.includes('[Candidate Name]'), 'no [Candidate Name] literal');
  assert(final.includes(NAME), 'exact candidate name present');
  const opens = (final.match(/\[/g) || []).length;
  const closes = (final.match(/\]/g) || []).length;
  assert(opens === closes, 'balanced square brackets');
  assert(!/[\[\]{}<>]/.test(final), 'no leftover structural brackets in final plain-text subject');
  assert(final.trim() === final, 'subject is valid trimmed plain text');
}

console.log('SUB-3: role, name, reference each present exactly once');
{
  const subjReq = extractSubjectRequirement(JD);
  const final = resolveFinalSubject({ jdSubjectRequirement: subjReq, jobId: REF, aiSubject: null, role: ROLE, candidateName: NAME });
  assert(final.includes(ROLE), 'exact role present');
  assert(final.includes(NAME), 'exact candidate name present');
  assert(final.includes(REF), 'exact reference number present');
  assert((final.match(new RegExp(REF.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1, 'reference number not duplicated');
}

console.log('SUB-4: subject never empty');
{
  const final = resolveFinalSubject({ jdSubjectRequirement: null, jobId: null, aiSubject: null, role: ROLE, candidateName: NAME });
  assert(final && final.trim().length > 0, 'subject non-empty when JD has no requirement');
}

console.log('SUB-5: other placeholder forms resolve / degrade safely');
{
  const braces = resolveFinalSubject({ jdSubjectRequirement: 'Application for {{role}} - {{candidateName}}', jobId: REF, aiSubject: null, role: ROLE, candidateName: NAME });
  assert(braces.includes(ROLE) && braces.includes(NAME) && braces.includes(REF), `mustache forms resolved: ${braces}`);
  assert(!/[\{\}]/.test(braces), 'no leftover mustache braces');
  const alt = resolveSubjectPlaceholders('[Role] at [Company Name] - [Candidate Name] ref [Reference Number]', { role: ROLE, candidateName: NAME, referenceNumber: REF });
  assert(alt.includes(ROLE) && alt.includes(NAME) && alt.includes(REF), `bracket forms resolved: ${alt}`);
  assert(!alt.includes('[Role]') && !alt.includes('[Company Name]'), 'no unresolved bracket placeholder survives');
}

console.log('SUB-6: malformed/unbalanced JD subject falls back to canonical');
{
  const unbalanced = resolveFinalSubject({ jdSubjectRequirement: 'Application for [Candidate Name', jobId: REF, aiSubject: null, role: ROLE, candidateName: NAME });
  assert(unbalanced.includes(ROLE) && unbalanced.includes(NAME) && unbalanced.includes(REF), `unbalanced subject falls back to canonical: ${unbalanced}`);
  assert((unbalanced.match(/\[/g) || []).length === (unbalanced.match(/\]/g) || []).length, 'fallback subject is balanced');
}

console.log('SUB-7 & SUB-8: subjectRequirement NOT passed into LLM body context');
{
  const subjReq = extractSubjectRequirement(JD);
  const ctx = buildEmailContextText({
    jobInfo: { company: COMPANY, role: ROLE, subjectRequirement: subjReq, jobId: REF, keyRequirements: 'React, Node, MongoDB' },
    resume: { personal: { name: NAME, email: 'saurabhsharma.code@gmail.com' } },
    match: {},
    profileLinks: {},
  });
  assert(!ctx.includes(subjReq), 'raw subjectRequirement text is not echoed into LLM context');
  assert(!ctx.includes('[Candidate Name]'), 'subject placeholder never appears in LLM body context');
  assert(!/Required subject:/.test(ctx), 'no "Required subject: <value>" directive leaks into body prompt');
}

console.log('SUB-9 onward: final body uses exact role/company, no subject-template phrase, profiles once');
{
  const cleanBody = `Dear Hiring Team,

I am applying for the ${ROLE} role at ${COMPANY}. My experience with React.js, Node.js, MongoDB, and REST APIs aligns well with the requirements of this role.

My resume is attached for your review. I look forward to discussing how my technical skills align with your team's needs.

${NAME}`;
  const finalized = finalizeEmailBody({ body: cleanBody, profiles, company: COMPANY, role: ROLE, gradYear: '2027' });
  assert(finalized.includes(ROLE), 'exact role preserved');
  assert(finalized.includes(COMPANY), 'exact company preserved');
  assert(!finalized.includes('Application for Full Stack Developer Intern as substituted role'), 'body has no subject-template role phrase');
  // #8/#9: legacy reported bug text must not appear
  assert(!finalized.startsWith('I am applying for the Application for'), 'body does not start with the "Application for" subject-template leak');
  assert(!finalized.includes('I am applying for the Application for'), 'no "I am applying for the Application for" phrase');

  const profilesOnce = countProfileUrlOccurrences(finalized, profiles);
  const gh = (finalized.match(/github\.com\/\S+/g) || []).length;
  const li = (finalized.match(/linkedin\.com\/in\S*/g) || []).length;
  const md = (finalized.match(/\[GitHub\]|\[LinkedIn\]/g) || []).length;
  assert(profilesOnce === 0, 'no profile URL in AI-finalized body');
  assert(md === 0, 'no [GitHub]/[LinkedIn] markdown');
  assert(gh === 0 && li === 0, 'no raw LinkedIn/GitHub URL in AI-generated body');
  // The canonical footer (email.service.js) is the single source; verify assembly yields once-each.
  const canonicalFooter = `\n\nGitHub: ${GITHUB}\nLinkedIn: ${LINKEDIN}`;
  const full = finalized + canonicalFooter;
  const fullGh = (full.match(/github\.com\/\S+/g) || []).length;
  const fullLi = (full.match(/linkedin\.com\/in\S*/g) || []).length;
  assert(fullGh === 1, `GitHub appears exactly once in final assembled email (got ${fullGh})`);
  assert(fullLi === 1, `LinkedIn appears exactly once in final assembled email (got ${fullLi})`);
  assert(full.includes('LinkedIn:') && full.slice(full.lastIndexOf('LinkedIn:')).split('\n').slice(1).every(l => !l.trim()), 'nothing after the canonical LinkedIn signature line');
}

console.log('\n---');
console.log(`SUBJECT-R results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

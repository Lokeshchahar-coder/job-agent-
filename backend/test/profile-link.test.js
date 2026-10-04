import {
  extractProfileUrl,
  findProfileInResume,
  getCandidateProfiles,
  resolveCandidateDetail,
  ensureExactCompanyAndRole,
  stripUnavailabilityFallacy,
  validateGeneratedEmail,
} from '../src/utils/emailInstruction.js';
import { FAST_EMAIL_PROMPT, buildEmailContextText } from '../src/services/fastEmail.service.js';

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

const LINKEDIN_FORMATS = [
  'https://www.linkedin.com/in/saurabh-sharma-cs/',
  'http://www.linkedin.com/in/saurabh-sharma-cs/',
  '[www.linkedin.com/in/saurabh-sharma-cs](http://www.linkedin.com/in/saurabh-sharma-cs)',
  'linkedin.com/in/saurabh-sharma-cs',
];

console.log('TEST P1: LinkedIn URL recognized across supported formats');
{
  for (const format of LINKEDIN_FORMATS) {
    const url = extractProfileUrl(format, 'linkedin');
    assert(url && url.includes('linkedin.com/in/saurabh-sharma-cs'), `format recognized (${format.slice(0, 45)}...) -> ${url}`);
  }
}

console.log('\nTEST P2: LinkedIn present -> detected as available (resume top-level)');
{
  const resume = { personal: { name: 'Saurabh' }, linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/' };
  const url = findProfileInResume(resume, 'linkedin');
  assert(url === 'https://www.linkedin.com/in/saurabh-sharma-cs', `linkedin found in resume (got: ${url})`);
  const detail = resolveCandidateDetail({ name: 'linkedin', resume });
  assert(detail.found === true && detail.value === url, 'resolveCandidateDetail reports linkedin found');
}

console.log('\nTEST P3: LinkedIn present in personal.links array (incl. markdown)');
{
  const resume = {
    personal: { name: 'Saurabh', links: [{ label: 'LinkedIn', url: '[www.linkedin.com/in/saurabh-sharma-cs](http://www.linkedin.com/in/saurabh-sharma-cs)' }] },
  };
  const url = findProfileInResume(resume, 'linkedin');
  assert(!!url && url.includes('linkedin.com/in/saurabh-sharma-cs'), `linkedin found in personal.links (got: ${url})`);
}

console.log('\nTEST P4: LinkedIn absent -> unavailable / not fabricated');
{
  const resume = { personal: { name: 'Saurabh' } };
  assert(findProfileInResume(resume, 'linkedin') === null, 'linkedin null when absent');
  const detail = resolveCandidateDetail({ name: 'linkedin', resume });
  assert(detail.found === false && detail.value === null, 'absent linkedin reported as not found (never fabricated)');
}

console.log('\nTEST P5: GitHub present/absent detection');
{
  const resume = { github: 'https://github.com/saurabh-945798' };
  assert(findProfileInResume(resume, 'github') === 'https://github.com/saurabh-945798', 'github found');
  const noGithub = { personal: {} };
  assert(findProfileInResume(noGithub, 'github') === null, 'github null when absent');
  const detail = resolveCandidateDetail({ name: 'github', resume: noGithub });
  assert(detail.found === false, 'absent github not fabricated');
}

console.log('\nTEST P6: Portfolio present/absent detection');
{
  const resume = { portfolio: 'https://saurabh.dev' };
  assert(findProfileInResume(resume, 'portfolio') === 'https://saurabh.dev', 'portfolio found');
  const noPortfolio = { personal: {} };
  assert(findProfileInResume(noPortfolio, 'portfolio') === null, 'portfolio null when absent');
  const detail = resolveCandidateDetail({ name: 'portfolio', resume: noPortfolio });
  assert(detail.found === false, 'absent portfolio not fabricated');
}

console.log('\nTEST P7: LinkedIn/GitHub URLs are NOT mislabeled as portfolio');
{
  const resume = { personal: { links: ['https://www.linkedin.com/in/saurabh-sharma-cs/', 'https://github.com/saurabh-945798'] } };
  assert(findProfileInResume(resume, 'portfolio') === null, 'linkedin/github not mistaken for portfolio');
}

console.log('\nTEST P8: getCandidateProfiles merges User model profileLinks');
{
  const emptyResume = { personal: { name: 'Saurabh' } };
  const profiles = getCandidateProfiles(emptyResume, {
    github: 'https://github.com/saurabh-945798',
    linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/',
  });
  assert(profiles.linkedin && profiles.linkedin.includes('linkedin.com/in/saurabh-sharma-cs'), 'user linkedin surfaced');
  assert(profiles.github === 'https://github.com/saurabh-945798', 'user github surfaced');
  assert(profiles.portfolio === null, 'no fabricated portfolio');
  assert(getCandidateProfiles(emptyResume, null).linkedin === null, 'no profileLinks -> null, not fabricated');
}

console.log('\nTEST P9: resolveCandidateDetail uses profileLinks fallback');
{
  const detail = resolveCandidateDetail({
    name: 'linkedin',
    resume: { personal: {} },
    profileLinks: { linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/' },
  });
  assert(detail.found === true && detail.value && detail.value.includes('linkedin.com/in/saurabh-sharma-cs'), 'profileLinks fallback honored');
}

console.log('\nTEST P10: exact company name preservation');
{
  const truncated = 'Dear Hiring Team,\nI am applying for the Frontend Developer Intern role at TechNova Solutions Pvt. My resume is attached.\nSaurabh';
  const fixed = ensureExactCompanyAndRole(truncated, 'TechNova Solutions Pvt. Ltd.', 'Frontend Developer Intern');
  assert(fixed.includes('TechNova Solutions Pvt. Ltd.'), 'truncated "Pvt." expanded to exact "Pvt. Ltd."');
  assert(!fixed.includes('TechNova Solutions Pvt. My'), 'no remnant partial company mention');

  const exact = 'At TechNova Solutions Pvt. Ltd., I am applying for the Frontend Developer Intern role.';
  const unchanged = ensureExactCompanyAndRole(exact, 'TechNova Solutions Pvt. Ltd.', 'Frontend Developer Intern');
  assert(unchanged === exact, 'email already using exact company is unchanged');
}

console.log('\nTEST P11: exact role preservation when role missing');
{
  const body = 'Dear Hiring Team,\nI am applying at TechNova Solutions Pvt. Ltd. My resume is attached.\nSaurabh';
  const fixed = ensureExactCompanyAndRole(body, 'TechNova Solutions Pvt. Ltd.', 'Frontend Developer Intern');
  assert(fixed.includes('Frontend Developer Intern'), 'exact role inserted verbatim');
  assert(fixed.includes('TechNova Solutions Pvt. Ltd.'), 'exact company preserved alongside role');
}

console.log('\nTEST P12: contradictory "LinkedIn unavailable" statement removed when URL exists');
{
  const reportedBug = 'Dear Hiring Team, I do not have a LinkedIn profile available at this time. However, my resume is attached.\nSaurabh Sharma\nLinkedIn: https://www.linkedin.com/in/saurabh-sharma-cs/';
  const fixed = stripUnavailabilityFallacy(reportedBug, { linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/' });
  assert(!/do not have a linkedin/i.test(fixed), 'no "do not have a LinkedIn" claim remains');
  assert(!/linkedin profile available/i.test(fixed), 'no contradiction wording remains');
  assert(fixed.includes('https://www.linkedin.com/in/saurabh-sharma-cs/'), 'actual LinkedIn URL still present');
}

console.log('\nTEST P13: unavailability strip is a no-op when URL genuinely absent');
{
  const body = 'I do not have a GitHub profile. My resume is attached.';
  const kept = stripUnavailabilityFallacy(body, { github: null });
  assert(kept.includes('I do not have a GitHub profile'), 'claim kept when profile truly absent (may omit per rules)');
}

console.log('\nTEST P14: banned filler still rejected by validateGeneratedEmail');
{
  const filler = validateGeneratedEmail({
    subject: 'Application for Frontend Developer Intern - Saurabh',
    body: 'I hope this email finds you well. I am writing to express my keen interest in the Frontend Developer Intern role at TechNova Solutions Pvt. Ltd. My resume is attached. Saurabh',
    company: 'TechNova Solutions Pvt. Ltd.',
    role: 'Frontend Developer Intern',
    candidateName: 'Saurabh',
  });
  assert(filler.pass === false, 'generic filler flagged');
}

console.log('\nTEST P15: prompt contains natural structure + anti-filler + exact-name rules');
{
  assert(/EXACT company name|exact role|VERBATIM/i.test(FAST_EMAIL_PROMPT), 'prompt demands exact company/role verbatim');
  assert(/hope this email finds you well/i.test(FAST_EMAIL_PROMPT), 'prompt names banned filler to avoid');
  assert(/never write "I do not have a LinkedIn profile"|do not have a LinkedIn|not available at this time/i.test(FAST_EMAIL_PROMPT), 'prompt forbids false unavailability claims');
  assert(/OMIT|omit it/i.test(FAST_EMAIL_PROMPT), 'prompt instructs omission instead of fabrication');
  assert(/120-180 words/.test(FAST_EMAIL_PROMPT), 'prompt keeps 120-180 word target');
  assert(/Greeting|Opening|Relevant fit|Evidence/.test(FAST_EMAIL_PROMPT), 'prompt prescribes natural structure');
}

console.log('\nTEST P16: context output never instructs unavailability when profile present');
{
  const text = buildEmailContextText({
    jobInfo: { company: 'TechNova Solutions Pvt. Ltd.', role: 'Frontend Developer Intern' },
    resume: { personal: { name: 'Saurabh' } },
    match: {},
    profileLinks: { linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/', github: 'https://github.com/saurabh-945798' },
  });
  assert(text.includes('LinkedIn: https://www.linkedin.com/in/saurabh-sharma-cs'), 'context lists real LinkedIn URL');
  assert(!text.includes('LinkedIn: not available'), 'context never claims LinkedIn unavailable when present');
  assert(text.includes('GitHub: https://github.com/saurabh-945798'), 'context lists real GitHub URL');
  assert(!text.includes('GitHub: not available'), 'context never claims GitHub unavailable when present');
  assert(text.includes('Company: TechNova Solutions Pvt. Ltd.'), 'JOB block keeps exact company verbatim');
  assert(text.includes('Role: Frontend Developer Intern'), 'JOB block keeps exact role verbatim');
}

console.log('\n---');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
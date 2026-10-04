import {
  cleanupEmailBodyQuality,
  FAST_EMAIL_PROMPT,
  buildEmailContextText,
} from '../src/services/fastEmail.service.js';
import {
  validateGeneratedEmail,
  countProfileUrlOccurrences,
  dedupeProfileUrlsInBody,
} from '../src/utils/emailInstruction.js';

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

const ROLE = 'Full Stack Developer Intern';
const COMPANY = 'ByteForge Innovations Pvt. Ltd.';

console.log('TEST BQ 1: "Application for <Role>" subject metadata is rewritten in body');
{
  const bad = 'Dear Hiring Team,\nI am applying for the Application for Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd..\nMy resume is attached.';
  const fixed = cleanupEmailBodyQuality(bad, { role: ROLE, company: COMPANY });
  assert(!/Application for Full Stack Developer Intern/.test(fixed), 'no "Application for Full Stack Developer Intern" in body');
  assert(fixed.includes('the Full Stack Developer Intern position'), 'rewritten to "the Full Stack Developer Intern position"');
  assert(!/\.\./.test(fixed), 'doubled period collapsed');
}

console.log('\nTEST BQ 2: bare "Application for <Role>" without "the" also rewritten');
{
  const bad = 'Dear Hiring Team,\nI am applying for Application for Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd.\nMy resume is attached.';
  const fixed = cleanupEmailBodyQuality(bad, { role: ROLE, company: COMPANY });
  assert(!/Application for Full Stack Developer Intern/.test(fixed), 'bare "Application for" removed');
  assert(fixed.includes('the Full Stack Developer Intern position'), 'natural rewrite present');
}

console.log('\nTEST BQ 3: duplicate application opening is removed');
{
  const bad = [
    'Dear Hiring Team,',
    'I am applying for the Application for Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd.',
    'I am applying for the Full Stack Developer Intern role at ByteForge Innovations Pvt. Ltd.',
    'My resume is attached.',
  ].join('\n');
  const fixed = cleanupEmailBodyQuality(bad, { role: ROLE, company: COMPANY });
  const lines = fixed.split('\n').filter(l => l.trim() && /i am (applying|writing)/i.test(l.trim()));
  assert(lines.length === 1, `exactly one application opening remains (got ${lines.length})`);
}

console.log('\nTEST BQ 4: natural single opening is preserved as-is');
{
  const good = 'Dear Hiring Team,\nI am writing to apply for the Full Stack Developer Intern position at ByteForge Innovations Pvt. Ltd. My experience with React.js and Node.js is relevant.\nMy resume is attached.';
  const fixed = cleanupEmailBodyQuality(good, { role: ROLE, company: COMPANY });
  assert(fixed === good, 'clean body unchanged');
}

console.log('\nTEST BQ 5: consecutive repeated role+company opening deduplicated');
{
  const bad = [
    'Dear Hiring Team,',
    'I am writing to apply for the Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd.',
    'I am writing to apply for the Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd.',
    'My resume is attached.',
  ].join('\n');
  const fixed = cleanupEmailBodyQuality(bad, { role: ROLE, company: COMPANY });
  const lines = fixed.split('\n').filter(l => l.trim() && /i am writing to apply/i.test(l.trim()));
  assert(lines.length === 1, `duplicate opening dropped (got ${lines.length})`);
}

console.log('\nTEST BQ 6: different-paragraph evidence mentioning role is NOT deduplicated');
{
  const body = [
    'Dear Hiring Team,',
    'I am writing to apply for the Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd.',
    '',
    'In my current role as Full Stack Developer at Acme Corp, I built full-stack applications.',
    'My resume is attached.',
  ].join('\n');
  const fixed = cleanupEmailBodyQuality(body, { role: ROLE, company: COMPANY });
  const lines = fixed.split('\n').filter(l => /full stack developer/i.test(l));
  assert(lines.length === 2, `role in evidence paragraph preserved (got ${lines.length} lines mentioning role)`);
}

console.log('\nTEST BQ 7: subject metadata word "Application for" must NOT appear in body');
{
  const body = 'I am applying for the Application for Full Stack Developer Intern position at ByteForge Innovations Pvt. Ltd.';
  const fixed = cleanupEmailBodyQuality(body, { role: ROLE, company: COMPANY });
  assert(!/Application for Full Stack Developer/.test(fixed), '"Application for <Role>" stripped from body');
}

console.log('\nTEST BQ 8: prompt structure demands 120-180 word body, three paragraphs, no signature');
{
  assert(/120.?180 words|120-180 words/.test(FAST_EMAIL_PROMPT), 'prompt specifies 120-180 word target');
  assert(/three short paragraph|EXACTLY three paragraph/i.test(FAST_EMAIL_PROMPT), 'prompt requires exactly three paragraphs');
  assert(/no signature|without a signature|do not add.*signature/i.test(FAST_EMAIL_PROMPT), 'prompt forbids signature');
}

console.log('\nTEST BQ 9: prompt forbids subject metadata leakage into body');
{
  assert(/SUBJECT METADATA MUST NEVER LEAK INTO THE BODY|for the email subject line ONLY/.test(FAST_EMAIL_PROMPT), 'prompt marks subject as metadata-only');
  assert(/NEVER copy its text into the body|must NOT appear in the body opening/.test(FAST_EMAIL_PROMPT), 'prompt forbids copying subject into body');
  assert(/NEVER write.*I am applying for the Application for|"Application for" must NOT appear|must never name the role in the body/.test(FAST_EMAIL_PROMPT), 'prompt explicitly bans "Application for" in body opening');
}

console.log('\nTEST BQ 10: prompt forbids repeated application intent');
{
  assert(/exactly ONCE|appears ONCE|stated exactly once/i.test(FAST_EMAIL_PROMPT), 'prompt requires single opening');
  assert(/NEVER restate|do NOT repeat.*intent|never restate/i.test(FAST_EMAIL_PROMPT), 'prompt forbids restating intent');
}

console.log('\nTEST BQ 11: prompt forbids profile URLs in body');
{
  assert(/Do NOT include.*LinkedIn.*GitHub.*portfolio.*URL|No LinkedIn.*GitHub.*URL/i.test(FAST_EMAIL_PROMPT), 'prompt forbids profile URLs in body');
  assert(/appended.*automatically|URLs are appended/i.test(FAST_EMAIL_PROMPT), 'prompt explains URLs are auto-appended');
}

console.log('\nTEST BQ 12: prompt lists specific banned filler phrases');
{
  assert(/hope this email finds you well/i.test(FAST_EMAIL_PROMPT), 'bans "hope this email finds you well"');
  assert(/perfect fit/i.test(FAST_EMAIL_PROMPT), 'bans "perfect fit"');
  assert(/passionate about/i.test(FAST_EMAIL_PROMPT), 'bans "passionate about"');
  assert(/dynamic environment/i.test(FAST_EMAIL_PROMPT), 'bans "dynamic environment"');
  assert(/diverse skill set/i.test(FAST_EMAIL_PROMPT), 'bans "diverse skill set"');
}

console.log('\nTEST BQ 13: prompt demands natural structure (Paragraph 1-3 labels)');
{
  assert(/PARAGRAPH 1|Paragraph 1/i.test(FAST_EMAIL_PROMPT), 'prompt labels Paragraph 1');
  assert(/PARAGRAPH 2|Paragraph 2/i.test(FAST_EMAIL_PROMPT), 'prompt labels Paragraph 2');
  assert(/PARAGRAPH 3|Closing/i.test(FAST_EMAIL_PROMPT), 'prompt labels Paragraph 3/Closing');
}

console.log('\nTEST BQ 14: dedupeProfileUrlsInBody removes all occurrences');
{
  const body = 'Check LinkedIn: https://www.linkedin.com/in/user/ and also https://www.linkedin.com/in/user/ again.';
  const profiles = { linkedin: 'https://www.linkedin.com/in/user/', github: null, portfolio: null };
  const fixed = dedupeProfileUrlsInBody(body, profiles);
  assert(!fixed.includes('linkedin.com'), 'all LinkedIn URL occurrences removed');
}

console.log('\nTEST BQ 15: countProfileUrlOccurrences detects duplicates');
{
  const body = 'GitHub: https://github.com/user. Also see https://github.com/user.';
  const profiles = { linkedin: null, github: 'https://github.com/user', portfolio: null };
  assert(countProfileUrlOccurrences(body, profiles) >= 2, 'counts multiple profile URL occurrences');
}

console.log('\nTEST BQ 16: validateGeneratedEmail still flags filler in body');
{
  const res = validateGeneratedEmail({
    subject: 'Application for Engineer',
    body: 'I hope this email finds you well. I am writing to express my keen interest in the Engineer role at Acme. My resume is attached.',
    company: 'Acme', role: 'Engineer', candidateName: 'Raj',
  });
  assert(res.pass === false, 'generic filler still flagged by validateGeneratedEmail');
}

console.log('\nTEST BQ 17: cleanup does not break valid multi-paragraph body');
{
  const body = [
    'Dear Hiring Team,',
    'I am writing to apply for the Full Stack Developer Intern at ByteForge Innovations Pvt. Ltd.',
    '',
    'At Alinafe Online Limited, I built Zitheke, a subscription platform serving over 1,000 users.',
    '',
    'My resume is attached and I look forward to discussing further.',
  ].join('\n');
  const fixed = cleanupEmailBodyQuality(body, { role: ROLE, company: COMPANY });
  assert(fixed.includes('Alinafe Online Limited'), 'evidence paragraph preserved');
  assert(fixed.includes('Zitheke'), 'project detail preserved');
  const blankLines = fixed.split('\n').filter(l => l.trim() === '');
  assert(blankLines.length === 2, `paragraph breaks preserved (got ${blankLines.length})`);
}

console.log('\nTEST BQ 18: context builder does not echo raw subjectRequirement text');
{
  const jobInfo = {
    company: 'Acme',
    role: 'Engineer',
    subjectRequirement: 'Application for Engineer – John Doe',
  };
  const text = buildEmailContextText({ jobInfo, resume: { personal: { name: 'John' } }, match: {} });
  assert(!text.includes('Application for Engineer – John Doe'), 'raw subject text NOT echoed in context');
  assert(text.includes('metadata for the email subject only'), 'metadata-only note present');
}

console.log('\n---');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

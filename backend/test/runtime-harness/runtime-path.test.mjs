// RUNTIME-PATH regression test for the REAL job-application email flow.
// It drives the actual apply.controller.js apply() middleware (the POST /api/apply path that the
// frontend calls) end-to-end, using the loader.mjs hook to mock only the network/DB boundaries
// (generateFastEmail AI call, sendEmail/sendEmailViaGmail, DB models, resume storage). No server is
// started, no DB is connected, no email is sent.
//
// The exact previously-failing AI output is fed in: a body whose signature contains BOTH a plain-text
// profile footer AND a second markdown "[GitHub](url) | [LinkedIn](url)" block. This test asserts the
// body that reaches email.service.js contains ZERO profile URLs, and that after the canonical
// (email.service.js) footer is appended the final payload has each of GitHub/LinkedIn exactly once
// and nothing after the signature.

import test from 'node:test';
import assert from 'node:assert/strict';

const FAILING_AI_BODY = [
  'Dear Hiring Team,',
  '',
  'I am writing to express my interest in the React.js Developer Intern position at CloudMatrix ' +
    'Technologies Pvt. I came across this opportunity and I am confident my skills align well with your needs.',
  '',
  'Throughout my journey I have built projects with React.js and JavaScript. I enjoy solving problems.',
  '',
  'My resume is attached for your review. I look forward to the possibility of discussing how my ' +
    'technical skills align with your team\u2019s needs.',
  '',
  'Saurabh Sharma',
  '+91-9457982221',
  '[saurabhsharma.code@gmail.com](mailto:saurabhsharma.code@gmail.com)',
  '',
  'GitHub: https://github.com/saurabh-945798',
  'LinkedIn: https://www.linkedin.com/in/saurabh-sharma-cs/',
  '',
  '[GitHub](https://github.com/saurabh-945798) | [LinkedIn](https://www.linkedin.com/in/saurabh-sharma-cs/)',
].join('\n');

function profileSource() {
  // email.service.js appends this plain-text footer (buildProfileText) to the body it receives.
  return (pl) => `\n\nGitHub: ${pl.github}\nLinkedIn: ${pl.linkedin}`;
}

async function runApplyFlow(aiBody, jobText) {
  globalThis.__runtime_aiBody = aiBody;
  globalThis.__runtime_received = [];

  const { apply } = await import(
    new URL('../../src/controllers/apply.controller.js', import.meta.url).href
  );

  const req = {
    userId: 'u1',
    method: 'POST',
    headers: {},
    body: { jobText, autoSend: 'true' },
    files: {},
  };

  let responseData = null;
  const res = {
    status() { return this; },
    json(d) { responseData = d; return this; },
    send(d) { responseData = d; return this; },
  };

  process.once('unhandledRejection', () => {});
  await new Promise((r) => {
    apply(req, res, () => {});
    setTimeout(r, 2000);
  });

  const received = globalThis.__runtime_received[0];
  return { responseData, received, sendCount: globalThis.__runtime_received.length };
}

test('real /api/apply runtime path strips ALL profile URLs before email.service.js', async () => {
  const { received, responseData } = await runApplyFlow(
    FAILING_AI_BODY,
    'We are hiring a React.js Developer Intern at CloudMatrix Technologies Pvt. Ltd. ' +
      'Email hr@cloudmatrix.com to apply.',
  );

  assert.ok(responseData, 'apply() produced a response');
  assert.ok(received, 'sendEmail/sendEmailViaGmail must have been called (mocked transport)');
  assert.equal(received.method, 'smtp', 'getAccessTokenForUser returned null -> SMTP path (mocked)');

  const body = received.body;
  const githubInBody = (body.match(/github\.com\/\S+/g) || []).length;
  const linkedinInBody = (body.match(/linkedin\.com\/in\S*/g) || []).length;
  const markdownLabels = (body.match(/\[GitHub\]|\[LinkedIn\]|\[Portfolio\]/gi) || []).length;

  assert.equal(githubInBody, 0, 'email.service.js must receive ZERO GitHub URLs in the AI body');
  assert.equal(linkedinInBody, 0, 'email.service.js must receive ZERO LinkedIn URLs in the AI body');
  assert.equal(markdownLabels, 0, 'no [GitHub]/[LinkedIn]/[Portfolio] markdown may survive');
  assert.ok(received.subject && received.subject.trim().length > 0, 'subject must be non-empty');
});

test('final assembled payload (AI body + canonical footer) has each profile exactly once and nothing after', async () => {
  const { received } = await runApplyFlow(
    FAILING_AI_BODY,
    'We are hiring a React.js Developer Intern at CloudMatrix Technologies Pvt. Ltd. ' +
      'Email hr@cloudmatrix.com to apply.',
  );
  assert.ok(received, 'send must have been intercepted');

  const profileLinks = received.profileLinks; // {github, linkedin} as passed to email.service.js
  assert.ok(profileLinks, 'profileLinks must be passed to email.service.js for the footer');

  const appendFooter = profileSource();
  const full = received.body + appendFooter(profileLinks);

  const githubCount = (full.match(/github\.com\/\S+/g) || []).length;
  const linkedinCount = (full.match(/linkedin\.com\/in\S*/g) || []).length;
  assert.equal(githubCount, 1, 'GitHub must appear exactly once in the final email (only in footer)');
  assert.equal(linkedinCount, 1, 'LinkedIn must appear exactly once in the final email (only in footer)');

  // Nothing after the canonical signature.
  const liIdx = full.lastIndexOf('LinkedIn:');
  const after = full.slice(liIdx).split('\n');
  assert.equal(after[0].trim().startsWith('LinkedIn:'), true);
  const leftoverTail = after.slice(1).filter((l) => l.trim().length > 0);
  assert.equal(leftoverTail.length, 0, `nothing may follow the LinkedIn signature line; got: ${JSON.stringify(leftoverTail)}`);
});

test('subject is non-empty and body keeps no markdown profile block in the sent payload', async () => {
  const { received } = await runApplyFlow(
    FAILING_AI_BODY,
    'We are hiring a React.js Developer Intern at CloudMatrix Technologies Pvt. Ltd. ' +
      'Email hr@cloudmatrix.com to apply.',
  );
  assert.ok(received);
  assert.ok(received.subject.trim().length > 0, 'subject must be non-empty');
  assert.ok(
    !received.body.includes('[GitHub]') && !received.body.includes('[LinkedIn]'),
    'sent body must not contain the markdown profile block',
  );
});

// ---- Subject-resolution + body-leak regression through the REAL /api/apply path ----
const BYTEFORGE_JD = `ByteForge Innovations Pvt. Ltd. is hiring.

Role: Full Stack Developer Intern
Company: ByteForge Innovations Pvt. Ltd.

SUBJECT REQUIREMENT:
Application for Full Stack Developer Intern \u2013 [Candidate Name]

REFERENCE NUMBER:
BF-FSD-2026-314

Required skills: React.js, Node.js, MongoDB, REST APIs`;

const EXPECTED_SUBJECT = 'Application for Full Stack Developer Intern - Saurabh Sharma | BF-FSD-2026-314';

// Natural AI body (the mock bypasses the real LLM, which is fine: subject is resolved deterministically
// by apply(), and the exact company/role are enforced deterministically downstream).
const BYTEFORGE_AI_BODY = `Dear Hiring Team,

I am applying for the Full Stack Developer Intern role at ByteForge Innovations Pvt. Ltd. My experience with React.js, Node.js, MongoDB, and REST APIs aligns well with the requirements of this role.

My resume is attached for your review. I look forward to discussing how my technical skills align with your team's needs.

Saurabh Sharma`;

test('runtime /api/apply: [Candidate Name] resolved in subject; exact company/role; no subject leak in body', async () => {
  const { received } = await runApplyFlow(BYTEFORGE_AI_BODY, BYTEFORGE_JD);
  assert.ok(received, 'send must have been intercepted');

  // Subject: placeholders resolved, no literal leak, balanced brackets.
  assert.ok(received.subject, 'subject present');
  assert.equal(received.subject, EXPECTED_SUBJECT, `final subject exact match (got: ${JSON.stringify(received.subject)})`);
  assert.ok(!received.subject.includes('[Candidate Name]'), 'no [Candidate Name] literal in subject');
  assert.equal(
    (received.subject.match(/\[/g) || []).length,
    (received.subject.match(/\]/g) || []).length,
    'subject brackets balanced',
  );
  assert.ok(received.subject.includes('Saurabh Sharma'), 'exact candidate name in subject');
  assert.ok(received.subject.includes('Full Stack Developer Intern'), 'exact role in subject');
  assert.ok(received.subject.includes('BF-FSD-2026-314'), 'reference number in subject');

  const hasRole = !received.subject.includes('SUBJECT REQUIREMENT');
  assert.ok(hasRole, 'subject is not built from the literal SUBJECT REQUIREMENT line');

  // Body must use exact role/company and never carry the subject-template phrase.
  assert.ok(received.body.includes('ByteForge Innovations Pvt. Ltd.'), 'exact full company in body');
  assert.ok(received.body.includes('Full Stack Developer Intern'), 'exact role in body');
  assert.ok(!received.body.includes('Application for Full Stack Developer Intern'), 'subject-template phrase not in body');
  assert.ok(!/I am applying for the Application for/i.test(received.body), 'no "I am applying for the Application for" leak');
});


import {
  finalizeEmailBody,
  dedupeProfileUrlsInBody,
  ensureExactCompanyAndRole,
  resolveFinalSubject,
  countProfileUrlOccurrences,
} from '../src/utils/emailInstruction.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.log(`  FAIL: ${msg}`); }
}

const LINKEDIN = 'https://www.linkedin.com/in/saurabh-sharma-cs/';
const GITHUB = 'https://github.com/saurabh-945798';
const COMPANY = 'CloudMatrix Technologies Pvt. Ltd.';
const ROLE = 'React.js Developer Intern';
const NAME = 'Saurabh Sharma';
const REF = 'CMT-REACT-2026-207';

const profiles = { linkedin: LINKEDIN, github: GITHUB, portfolio: null };

// The canonical footer appended deterministically by email.service.js (buildProfileText):
// the ONLY place profile links should appear, each exactly once.
function canonicalFooter(p) {
  const parts = [];
  if (p.github) parts.push(`GitHub: ${p.github}`);
  if (p.linkedin) parts.push(`LinkedIn: ${p.linkedin}`);
  return parts.length ? `\n\n` + parts.join('\n') : '';
}

console.log('R-N1: GitHub appears exactly once in final output (body + canonical footer)');
{
  // AI body illegally carries BOTH a plain-text signature block AND a markdown duplicate block.
  const rawBody = `Dear Hiring Team,

I am applying for the ${ROLE} role at ${COMPANY}.

GitHub: ${GITHUB}
LinkedIn: ${LINKEDIN}

[GitHub](${GITHUB}) | [LinkedIn](${LINKEDIN})

Best regards,
${NAME}`;

  const cleaned = finalizeEmailBody({ body: rawBody, profiles, company: COMPANY, role: ROLE, gradYear: '2027' });
  const finalEmail = cleaned + canonicalFooter(profiles);
  const githubCount = (finalEmail.match(/github\.com\/saurabh-945798/g) || []).length;
  const linkedinCount = (finalEmail.match(/linkedin\.com\/in\/saurabh-sharma-cs/g) || []).length;
  assert(githubCount === 1, `GitHub appears exactly once (got ${githubCount})`);
  assert(linkedinCount === 1, `LinkedIn appears exactly once (got ${linkedinCount})`);
}

console.log('\nR-N2: GitHub & LinkedIn exist ONLY in the signature/footer, not in the body');
{
  const rawBody = `...GitHub: ${GITHUB} [GitHub](${GITHUB}) | [LinkedIn](${LINKEDIN}) LinkedIn: ${LINKEDIN}... ${NAME}`;
  const cleaned = dedupeProfileUrlsInBody(rawBody, profiles);
  assert(countProfileUrlOccurrences(cleaned, profiles) === 0, `no profile URL in cleaned body (count 0)`);
  const withFooter = cleaned + canonicalFooter(profiles);
  // The URLs should appear ONLY once, at the footer position (after the body).
  const githubIdx = withFooter.indexOf('github.com/saurabh-945798');
  const linkedinIdx = withFooter.indexOf('linkedin.com/in/saurabh-sharma-cs');
  const bodyEndIdx = cleaned.length;
  assert(githubIdx !== -1 && githubIdx >= bodyEndIdx, 'GitHub URL present and located within the footer (after body)');
  assert(linkedinIdx !== -1 && linkedinIdx >= bodyEndIdx, 'LinkedIn URL present and located within the footer (after body)');
}

console.log('\nR-N3: no "[GitHub] | [LinkedIn]" duplicate markdown block remains');
{
  const raw = `x\n\n[GitHub](${GITHUB}) | [LinkedIn](${LINKEDIN})\n\ny`;
  const cleaned = dedupeProfileUrlsInBody(raw, profiles);
  assert(!/\[GitHub\]/.test(cleaned), 'no [GitHub] markdown remnant');
  assert(!/\[LinkedIn\]/.test(cleaned), 'no [LinkedIn] markdown remnant');
  assert(!/\]\s*\(\s*https?:/.test(cleaned), 'no markdown URL link remnants');
  assert(!/\|\s*$/m.test(cleaned), 'no orphan pipe separator');
}

console.log('\nR-N4: no profile-link block appears after the canonical signature');
{
  const rawBody = `Dear Hiring Team,\nI'm applying for the ${ROLE} role at ${COMPANY}.\n\n[GitHub](${GITHUB}) | [LinkedIn](${LINKEDIN})\n\nBest regards,\n${NAME}`;
  const cleaned = finalizeEmailBody({ body: rawBody, profiles, company: COMPANY, role: ROLE, gradYear: '2027' });
  const finalEmail = cleaned + canonicalFooter(profiles);
  // Verify the footer (the ONLY profile block) sits at the very end with nothing after it.
  const footerStart = finalEmail.indexOf('\n\nGitHub: ' + GITHUB);
  assert(footerStart !== -1, 'canonical footer present at end');
  const afterFooter = finalEmail.slice(footerStart + 2).trim();
  const expected = `GitHub: ${GITHUB}\nLinkedIn: ${LINKEDIN}`;
  assert(afterFooter === expected, `nothing after canonical profile block (tail=${JSON.stringify(afterFooter)})`);
  assert(!/\[GitHub\]|\[LinkedIn\]/.test(finalEmail), 'no markdown profile block in final email');
}

console.log('\nR-N5: exact company "CloudMatrix Technologies Pvt. Ltd." preserved');
{
  const body = `Dear Hiring Team,\nI am applying for the ${ROLE} position at CloudMatrix Technologies Pvt.\n${NAME}`;
  const cleaned = finalizeEmailBody({ body, profiles, company: COMPANY, role: ROLE, gradYear: '2027' });
  assert(cleaned.includes(COMPANY), `exact company present: '${COMPANY}'`);
  assert(!/CloudMatrix Technologies Pvt(?!\.?\s+Ltd)/.test(cleaned), 'no truncated company remnant without Ltd.');
}

console.log('\nR-N6: exact role "React.js Developer Intern" preserved (not shortened)');
{
  const body = `Dear Hiring Team,\nI am applying for the developer role at ${COMPANY}.\n${NAME}`;
  const cleaned = finalizeEmailBody({ body, profiles, company: COMPANY, role: ROLE, gradYear: '2027' });
  assert(cleaned.includes('React.js Developer Intern'), 'exact role preserved verbatim');
  assert(!/Frontend Developer|React Developer|Software Engineer/.test(cleaned), 'role not replaced with generalized form');
}

console.log('\nR-N7: subject remains non-empty');
{
  const emptySafe = resolveFinalSubject({ jdSubjectRequirement: null, jobId: null, aiSubject: null, role: ROLE, candidateName: NAME });
  assert(emptySafe && emptySafe.trim().length > 0, 'subject never empty when all inputs empty');
  const canonical = resolveFinalSubject({ jdSubjectRequirement: null, jobId: REF, aiSubject: `Application for ${ROLE} - ${NAME}`, role: ROLE, candidateName: NAME });
  assert(canonical && canonical.trim().length > 0, 'subject non-empty for canonical JD');
}

console.log('\nR-N8: subject/reference-number behavior intact');
{
  const canonical = resolveFinalSubject({ jdSubjectRequirement: null, jobId: REF, aiSubject: `Application for ${ROLE} - ${NAME}`, role: ROLE, candidateName: NAME });
  assert(canonical.includes(ROLE), 'subject contains exact role');
  assert(canonical.includes(NAME), 'subject contains candidate name');
  assert(canonical.includes(REF), 'subject contains reference number');
  // JD explicit subject is authoritative.
  const fromJd = resolveFinalSubject({ jdSubjectRequirement: `App ${ROLE} - ${REF}`, jobId: REF, aiSubject: 'something else', role: ROLE, candidateName: NAME });
  assert(fromJd.includes(ROLE) && fromJd.includes(REF), 'JD subject wins and keeps role/ref');
}

console.log('\nR-N9: no-fabrication behavior intact (AI body profile claims never get reconstructed)');
{
  // Even if the AI invented profile URLs, finalizer strips them; only the real footer supplies them.
  const raw = `Dear Hiring Team,\nI have a GitHub at ${GITHUB} and LinkedIn ${LINKEDIN}.\n${NAME}`;
  const cleaned = finalizeEmailBody({ body: raw, profiles, company: COMPANY, role: ROLE, gradYear: '2027' });
  assert(countProfileUrlOccurrences(cleaned, profiles) === 0, 'fabricated/inlined profile URLs stripped from body');
  assert(cleaned.includes(COMPANY), 'company still preserved after strip');
}

console.log('\nR-N10: markdown profile block removed regardless of URL (root-cause gap)');
{
  // RUNTIME root cause: the LLM sometimes writes "[GitHub](url) | [LinkedIn](url)" where the URL
  // spelling differs from / is not in the canonical profile list (e.g. fabricated or no-scheme).
  // Those must STILL be removed, because profile links are allowed ONLY in the canonical footer.
  const variants = [
    { label: 'divergent/fabricated urls', sig: `[GitHub](https://github.com/another-user) | [LinkedIn](https://www.linkedin.com/in/someone-else)` },
    { label: 'no scheme', sig: `[GitHub](github.com/saurabh-945798) | [LinkedIn](linkedin.com/in/saurabh-sharma-cs)` },
    { label: 'www github', sig: `[GitHub](https://www.github.com/saurabh-945798) | [LinkedIn](https://linkedin.com/in/saurabh-sharma-cs/)` },
    { label: 'label: line', sig: `GitHub: https://github.com/saurabh-945798 | LinkedIn: https://www.linkedin.com/in/saurabh-sharma-cs/` },
  ];
  for (const { label, sig } of variants) {
    const raw = `Dear Hiring Team,\nI am applying for the ${ROLE} role at ${COMPANY}.\n\n${sig}\n\nBest regards,\n${NAME}`;
    const cleaned = finalizeEmailBody({ body: raw, profiles, company: COMPANY, role: ROLE, gradYear: '2027' });
    const urls = countProfileUrlOccurrences(cleaned, profiles) +
      (cleaned.match(/github\.com\/\S+/gi) || []).length +
      (cleaned.match(/linkedin\.com\/in\S*/gi) || []).length;
    assert(urls === 0, `[${label}] no profile url / markdown residue left in body (${label})`);
    assert(!/\[(GitHub|LinkedIn|Portfolio)\]/i.test(cleaned), `[${label}] no [GitHub]/[LinkedIn]/[Portfolio] markdown survives`);
    assert(cleaned.includes(COMPANY), `[${label}] exact company preserved`);
  }
}

console.log('\n---');
console.log(`REG-N results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

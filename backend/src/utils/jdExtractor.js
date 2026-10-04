import {
  extractApplicationInstructions,
} from './emailInstruction.js';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const ROLE_PATTERNS = [
  /(?:hiring|looking for|opening for|position for)\s+(?:a\s+)?(.*?)(?:\n|$|\.)/i,
  /(?:job title|role|position)[:\s]+(.*?)(?:\n|$)/i,
  /([A-Za-z\s]+(?:Engineer|Developer|Intern|Analyst|Manager|Designer|Architect|Lead|Specialist|Consultant|Administrator|Technician|Scientist|Researcher))(?:\s*[-–—]|\.|\n|$)/i
];

const COMPANY_PATTERNS = [
  /^([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)\s+(?:is hiring|is looking|hiring|presents|brings)/m,
  /(?:at|@)\s+([A-Z][^\r\n]{1,70})/i,
  /(?:company[:\s]+|organization[:\s]+|company name[:\s]+)([A-Za-z][^\r\n]{1,70})/i,
];

const ENTITY_SUFFIX = /\b(?:Ltd|Limited|Inc|Incorporated|LLC|LLP|Corp|Corporation|Co|Company|GmbH|Pvt|Private|Group)\b\.?$/i;
const ENTITY_WORD = /\b(?:Ltd|Limited|Inc|Incorporated|LLC|LLP|Corp|Corporation|Co|Company|GmbH|Pvt|Private|Group)\b/i;

// Cut the raw company token to a clean, complete company name, preserving legal-entity suffixes
// ("ByteForge Innovations Pvt. Ltd.") while discarding parentheticals, emails and trailing prose.
function cleanCompany(raw) {
  let c = raw.trim();
  c = c.replace(/\s*\(.*$/s, '').trim(); // drop trailing "(City)" etc.
  c = c.replace(/\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}.*$/s, '').trim(); // drop trailing emails
  // Cut at the first sentence-period that is NOT a legal-entity suffix (keeps "Pvt. Ltd." / "Inc.").
  const periodIdx = c.search(/\.\s+(?!(?:Ltd|Limited|Inc|LLC|LLP|Corp|Co|Company|GmbH|Pvt|Private|Group)\b)/i);
  if (periodIdx !== -1) c = c.slice(0, periodIdx);
  // Cut trailing helper clauses / locations (e.g. " in Hyderabad", " is hiring", " we are...").
  c = c.replace(/\s+(?:is|are|we|our|they|for|to|apply|send|submit|located|based|in|at|hybrid|remote|onsite)\b.*$/i, '').trim();
  // Re-harvest a legal-entity suffix that a period-cut may have removed ("Pvt. Ltd." stays intact above).
  c = c.replace(/,+$/, '').trim();
  if (!ENTITY_SUFFIX.test(c)) c = c.replace(/[.,\s]+$/, '').trim();
  // Ensure a final entity abbreviation has its period ("Pvt Ltd." -> "Pvt. Ltd.").
  if (ENTITY_WORD.test(c)) c = c.replace(/\b(Pvt|Ltd|Inc|LLC|LLP|Corp|Co|GmbH)\b(?=\s|$)/g, (m, w) => `${w}.`);
  return c.replace(/\s+/g, ' ').trim();
}

function extractCompany(text) {
  for (const pattern of COMPANY_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const company = cleanCompany(match[1]);
      if (company.length > 1 && company.length < 60) return company;
    }
  }
  return null;
}

const SKILL_SECTION_PATTERNS = [
  /(?:required skills|requirements|skills|qualifications|tech stack|technologies|must have|required[:\s]*)([\s\S]*?)(?:\n\n|\n(?=[A-Z])|bonus|nice to have|preferred|optional|about|description|responsibilities|$)/i
];

const LINE_BULLET = /^\s*[-•*]\s*(.+)/;

function extractEmails(text) {
  const matches = text.match(EMAIL_REGEX);
  if (!matches) return [];
  const filtered = matches.filter(e => {
    const lower = e.toLowerCase();
    return !lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.gif');
  });
  return [...new Set(filtered)];
}

function extractRole(text) {
  for (const pattern of ROLE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let role = match[1].trim().replace(/[,.;:]+$/, '').trim();
      if (role.length > 5 && role.length < 80) return role;
    }
  }
  return null;
}

function extractSkills(text) {
  for (const pattern of SKILL_SECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const lines = match[1].split('\n')
        .map(l => l.replace(LINE_BULLET, '$1').trim())
        .filter(l => l.length > 1 && l.length < 100);
      if (lines.length > 0) return lines;
    }
  }
  return [];
}

function extractKeyRequirements(text) {
  const skills = extractSkills(text);
  if (skills.length > 0) return skills.join(', ');
  const lines = text.split('\n')
    .filter(l => /skill|requirement|qualif|technolog|proficien|experience with|knowledge of|familiar/i.test(l))
    .map(l => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(l => l.length > 3 && l.length < 150)
    .slice(0, 8);
  return lines.join(', ') || null;
}

function extractPreferredSkills(text) {
  const lines = text.split('\n')
    .filter(l => /(?:plus|preferred|nice to have|bonus|desirable|optional|good to have)/i.test(l))
    .map(l => l.replace(LINE_BULLET, '$1').trim())
    .filter(l => l.length > 2 && l.length < 100);
  return lines.slice(0, 8);
}

export function extractJobInfo(text) {
  if (!text || typeof text !== 'string') {
    return { company: null, role: null, recipientEmail: null, keyRequirements: null, location: null, workMode: null, preferredSkills: [], jobId: null, referenceNumber: null, applicationInstructions: [], subjectRequirement: null, requiredAttachments: [] };
  }

  const emails = extractEmails(text);
  const company = extractCompany(text);
  const role = extractRole(text);
  const keyRequirements = extractKeyRequirements(text);
  const preferredSkills = extractPreferredSkills(text);

  let location = null;
  let workMode = null;
  const locMatch = text.match(/(?:location|place of work|work location)\s*[:=]?\s*([^\n.,;]+)/i);
  if (locMatch && locMatch[1]) location = locMatch[1].trim();
  const modeMatch = text.match(/\b(work from office|remote|hybrid|onsite|on[\s-]site|virtual)\b/i);
  if (modeMatch) workMode = modeMatch[1];

  const instructions = extractApplicationInstructions(text);

  return {
    company,
    role,
    recipientEmail: instructions.recipientEmail || (emails.length > 0 ? emails[0] : null),
    keyRequirements,
    // Extended structured fields (new)
    location,
    workMode,
    preferredSkills,
    jobId: instructions.jobId,
    referenceNumber: instructions.jobId,
    applicationInstructions: instructions.additionalInfo.length ? instructions.additionalInfo.map(i => i.name) : [],
    additionalInfo: instructions.additionalInfo,
    subjectRequirement: instructions.subjectRequirement,
    requiredAttachments: instructions.requiredAttachments,
  };
}

import axios from 'axios';
import { JOB_PARSER_PROMPT } from '../prompts/jobParser.prompt.js';
import { RESUME_PARSER_PROMPT } from '../prompts/resumeParser.prompt.js';
import { JOB_RESUME_MATCHER_PROMPT } from '../prompts/jobResumeMatcher.prompt.js';
import { EMAIL_GENERATOR_PROMPT } from '../prompts/emailGenerator.prompt.js';
import {
  finalizeEmailBody,
  getCandidateProfiles,
  findGraduationYear,
} from '../utils/emailInstruction.js';

function getAIConfig() {
  const AI_API_KEY = process.env.AI_API_KEY;
  const AI_API_URL = process.env.AI_API_URL;
  const AI_MODEL = process.env.AI_MODEL;

  if (!AI_API_KEY || !AI_API_URL || !AI_MODEL) {
    throw new Error('AI configuration missing. Check AI_API_KEY, AI_API_URL, AI_MODEL in .env');
  }

  return { AI_API_KEY, AI_API_URL, AI_MODEL };
}

export async function parseJobWithAI(text) {
  const { AI_API_KEY, AI_API_URL, AI_MODEL } = getAIConfig();

  const prompt = `${JOB_PARSER_PROMPT}\n\nNotification:\n${text}`;

  try {
    const response = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: JOB_PARSER_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    return validateJobData(parsed);
  } catch (error) {
    if (error.response) {
      throw new Error(`AI API error: ${error.response.status} ${error.response.statusText}`);
    }
    throw error;
  }
}

function validateJobData(data) {
  const schema = {
    company: null,
    role: null,
    location: null,
    workMode: null,
    salary: null,
    experience: null,
    eligibility: [],
    skills: [],
    description: null,
    email: null,
    applyLink: null
  };

  const validated = { ...schema };

  for (const key of Object.keys(schema)) {
    if (key in data) {
      const value = data[key];
      if (key === 'eligibility') {
        validated[key] = Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];
      } else if (key === 'skills') {
        if (!Array.isArray(value)) {
          validated[key] = [];
        } else {
          validated[key] = value
            .filter(v => v !== null && v !== undefined)
            .map(v => {
              if (typeof v === 'object' && v !== null && 'name' in v) {
                return { name: String(v.name).trim(), required: v.required !== false };
              }
              if (typeof v === 'string') {
                return { name: v.trim(), required: true };
              }
              return null;
            })
            .filter(s => s && s.name);
        }
      } else if (value === null || value === undefined || value === '') {
        validated[key] = null;
      } else if (typeof value === 'string') {
        validated[key] = value.trim();
      } else {
        validated[key] = String(value).trim();
      }
    }
  }

  return validated;
}

export async function parseResumeWithAI(text) {
  const { AI_API_KEY, AI_API_URL, AI_MODEL } = getAIConfig();

  try {
    const response = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: RESUME_PARSER_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    return validateResumeData(parsed);
  } catch (error) {
    if (error.response) {
      throw new Error(`AI API error: ${error.response.status} ${error.response.statusText}`);
    }
    throw error;
  }
}

function validateResumeData(data) {
  const schema = {
    name: null,
    email: null,
    phone: null,
    location: null,
    summary: null,
    skills: [],
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    tools: [],
    cloud: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    github: null,
    linkedin: null,
    portfolio: null
  };

  const validated = { ...schema };

  for (const key of Object.keys(schema)) {
    if (key in data) {
      const value = data[key];
      const arrayFields = ['skills', 'programmingLanguages', 'frameworks', 'databases', 'tools', 'cloud', 'education', 'experience', 'projects', 'certifications', 'achievements'];
      if (arrayFields.includes(key)) {
        validated[key] = Array.isArray(value) ? value.filter(v => v !== null && v !== undefined) : [];
      } else if (value === null || value === undefined || value === '') {
        validated[key] = null;
      } else if (typeof value === 'string') {
        validated[key] = value.trim();
      } else {
        validated[key] = String(value).trim();
      }
    }
  }

  return validated;
}

export async function matchJobWithResume(job, resume) {
  const { AI_API_KEY, AI_API_URL, AI_MODEL } = getAIConfig();

  const userContent = `JOB DATA:\n${JSON.stringify(job, null, 2)}\n\nRESUME DATA:\n${JSON.stringify(resume, null, 2)}`;

  try {
    const response = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: JOB_RESUME_MATCHER_PROMPT },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    return validateMatchData(parsed);
  } catch (error) {
    if (error.response) {
      throw new Error(`AI API error: ${error.response.status} ${error.response.statusText}`);
    }
    throw error;
  }
}

function validateMatchData(data) {
  const schema = {
    matchScore: 0,
    recommendation: 'SKIP',
    summary: '',
    matchedSkills: [],
    missingSkills: [],
    additionalSkills: [],
    hardRequirements: { passed: [], failed: [], unclear: [] },
    experienceMatch: { score: 0, reason: '' },
    educationMatch: { score: 0, reason: '' },
    projectMatch: { score: 0, relevantProjects: [], reason: '' },
    locationMatch: { status: 'UNKNOWN', reason: '' },
    workModeMatch: { status: 'UNKNOWN', reason: '' },
    strengths: [],
    gaps: []
  };

  const validated = { ...schema };

  for (const key of Object.keys(schema)) {
    if (key in data) {
      const value = data[key];
      const arrayFields = ['matchedSkills', 'missingSkills', 'additionalSkills', 'strengths', 'gaps'];
      const objectFields = ['hardRequirements', 'experienceMatch', 'educationMatch', 'projectMatch', 'locationMatch', 'workModeMatch'];

      if (arrayFields.includes(key)) {
        validated[key] = Array.isArray(value) ? value.filter(v => v !== null && v !== undefined && v !== '') : [];
      } else if (objectFields.includes(key)) {
        validated[key] = value && typeof value === 'object' ? value : schema[key];
      } else if (typeof value === 'number') {
        validated[key] = Math.max(0, Math.min(100, Math.round(value)));
      } else if (typeof value === 'string') {
        validated[key] = value.trim();
      } else if (value === null || value === undefined) {
        validated[key] = schema[key];
      }
    }
  }

  const validRecommendations = ['STRONG_APPLY', 'APPLY', 'CONSIDER', 'SKIP'];
  if (!validRecommendations.includes(validated.recommendation)) {
    validated.recommendation = 'SKIP';
  }

  const validLocationStatus = ['MATCH', 'PARTIAL', 'MISMATCH', 'UNKNOWN'];
  if (!validLocationStatus.includes(validated.locationMatch.status)) {
    validated.locationMatch.status = 'UNKNOWN';
  }
  if (!validLocationStatus.includes(validated.workModeMatch.status)) {
    validated.workModeMatch.status = 'UNKNOWN';
  }

  return validated;
}

const EMAIL_MODEL = process.env.EMAIL_MODEL || 'llama-3.1-8b-instant';
const EMAIL_MODEL_FALLBACK = process.env.EMAIL_MODEL_FALLBACK || 'llama3-70b-8192';
const EMAIL_MAX_TOKENS = 500;
const EMAIL_TEMPERATURE = 0.3;
const EMAIL_TIMEOUT = 30000;

function buildEmailContext(job, resume, match) {
  const jobSkills = (job.skills || [])
    .filter(s => s.required !== false)
    .map(s => s.name);

  const optionalSkills = (job.skills || [])
    .filter(s => s.required === false)
    .map(s => s.name);

  const matchedSkills = match.matchedSkills || [];
  const missingSkills = match.missingSkills || [];
  const matchedOptional = match.matchedOptional || [];

  const relevantExperience = (resume.experience || [])
    .filter(exp => {
      const expSkills = (exp.skills || []).map(s => s.toLowerCase());
      return jobSkills.some(s => expSkills.includes(s.toLowerCase()));
    })
    .slice(0, 2)
    .map(exp => ({
      title: exp.title,
      company: exp.company,
      duration: exp.duration,
      description: exp.description
    }));

  const relevantProjects = (resume.projects || [])
    .filter(proj => {
      const projTechs = (proj.technologies || []).map(t => t.toLowerCase());
      return jobSkills.some(s => projTechs.includes(s.toLowerCase()));
    })
    .slice(0, 2)
    .map(proj => ({
      name: proj.name,
      technologies: proj.technologies
    }));

  const education = (resume.education || [])
    .filter(edu => {
      const degree = (edu.degree || '').toLowerCase();
      return degree.includes('computer') || degree.includes('cs') || 
             degree.includes('software') || degree.includes('engineering');
    })
    .slice(0, 1);

  return {
    job: {
      company: job.company,
      role: job.role,
      location: job.location,
      requiredSkills: jobSkills,
      optionalSkills,
      email: job.email
    },
    resume: {
      name: resume.personal?.name || resume.name,
      email: resume.personal?.email || resume.email,
      phone: resume.personal?.phone || resume.phone,
      linkedin: resume.linkedin,
      github: resume.github,
      portfolio: resume.portfolio,
      matchedSkills: matchedSkills,
      missingSkills: missingSkills.slice(0, 5),
      experience: relevantExperience,
      projects: relevantProjects,
      education
    },
    match: {
      recommendation: match.recommendation,
      matchedSkills: matchedSkills,
      missingSkills: missingSkills.slice(0, 5),
      matchedOptional
    }
  };
}

function isTemporaryError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;
  if (error.message?.includes('timeout')) return true;
  const status = error.response?.status;
  if (status === 429 || status === 502 || status === 503) return true;
  const msg = (error.response?.data?.error?.message || error.message || '').toLowerCase();
  if (msg.includes('overloaded') || msg.includes('temporarily') || msg.includes('rate limit')) return true;
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateApplicationEmail(job, resume, match) {
  const { AI_API_KEY, AI_API_URL } = getAIConfig();
  const emailContext = buildEmailContext(job, resume, match);
  const userMessage = `JOB: ${JSON.stringify(emailContext.job, null, 2)}\n\nRESUME: ${JSON.stringify(emailContext.resume, null, 2)}\n\nMATCH: ${JSON.stringify(emailContext.match, null, 2)}`;

  const modelsToTry = [EMAIL_MODEL, EMAIL_MODEL_FALLBACK];
  let attempt = 0;

  for (const model of modelsToTry) {
    attempt++;
    const start = Date.now();

    try {
      console.log(`[AI] model: ${model}`);
      console.log(`[AI] attempt: ${attempt}`);

      const response = await axios.post(
        AI_API_URL,
        {
          model,
          messages: [
            { role: 'system', content: EMAIL_GENERATOR_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: EMAIL_TEMPERATURE,
          max_tokens: EMAIL_MAX_TOKENS
        },
        {
          headers: {
            'Authorization': `Bearer ${AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: EMAIL_TIMEOUT
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      let parsed;
      try {
        parsed = JSON.parse(content.trim());
      } catch {
        throw new Error('Invalid JSON response from AI');
      }

      const duration = Date.now() - start;
      console.log(`[AI] duration: ${duration}ms`);
      return validateEmailData(parsed, job, resume);
    } catch (error) {
      const duration = Date.now() - start;
      const status = error.response?.status;
      const errMsg = status ? `${status} ${error.response?.statusText || ''}`.trim() : error.message;
      console.log(`[AI] duration: ${duration}ms`);
      console.log(`[AI] error: ${errMsg}`);

      if (isTemporaryError(error)) {
        console.log(`[AI] retry: true`);
        await sleep(1500);
        attempt++;
        const retryStart = Date.now();
        try {
          console.log(`[AI] model: ${model}`);
          console.log(`[AI] attempt: ${attempt}`);

          const retryResponse = await axios.post(
            AI_API_URL,
            {
              model,
              messages: [
                { role: 'system', content: EMAIL_GENERATOR_PROMPT },
                { role: 'user', content: userMessage }
              ],
              temperature: EMAIL_TEMPERATURE,
              max_tokens: EMAIL_MAX_TOKENS
            },
            {
              headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: EMAIL_TIMEOUT
            }
          );

          const retryContent = retryResponse.data.choices?.[0]?.message?.content;
          if (!retryContent) throw new Error('Empty response from AI');

          let retryParsed;
          try {
            retryParsed = JSON.parse(retryContent.trim());
          } catch {
            throw new Error('Invalid JSON response from AI');
          }

          const retryDuration = Date.now() - retryStart;
          console.log(`[AI] duration: ${retryDuration}ms`);
          return validateEmailData(retryParsed, job, resume);
        } catch (retryError) {
          const retryDuration = Date.now() - retryStart;
          const retryStatus = retryError.response?.status;
          const retryErrMsg = retryStatus ? `${retryStatus} ${retryError.response?.statusText || ''}`.trim() : retryError.message;
          console.log(`[AI] duration: ${retryDuration}ms`);
          console.log(`[AI] error: ${retryErrMsg}`);
          console.log(`[AI] retry: false`);
          continue;
        }
      }

      console.log(`[AI] retry: false`);
      continue;
    }
  }

  console.log(`[AI] All models exhausted`);
  return null;
}

function validateEmailData(data, job, resume) {
  const resumeCandidateName = resume?.personal?.name || resume?.name || null;
  const schema = {
    subject: '',
    recipient: null,
    body: '',
    attachments: [{ type: 'resume', required: true }],
    personalization: {
      skillsMentioned: [],
      projectsMentioned: [],
      experienceMentioned: []
    }
  };

  const validated = { ...schema };

  for (const key of Object.keys(schema)) {
    if (key in data) {
      const value = data[key];
      const arrayFields = ['skillsMentioned', 'projectsMentioned', 'experienceMentioned'];

      if (key === 'personalization') {
        if (value && typeof value === 'object') {
          validated[key] = { ...schema[key] };
          for (const pKey of Object.keys(schema[key])) {
            if (pKey in value) {
              const pValue = value[pKey];
              validated[key][pKey] = Array.isArray(pValue) ? pValue.filter(v => v !== null && v !== undefined && v !== '') : [];
            }
          }
        }
      } else if (key === 'attachments') {
        if (Array.isArray(value) && value.length > 0) {
          validated[key] = value.filter(v => v && typeof v === 'object' && v.type === 'resume' && typeof v.required === 'boolean');
          if (validated[key].length === 0) {
            validated[key] = schema[key];
          }
        } else {
          validated[key] = schema[key];
        }
      } else if (arrayFields.includes(key)) {
        validated.personalization[key] = Array.isArray(value) ? value.filter(v => v !== null && v !== undefined && v !== '') : [];
      } else if (typeof value === 'string') {
        validated[key] = value.trim();
      } else if (key === 'recipient' && (value === null || value === undefined || value === '')) {
        validated[key] = job?.email ?? null;
      }
    }
  }

  if (!validated.subject || typeof validated.subject !== 'string' || validated.subject.trim() === '') {
    validated.subject = `Application for ${job?.role || 'Position'} – ${resumeCandidateName}`;
  }

  if (!validated.body || typeof validated.body !== 'string' || validated.body.trim() === '') {
    throw new Error('AI generated empty email body');
  }

  // Deterministic final-output guarantees shared across every email path: the generated body passed
  // downstream (and ultimately to email.service.js) must never contain a second profile-link block,
  // never truncate/shorten the company or role, and never claim a fake graduation year.
  const candidateProfiles = getCandidateProfiles(resume, null);
  const realGradYear = findGraduationYear(resume);
  validated.body = finalizeEmailBody({
    body: validated.body,
    profiles: candidateProfiles,
    company: job?.company,
    role: job?.role,
    gradYear: realGradYear,
  });

  if (validated.recipient === null || validated.recipient === undefined) {
    validated.recipient = job?.email ?? null;
  }

  return validated;
}
// Runtime-path loader hook: intercepts the exact service/model/serializer modules that
// apply.controller.js (POST /api/apply) imports at runtime, replacing the real network/DB
// boundaries with deterministic mocks so we can drive the REAL apply() middleware and inspect the
// exact body value handed to email.service.js — without starting the server, connecting to the DB,
// or sending any email.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BACKEND = path.resolve(process.cwd());

export const mocks = {
  aiBody: '',
  receivedEmailServiceBodies: [],
};

function resolveFile(spec) {
  let base = BACKEND;
  let file = spec;
  if (spec.startsWith('../')) {
    base = path.join(BACKEND, 'src', 'controllers');
    file = spec.replace(/^\.\.\//, '');
  } else if (spec.startsWith('./')) {
    file = spec.replace(/^\.\//, '');
  }
  return path.normalize(path.join(base, file));
}

function mockSource(moduleName) {
  if (moduleName === 'fastEmail.service.js') {
    return `
      export async function generateFastEmail(jobInfo, resumeData, match, profileLinks) {
        globalThis.__runtime_aiBody = globalThis.__runtime_aiBody || '';
        return { body: globalThis.__runtime_aiBody, recipient: 'hr@cloudmatrix.com', subject: 'Application' };
      }
      export const FAST_EMAIL_PROMPT = 'mock';
    `;
  }
  if (moduleName === 'email.service.js') {
    return `
      export async function sendEmail({ recipient, subject, body, profileLinks }) {
        globalThis.__runtime_received.push({ method: 'smtp', recipient, subject, body, profileLinks });
        return { timing: { smtp: 1, total: 1 } };
      }
      export async function sendEmailViaGmail({ recipient, subject, body, profileLinks }) {
        globalThis.__runtime_received.push({ method: 'gmail', recipient, subject, body, profileLinks });
        return { timing: { smtp: 1, total: 1 } };
      }
      export async function warmUpTransporter() {}
    `;
  }
  if (moduleName === 'gmail.controller.js') {
    return `export async function getAccessTokenForUser() { return null; }`;
  }
  if (moduleName === 'resumeStorage.service.js') {
    return `export async function getResumeBuffer() { return Buffer.from('resume'); }
export async function resumeExists() { return true; }
export async function uploadResume() { return null; }
export async function deleteResume() {}`;
  }
  if (moduleName === 'Resume.js' || moduleName === 'User.js' || moduleName === 'Application.js') {
    const doc =
      moduleName === 'Resume.js'
        ? `{ _id: 'r1', fileId: 'gridfs1', userId: 'u1', personal: { name: 'Saurabh Sharma', email: 'saurabhsharma.code@gmail.com', phone: '+91-9457982221' }, linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/', github: 'https://github.com/saurabh-945798', education: [{ degree: 'B.Tech', year: '2027' }] }`
        : moduleName === 'User.js'
          ? `{ _id: 'u1', github: 'https://github.com/saurabh-945798', linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/' }`
          : `{}`;
    const findById =
      moduleName === 'User.js'
        ? `export const User = { findById: () => ({ lean: async () => ({ _id: 'u1', github: 'https://github.com/saurabh-945798', linkedin: 'https://www.linkedin.com/in/saurabh-sharma-cs/' }) }) };`
        : `export const User = undefined;`;
    const resumeFindOne =
      moduleName === 'Resume.js'
        ? `export const Resume = { findOne: () => ({ lean: async () => (${doc}) }), findOneAndUpdate: async () => null, create: async () => (${doc}) };`
        : `export const Resume = undefined;`;
    const appCreate =
      moduleName === 'Application.js'
        ? `export const Application = { create: async () => ({ _id: 'a1' }) };`
        : `export const Application = undefined;`;
    return `${findById}\n${resumeFindOne}\n${appCreate}`;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const resolved = resolveFile(specifier);
  const mod = mockSource(path.basename(resolved));
  if (mod) {
    return { url: 'mock:' + path.basename(resolved), shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const file = url.startsWith('mock:') ? url.slice(5) : null;
  if (file) {
    const src = mockSource(file);
    return { format: 'module', source: src, shortCircuit: true };
  }
  return nextLoad(url, context);
}

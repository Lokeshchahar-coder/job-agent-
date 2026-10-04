import { normalizeJobSkills, normalizeSkill } from '../src/utils/skillNormalizer.js';

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

console.log('Test 1: validateJobData accepts skill objects from AI');

function validateJobData(data) {
  const schema = {
    company: null, role: null, location: null, workMode: null,
    salary: null, experience: null, eligibility: [], skills: [],
    description: null, email: null, applyLink: null
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

const devBazarAiResponse = {
  company: 'DevBazar',
  role: 'Backend Developer Intern',
  location: null,
  workMode: null,
  salary: null,
  experience: null,
  eligibility: [],
  skills: [
    { name: 'python', required: true },
    { name: 'oop', required: true },
    { name: 'rest apis', required: true },
    { name: 'sql', required: true },
    { name: 'git', required: false }
  ],
  description: null,
  email: null,
  applyLink: null
};

const validated = validateJobData(devBazarAiResponse);
assert(validated.skills.length === 5, 'skills array has 5 entries after validateJobData');
assert(validated.skills[0].name === 'python', 'first skill is python');
assert(validated.skills[0].required === true, 'python is required');
assert(validated.skills[1].name === 'oop', 'second skill is oop');
assert(validated.skills[1].required === true, 'oop is required');
assert(validated.skills[2].name === 'rest apis', 'third skill is rest apis');
assert(validated.skills[2].required === true, 'rest apis is required');
assert(validated.skills[3].name === 'sql', 'fourth skill is sql');
assert(validated.skills[3].required === true, 'sql is required');
assert(validated.skills[4].name === 'git', 'fifth skill is git');
assert(validated.skills[4].required === false, 'git is optional');

console.log('\nTest 2: normalizeJobSkills normalizes names and preserves required/optional');

const normalized = normalizeJobSkills(validated);
assert(normalized.length === 5, 'normalizeJobSkills returns 5 skills');
assert(normalized[0].name === 'python', 'python normalized correctly');
assert(normalized[4].name === 'git', 'git normalized correctly');
assert(normalized[4].required === false, 'git remains optional after normalize');

console.log('\nTest 3: normalizeJobSkills handles old string format (cached jobs)');

const oldFormatJob = {
  skills: [
    'Good command of Python',
    'Understanding of OOP',
    'Basic knowledge of REST APIs',
    'SQL / database knowledge',
    'Git/GitHub is a plus'
  ]
};
const migrated = normalizeJobSkills(oldFormatJob);
assert(migrated.length === 5, 'old format migrated to 5 skills');
assert(migrated[0].name === 'python', 'old format: python extracted');
assert(migrated[0].required === true, 'old format: python is required');
assert(migrated[1].name === 'oop', 'old format: oop extracted');
assert(migrated[2].name === 'rest apis', 'old format: rest apis extracted');
assert(migrated[3].name === 'sql', 'old format: sql extracted');
assert(migrated[4].name === 'git', 'old format: git extracted');
assert(migrated[4].required === false, 'old format: git is optional');

console.log('\nTest 4: normalizeJobSkills converts descriptive phrases via stripFillerWords');

const t4a = normalizeJobSkills({ skills: ['Good command of Python'] });
assert(t4a[0].name === 'python', '"Good command of Python" → python');

const t4b = normalizeJobSkills({ skills: ['Understanding of OOP'] });
assert(t4b[0].name === 'oop', '"Understanding of OOP" → oop');

const t4c = normalizeJobSkills({ skills: ['Basic knowledge of REST APIs'] });
assert(t4c[0].name === 'rest apis', '"Basic knowledge of REST APIs" → rest apis');

const t4d = normalizeJobSkills({ skills: ['SQL / database knowledge'] });
assert(t4d[0].name === 'sql', '"SQL / database knowledge" → sql');

console.log('\nTest 5: skills are NOT empty array');

assert(validated.skills.length > 0, 'validated skills is not []');
assert(normalized.length > 0, 'normalized skills is not []');
assert(migrated.length > 0, 'migrated skills is not []');

console.log('\n---');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

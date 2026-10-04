const SKILL_ALIASES = {
  'react.js': ['reactjs', 'react js', 'react'],
  'react': ['reactjs', 'react js', 'react.js'],
  'node.js': ['nodejs', 'node js', 'node'],
  'node': ['nodejs', 'node js', 'node.js'],
  'javascript': ['js', 'ecmascript'],
  'typescript': ['ts'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo', 'mongo db'],
  'mysql': ['my sql'],
  'html': ['html5'],
  'css': ['css3'],
  'html & css': ['html', 'css', 'html5', 'css3'],
  'rest apis': ['restful apis', 'rest api', 'restful api'],
  'git': ['git / github', 'github', 'git/github'],
  'aws': ['amazon web services'],
  'gcp': ['google cloud platform', 'google cloud'],
  'azure': ['microsoft azure'],
  'docker': ['containerization'],
  'kubernetes': ['k8s'],
  'ci/cd': ['ci cd', 'continuous integration', 'continuous deployment'],
  'redux': ['redux toolkit', 'redux-thunk', 'redux saga'],
  'next.js': ['nextjs', 'next js'],
  'vue.js': ['vuejs', 'vue js', 'vue'],
  'angular': ['angularjs', 'angular js'],
  'express': ['express.js', 'express js'],
  'fastapi': ['fast api'],
  'django': [],
  'flask': [],
  'spring boot': ['spring', 'springboot'],
  'graphql': [],
  'grpc': [],
  'websocket': ['websockets'],
  'jest': ['testing'],
  'cypress': ['e2e testing'],
  'webpack': ['bundler'],
  'vite': [],
  'babel': [],
  'eslint': ['linting'],
  'prettier': ['formatting'],
  'tailwind css': ['tailwind', 'tailwindcss'],
  'bootstrap': [],
  'material ui': ['mui', 'material-ui'],
  'styled components': ['styled-components'],
  'sass': ['scss'],
  'less': [],
  'webpack': [],
  'babel': [],
  'jest': [],
  'mocha': [],
  'chai': [],
  'supertest': [],
  'puppeteer': [],
  'playwright': [],
  'selenium': [],
  'postman': ['api testing'],
  'swagger': ['openapi'],
  'jira': ['atlassian'],
  'confluence': [],
  'gitlab': [],
  'bitbucket': [],
  'jenkins': ['ci/cd'],
  'github actions': ['gh actions', 'actions'],
  'gitlab ci': [],
  'terraform': ['iac'],
  'ansible': ['configuration management'],
  'prometheus': ['monitoring'],
  'grafana': ['visualization'],
  'elasticsearch': ['elk', 'elastic search'],
  'logstash': [],
  'kibana': [],
  'kafka': ['apache kafka'],
  'rabbitmq': ['message queue'],
  'redis': ['cache'],
  'memcached': [],
  'nginx': ['reverse proxy'],
  'apache': ['httpd'],
  'linux': ['unix'],
  'bash': ['shell scripting'],
  'powershell': [],
  'python': ['py'],
  'java': [],
  'c++': ['cpp', 'c plus plus'],
  'c#': ['csharp', 'dotnet', '.net'],
  'go': ['golang'],
  'rust': [],
  'kotlin': [],
  'swift': [],
  'php': [],
  'ruby': [],
  'rails': ['ruby on rails'],
  'laravel': [],
  'spring': [],
  'hibernate': [],
  'jpa': [],
  'sql': ['structured query language'],
  'nosql': [],
  'firebase': ['google firebase'],
  'supabase': [],
  'prisma': ['orm'],
  'typeorm': [],
  'sequelize': [],
  'mongoose': ['odm'],
  'dynamodb': [],
  'cassandra': [],
  'couchdb': [],
  'neo4j': ['graph database'],
  'graphql': [],
  'rest': ['restful'],
  'soap': [],
  'oauth': ['oauth2', 'openid connect'],
  'jwt': ['json web token'],
  'ssl': ['tls'],
  'https': [],
  'api': ['rest api', 'graphql api'],
  'microservices': ['microservice architecture'],
  'serverless': ['faas', 'lambda'],
  'lambda': ['aws lambda'],
  'cloudformation': [],
  'cdk': ['aws cdk'],
  'pulumi': [],
  'github': [],
  'gitlab': [],
  'bitbucket': [],
  'svn': ['subversion'],
  'mercurial': [],
  'jira': [],
  'trello': [],
  'asana': [],
  'notion': [],
  'slack': [],
  'teams': ['microsoft teams'],
  'zoom': [],
  'figma': ['design'],
  'sketch': ['design'],
  'adobe xd': ['xd'],
  'photoshop': ['ps'],
  'illustrator': ['ai'],
  'after effects': ['ae'],
  'premiere': ['video editing'],
  'blender': ['3d'],
  'unity': ['game development'],
  'unreal': ['unreal engine'],
  'godot': [],
  'flutter': ['dart'],
  'react native': ['rn'],
  'expo': [],
  'ionic': [],
  'cordova': [],
  'capacitor': [],
  'electron': ['desktop apps'],
  'tauri': ['rust desktop'],
  'vscode': ['visual studio code', 'vs code'],
  'vim': [],
  'emacs': [],
  'intellij': ['idea'],
  'webstorm': [],
  'pycharm': [],
  'goland': [],
  'rider': [],
  'clion': []
};

export function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return skill;
  
  const normalized = skill.toLowerCase().trim()
    .replace(/[_\s\-\.]+/g, ' ')
    .replace(/[()]/g, '')
    .trim();
  
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    if (canonical === normalized || aliases.includes(normalized)) {
      return canonical;
    }
  }
  
  return normalized;
}

export function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map(s => normalizeSkill(s))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export function extractAllSkills(resume) {
  const allSkills = new Set();
  
  if (resume.skills?.programmingLanguages) {
    resume.skills.programmingLanguages.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.frameworks) {
    resume.skills.frameworks.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.databases) {
    resume.skills.databases.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.tools) {
    resume.skills.tools.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.cloud) {
    resume.skills.cloud.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.other) {
    resume.skills.other.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.skills) {
    resume.skills.skills.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  
  if (resume.experience) {
    resume.experience.forEach(exp => {
      if (exp.skills) {
        exp.skills.forEach(s => allSkills.add(normalizeSkill(s)));
      }
    });
  }
  
  if (resume.projects) {
    resume.projects.forEach(proj => {
      if (proj.technologies) {
        proj.technologies.forEach(s => allSkills.add(normalizeSkill(s)));
      }
    });
  }
  
  return Array.from(allSkills);
}

const CATEGORY_KEYWORDS = {
  programmingLanguages: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift', 'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell', 'sql', 'html', 'css'],
  frameworks: ['react', 'react.js', 'reactjs', 'vue', 'vue.js', 'vuejs', 'angular', 'angularjs', 'next.js', 'nextjs', 'nuxt', 'svelte', 'solid', 'qwik', 'astro', 'remix', 'gatsby', 'express', 'express.js', 'fastapi', 'django', 'flask', 'spring boot', 'laravel', 'rails', 'nest', 'nestjs', 'koa', 'hapi', 'sveltekit', 'adonis', 'feathers', 'loopback', 'tailwind', 'tailwind css', 'tailwindcss', 'bootstrap', 'material ui', 'mui', 'styled components', 'styled-components'],
  databases: ['mongodb', 'mongo', 'mongo db', 'mongo atlas', 'mongodb atlas', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'couchdb', 'neo4j', 'sqlite', 'mariadb', 'firebase', 'supabase', 'planetscale', 'prisma', 'typeorm', 'sequelize', 'mongoose', 'sql', 'nosql', 'faunadb', 'cockroachdb', 'timescaledb'],
  tools: ['git', 'github', 'gitlab', 'bitbucket', 'docker', 'kubernetes', 'k8s', 'jenkins', 'circleci', 'github actions', 'gitlab ci', 'terraform', 'ansible', 'prometheus', 'grafana', 'kibana', 'kafka', 'rabbitmq', 'nginx', 'apache', 'linux', 'bash', 'vim', 'vscode', 'visual studio code', 'intellij', 'webstorm', 'pycharm', 'postman', 'swagger', 'jira', 'trello', 'asana', 'notion', 'slack', 'teams', 'zoom', 'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'after effects', 'premiere', 'blender', 'unity', 'unreal', 'godot', 'flutter', 'react native', 'expo', 'ionic', 'cordova', 'capacitor', 'electron', 'tauri', 'webpack', 'vite', 'babel', 'eslint', 'prettier', 'sass', 'scss', 'less', 'jest', 'cypress', 'mocha', 'chai', 'supertest', 'puppeteer', 'playwright', 'selenium', 'sonarqube', 'pm2', 'langchain', 'lang chain', 'vite', 'nodemon', 'ts-node', 'npx', 'npm', 'yarn', 'pnpm', 'turbo', 'nx', 'lerna', 'changesets', 'rest api', 'rest apis', 'restful api', 'restful apis', 'graphql', 'grpc', 'websocket', 'websockets', 'oauth', 'oauth2', 'jwt', 'ssl', 'tls', 'certbot', 'ssl/certbot', 'authentication', 'auth', 'rbac', 'rag', 'openai api', 'langchain', 'lang chain', 'rag'],
  cloud: ['aws', 'amazon web services', 'gcp', 'google cloud platform', 'google cloud', 'azure', 'microsoft azure', 'vercel', 'netlify', 'heroku', 'digitalocean', 'linode', 'cloudflare', 'firebase', 'supabase', 'planetscale', 'railway', 'render', 'fly.io', 'aws lambda', 'lambda', 'cloudformation', 'cdk', 'pulumi', 'terraform', 'kubernetes', 'k8s', 'ecs', 'eks', 'ec2', 's3', 'rds', 'dynamodb', 'cloudfront', 'route53', 'iam', 'cognito', 'api gateway', 'sns', 'sqs', 'eventbridge', 'step functions', 'fargate', 'ecr', 'oracle cloud', 'oracle cloud infrastructure', 'oci', 'oci cloud'],
  other: []
};

export function categorizeSkill(skill) {
  const normalized = normalizeSkill(skill);
  const lowerSkill = skill.toLowerCase();
  const lowerNormalized = normalized.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (
        lowerSkill === lowerKeyword ||
        lowerNormalized === lowerKeyword ||
        lowerNormalized === lowerKeyword.replace(/\.js$/, '') ||
        lowerKeyword === lowerNormalized.replace(/\.js$/, '')
      ) {
        return category;
      }
    }
  }
  
  return 'other';
}

export function buildSkillsObjectFromResume(resume) {
  const allSkills = new Set();
  
  if (resume.skills?.programmingLanguages) {
    resume.skills.programmingLanguages.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.frameworks) {
    resume.skills.frameworks.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.databases) {
    resume.skills.databases.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.tools) {
    resume.skills.tools.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.cloud) {
    resume.skills.cloud.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.other) {
    resume.skills.other.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  if (resume.skills?.skills) {
    resume.skills.skills.forEach(s => allSkills.add(normalizeSkill(s)));
  }
  
  if (resume.experience) {
    resume.experience.forEach(exp => {
      if (exp.skills) {
        exp.skills.forEach(s => allSkills.add(normalizeSkill(s)));
      }
    });
  }
  
  if (resume.projects) {
    resume.projects.forEach(proj => {
      if (proj.technologies) {
        proj.technologies.forEach(s => allSkills.add(normalizeSkill(s)));
      }
    });
  }
  
  if (resume.certifications) {
    resume.certifications.forEach(cert => {
      if (cert.name) {
        allSkills.add(normalizeSkill(cert.name));
      }
    });
  }
  
  const categorized = {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    tools: [],
    cloud: [],
    other: []
  };
  
  for (const skill of allSkills) {
    const category = categorizeSkill(skill);
    if (!categorized[category].includes(skill)) {
      categorized[category].push(skill);
    }
  }
  
  return categorized;
}

export function normalizeStoredResumeSkills(resume) {
  const existingSkills = resume.skills || {};
  const hasStructuredSkills = (
    existingSkills.programmingLanguages?.length > 0 ||
    existingSkills.frameworks?.length > 0 ||
    existingSkills.databases?.length > 0 ||
    existingSkills.tools?.length > 0 ||
    existingSkills.cloud?.length > 0 ||
    existingSkills.other?.length > 0
  );
  
  if (hasStructuredSkills) {
    return existingSkills;
  }
  
  console.log('[Resume] Structured skills missing/incomplete');
  console.log('[Resume] Migrating stored skills');
  
  const migratedSkills = buildSkillsObjectFromResume(resume);
  
  console.log('[Resume] Resume skills migration completed');
  
  return migratedSkills;
}

const OPTIONAL_INDICATORS = [
  'is a plus',
  'nice to have',
  'nice-to-have',
  'preferred',
  'bonus',
  'desirable',
  'good to have',
  'advantage',
  'optional'
];

function isOptionalPhrase(text) {
  const lower = text.toLowerCase();
  return OPTIONAL_INDICATORS.some(indicator => lower.includes(indicator));
}

const FILLER_WORDS = [
  'good command of',
  'strong knowledge of',
  'basic knowledge of',
  'understanding of',
  'experience with',
  'knowledge of',
  'familiarity with',
  'proficiency in',
  'working knowledge of',
  'hands on experience with',
  'hands-on experience with',
  'solid understanding of',
  'deep understanding of',
  'expertise in',
  'mastery of'
];

function stripFillerWords(text) {
  let cleaned = text.toLowerCase().trim();
  
  for (const filler of FILLER_WORDS) {
    if (cleaned.startsWith(filler)) {
      cleaned = cleaned.substring(filler.length).trim();
    }
  }
  
  // Remove trailing "is a plus" etc.
  for (const indicator of OPTIONAL_INDICATORS) {
    if (cleaned.endsWith(indicator)) {
      cleaned = cleaned.substring(0, cleaned.length - indicator.length).trim();
    }
  }
  
  // Remove trailing patterns like "/ database knowledge", "/ knowledge", " knowledge"
  cleaned = cleaned.replace(/\s*\/\s*(database|sql|nosql)\s*(knowledge)?\s*$/i, '').trim();
  cleaned = cleaned.replace(/\s*(database|sql|nosql)\s*knowledge\s*$/i, '').trim();
  cleaned = cleaned.replace(/\s*knowledge\s*$/i, '').trim();
  
  return cleaned;
}

export function normalizeJobSkills(job) {
  const rawSkills = job.skills || [];
  
  if (!Array.isArray(rawSkills) || rawSkills.length === 0) {
    return [];
  }
  
  // Check if already in new format (array of objects with name/required)
  const isNewFormat = rawSkills.length > 0 && 
    typeof rawSkills[0] === 'object' && 
    rawSkills[0] !== null && 
    'name' in rawSkills[0] && 
    'required' in rawSkills[0];
  
  if (isNewFormat) {
    // Already in new format, just normalize skill names
    return rawSkills.map(s => ({
      name: normalizeSkill(s.name),
      required: s.required !== false
    })).filter(s => s.name);
  }
  
  // Old format: array of strings (descriptive phrases)
  console.log('[JOB] Migrating cached job skills from old format');
  
  return rawSkills.map(skillText => {
    if (typeof skillText !== 'string') return null;
    
    const isOptional = isOptionalPhrase(skillText);
    const cleaned = stripFillerWords(skillText);
    const normalized = normalizeSkill(cleaned);
    
    return {
      name: normalized,
      required: !isOptional
    };
  }).filter(s => s && s.name);
}

export function extractJobSkills(job) {
  const skills = job.skills || [];
  
  if (!Array.isArray(skills)) return [];
  
  // Handle both old and new formats
  if (skills.length > 0 && typeof skills[0] === 'object' && 'name' in skills[0]) {
    return skills.map(s => normalizeSkill(s.name)).filter(Boolean);
  }
  
  // Old format: array of strings
  return skills.map(s => normalizeSkill(s)).filter(Boolean);
}
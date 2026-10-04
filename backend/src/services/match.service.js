import { extractAllSkills, extractJobSkills, normalizeSkill } from '../utils/skillNormalizer.js';

const MATCH_WEIGHTS = {
  skills: 40,
  experience: 20,
  projects: 15,
  education: 10,
  location: 5,
  workMode: 5,
  eligibility: 5
};

const MATCH_THRESHOLDS = {
  apply: 70,
  consider: 55
};

function calculateSkillScore(job, resume) {
  // Extract skills from job (handles both old and new formats)
  const jobSkills = extractJobSkills(job);
  
  // Separate required and optional skills
  const rawJobSkills = job.skills || [];
  const isNewFormat = rawJobSkills.length > 0 && 
    typeof rawJobSkills[0] === 'object' && 
    'name' in rawJobSkills[0] && 
    'required' in rawJobSkills[0];
  
  let requiredSkills = [];
  let optionalSkills = [];
  
  if (isNewFormat) {
    for (const s of job.skills) {
      if (s.required !== false) {
        requiredSkills.push(normalizeSkill(s.name));
      } else {
        optionalSkills.push(normalizeSkill(s.name));
      }
    }
  } else {
    // Old format - all required
    requiredSkills = job.skills.map(s => normalizeSkill(s)).filter(Boolean);
  }
  
  // Get all resume skills
  const resumeSkills = extractAllSkills(resume);
  const resumeNormalized = new Set(resumeSkills.map(s => s.toLowerCase()));
  
  const requiredNormalized = new Set(requiredSkills.map(s => s.toLowerCase()));
  const optionalNormalized = new Set(optionalSkills.map(s => s.toLowerCase()));
  
  let matched = 0;
  const matchedSkills = [];
  const missingSkills = [];
  const matchedOptional = [];
  
  // Check required skills
  for (const skill of requiredNormalized) {
    if (resumeNormalized.has(skill)) {
      matched++;
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }
  
  // Check optional skills (for reporting, not scoring)
  for (const skill of optionalNormalized) {
    if (resumeNormalized.has(skill)) {
      matchedOptional.push(skill);
    }
  }
  
  const allJobSkills = new Set([...requiredNormalized, ...optionalNormalized]);
  const additionalSkills = [...resumeNormalized].filter(s => !allJobSkills.has(s));
  
  // Score based on required skills only
  const score = requiredNormalized.size > 0 ? (matched / requiredNormalized.size) * 100 : 100;
  
  return {
    score: Math.round(score),
    matchedSkills,
    missingSkills,
    additionalSkills,
    optionalSkills,
    matchedOptional
  };
}

function calculateExperienceScore(job, resume) {
  const jobExpReq = job.experience ? job.experience.toLowerCase() : '';
  const jobDesc = job.description ? job.description.toLowerCase() : '';
  const combinedText = `${jobExpReq} ${jobDesc}`;
  
  const isEntryLevel = combinedText.includes('intern') || 
    combinedText.includes('entry') || 
    combinedText.includes('fresher') ||
    combinedText.includes('0-1') ||
    combinedText.includes('0-2') ||
    combinedText.includes('new grad') ||
    combinedText.includes('recent graduate');
  
  const isSenior = combinedText.includes('senior') || 
    combinedText.includes('lead') || 
    combinedText.includes('principal') ||
    combinedText.includes('5+') ||
    combinedText.includes('6+') ||
    combinedText.includes('7+') ||
    combinedText.includes('8+') ||
    combinedText.includes('10+');
  
  const isMidLevel = combinedText.includes('2+') || 
    combinedText.includes('3+') ||
    combinedText.includes('4+');
  
  const resumeExperience = resume.experience || [];
  const totalExpCount = resumeExperience.length;
  
  let relevantExpCount = 0;
  const relevantSkills = new Set();
  
  const jobSkills = new Set(
    extractJobSkills(job).map(s => s.toLowerCase())
  );
  
  resumeExperience.forEach(exp => {
    const expSkills = (exp.skills || []).map(s => s.toLowerCase());
    const expDesc = (exp.description || '').toLowerCase();
    const expTitle = (exp.title || '').toLowerCase();
    
    let hasRelevantSkill = expSkills.some(s => jobSkills.has(s));
    
    if (!hasRelevantSkill) {
      for (const skill of jobSkills) {
        if (expDesc.includes(skill) || expTitle.includes(skill)) {
          hasRelevantSkill = true;
          break;
        }
      }
    }
    
    if (hasRelevantSkill) {
      relevantExpCount++;
      expSkills.forEach(s => relevantSkills.add(s));
    }
  });
  
  let score = 0;
  let reason = '';
  
  if (isEntryLevel) {
    if (totalExpCount === 0) {
      score = 80;
      reason = 'Entry-level position suitable for candidates with limited experience';
    } else if (relevantExpCount > 0) {
      score = 90;
      reason = 'Relevant internship/project experience found';
    } else {
      score = 70;
      reason = 'Some experience but limited relevance';
    }
  } else if (isSenior) {
    if (relevantExpCount >= 3) {
      score = 90;
      reason = 'Strong relevant experience for senior role';
    } else if (relevantExpCount >= 1) {
      score = 60;
      reason = 'Some relevant experience but may need more for senior role';
    } else {
      score = 30;
      reason = 'Insufficient relevant experience for senior position';
    }
  } else if (isMidLevel) {
    if (relevantExpCount >= 2) {
      score = 85;
      reason = 'Good relevant experience for mid-level role';
    } else if (relevantExpCount >= 1) {
      score = 65;
      reason = 'Some relevant experience';
    } else {
      score = 40;
      reason = 'Limited relevant experience';
    }
  } else {
    if (relevantExpCount >= 2) {
      score = 80;
      reason = 'Good relevant experience';
    } else if (relevantExpCount >= 1) {
      score = 60;
      reason = 'Some relevant experience';
    } else if (totalExpCount > 0) {
      score = 45;
      reason = 'Experience present but limited relevance to job requirements';
    } else {
      score = 30;
      reason = 'No professional experience listed';
    }
  }
  
  return {
    score: Math.round(score),
    reason
  };
}

function calculateProjectScore(job, resume) {
  const jobSkills = extractJobSkills(job);
  const jobDesc = (job.description || '').toLowerCase();
  
  const projects = resume.projects || [];
  if (projects.length === 0) {
    return {
      score: 0,
      relevantProjects: [],
      reason: 'No projects listed on resume'
    };
  }
  
  const relevantProjects = [];
  
  projects.forEach(proj => {
    const projTechs = (proj.technologies || []).map(t => t.toLowerCase());
    const projDesc = (proj.description || '').toLowerCase();
    const projName = (proj.name || '').toLowerCase();
    
    let matchCount = 0;
    const allProjText = `${projName} ${projDesc} ${projTechs.join(' ')}`;
    
    for (const skill of jobSkills) {
      if (allProjText.includes(skill)) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      relevantProjects.push(proj.name);
    }
  });
  
  if (relevantProjects.length === 0) {
    return {
      score: 20,
      relevantProjects: [],
      reason: 'Projects listed but none directly relevant to job requirements'
    };
  }
  
  const relevanceRatio = relevantProjects.length / projects.length;
  const score = Math.min(100, Math.round(50 + relevanceRatio * 50));
  
  return {
    score,
    relevantProjects,
    reason: `${relevantProjects.length} of ${projects.length} projects demonstrate relevant technologies`
  };
}

function calculateEducationScore(job, resume) {
  const jobEligibility = (job.eligibility || []).map(e => e.toLowerCase());
  const jobDesc = (job.description || '').toLowerCase();
  const combinedEligibility = [...jobEligibility, ...jobDesc.split(/\s+/)];
  
  const education = resume.education || [];
  
  if (education.length === 0) {
    if (combinedEligibility.some(e => e.includes('degree') || e.includes('bachelor') || e.includes('master') || e.includes('phd'))) {
      return {
        score: 20,
        reason: 'No education listed but job may require degree'
      };
    }
    return {
      score: 50,
      reason: 'No education listed and no explicit degree requirement'
    };
  }
  
  let hasCSDegree = false;
  let hasRelevantDegree = false;
  let graduationYear = null;
  
  education.forEach(edu => {
    const degree = (edu.degree || '').toLowerCase();
    const field = (edu.details || '').toLowerCase();
    const year = edu.year;
    
    if (degree.includes('computer') || degree.includes('cs') || degree.includes('software') || 
        degree.includes('information technology') || degree.includes('it') ||
        field.includes('computer') || field.includes('software')) {
      hasCSDegree = true;
      hasRelevantDegree = true;
    }
    
    if (degree.includes('bachelor') || degree.includes('master') || degree.includes('phd')) {
      hasRelevantDegree = true;
    }
    
    if (year && !graduationYear) {
      graduationYear = parseInt(year);
    }
  });
  
  const requiresDegree = combinedEligibility.some(e => 
    e.includes('degree') || e.includes('bachelor') || e.includes('master') || e.includes('phd')
  );
  
  let score = 0;
  let reason = '';
  
  if (requiresDegree) {
    if (hasCSDegree) {
      score = 95;
      reason = 'Relevant CS/IT degree meets requirement';
    } else if (hasRelevantDegree) {
      score = 75;
      reason = 'Degree present but may not be in CS/IT field';
    } else {
      score = 40;
      reason = 'Degree requirement not clearly met';
    }
  } else {
    if (hasCSDegree) {
      score = 90;
      reason = 'Strong CS/IT educational background';
    } else if (hasRelevantDegree) {
      score = 70;
      reason = 'Relevant degree present';
    } else {
      score = 60;
      reason = 'Education listed but not directly related to tech role';
    }
  }
  
  if (graduationYear) {
    const currentYear = new Date().getFullYear();
    if (currentYear - graduationYear <= 2) {
      reason += ' (Recent graduate)';
    }
  }
  
  return {
    score: Math.round(score),
    reason
  };
}

function calculateLocationScore(job, resume) {
  const jobLocation = (job.location || '').toLowerCase();
  const jobWorkMode = (job.workMode || '').toLowerCase();
  const resumeLocation = (resume.personal?.location || '').toLowerCase();
  
  if (!jobLocation && !resumeLocation) {
    return { status: 'UNKNOWN', reason: 'Location information not available for job or candidate' };
  }
  
  if (!jobLocation) {
    return { status: 'UNKNOWN', reason: 'Job location not specified' };
  }
  
  if (!resumeLocation) {
    return { status: 'UNKNOWN', reason: 'Candidate location not specified' };
  }
  
  const isRemote = jobWorkMode.includes('remote');
  const isHybrid = jobWorkMode.includes('hybrid');
  const isWFO = jobWorkMode.includes('office') || jobWorkMode.includes('wfo');
  
  if (isRemote) {
    return { status: 'MATCH', reason: 'Remote position - location not a constraint' };
  }
  
  const jobCity = jobLocation.split(',')[0].trim();
  const resumeCity = resumeLocation.split(',')[0].trim();
  
  if (jobCity === resumeCity) {
    return { status: 'MATCH', reason: `Same city (${jobCity})` };
  }
  
  const nearbyCities = {
    'gurugram': ['delhi', 'new delhi', 'noida', 'faridabad', 'ghaziabad', 'ncr', 'delhi ncr'],
    'delhi': ['gurugram', 'new delhi', 'noida', 'faridabad', 'ghaziabad', 'ncr', 'delhi ncr'],
    'new delhi': ['delhi', 'gurugram', 'noida', 'faridabad', 'ghaziabad', 'ncr', 'delhi ncr'],
    'noida': ['delhi', 'gurugram', 'new delhi', 'faridabad', 'ghaziabad', 'ncr', 'delhi ncr'],
    'bangalore': ['bengaluru'],
    'bengaluru': ['bangalore'],
    'mumbai': ['navi mumbai', 'thane'],
    'navi mumbai': ['mumbai', 'thane'],
    'pune': ['pimpri', 'chinchwad'],
    'hyderabad': ['secunderabad'],
    'secunderabad': ['hyderabad'],
    'chennai': [],
    'kolkata': []
  };
  
  const nearby = nearbyCities[jobCity] || [];
  if (nearby.includes(resumeCity)) {
    return { status: 'PARTIAL', reason: `Nearby city (${resumeCity} near ${jobCity})` };
  }
  
  const sameState = jobCity.split(' ')[0] === resumeCity.split(' ')[0];
  if (sameState) {
    return { status: 'PARTIAL', reason: `Same state/region but different city` };
  }
  
  if (isHybrid) {
    return { status: 'PARTIAL', reason: 'Hybrid work mode may allow commuting' };
  }
  
  if (isWFO) {
    return { status: 'MISMATCH', reason: `Work from office required in ${jobLocation}, candidate in ${resumeLocation}` };
  }
  
  return { status: 'PARTIAL', reason: `Different locations (${resumeLocation} vs ${jobLocation})` };
}

function calculateWorkModeScore(job, resume) {
  const jobWorkMode = (job.workMode || '').toLowerCase();
  
  if (!jobWorkMode) {
    return { status: 'UNKNOWN', reason: 'Work mode not specified in job posting' };
  }
  
  if (jobWorkMode.includes('remote')) {
    return { status: 'MATCH', reason: 'Remote position - flexible work arrangement' };
  }
  
  if (jobWorkMode.includes('hybrid')) {
    return { status: 'PARTIAL', reason: 'Hybrid work mode offered' };
  }
  
  if (jobWorkMode.includes('office') || jobWorkMode.includes('wfo')) {
    return { status: 'PARTIAL', reason: 'Work from office required - depends on candidate location' };
  }
  
  return { status: 'UNKNOWN', reason: 'Work mode not clearly specified' };
}

function calculateEligibilityScore(job, resume) {
  const eligibility = (job.eligibility || []).map(e => e.toLowerCase());
  const jobDesc = (job.description || '').toLowerCase();
  const combined = [...eligibility, ...jobDesc.split(/\s+/)];
  
  const hasBatchReq = combined.some(e => 
    e.includes('2024') || e.includes('2025') || e.includes('2026') || 
    e.includes('batch') || e.includes('graduating')
  );
  
  const hasDegreeReq = combined.some(e => 
    e.includes('degree') || e.includes('bachelor') || e.includes('master') || 
    e.includes('phd') || e.includes('b.tech') || e.includes('m.tech') ||
    e.includes('bca') || e.includes('mca') || e.includes('bsc') || e.includes('msc')
  );
  
  const hasCertReq = combined.some(e => 
    e.includes('certif') || e.includes('ca') || e.includes('cma') || 
    e.includes('cpa') || e.includes('cfa') || e.includes('pmp')
  );
  
  let score = 70;
  const passed = [];
  const failed = [];
  const unclear = [];
  
  if (hasBatchReq) {
    const education = resume.education || [];
    const recentGrad = education.some(edu => {
      const year = parseInt(edu.year);
      return year && year >= 2023;
    });
    
    if (recentGrad) {
      score += 15;
      passed.push('Recent graduate (matches batch requirement)');
    } else {
      score -= 20;
      failed.push('Does not match batch/year requirement');
    }
  }
  
  if (hasDegreeReq) {
    const education = resume.education || [];
    const hasDegree = education.some(edu => 
      (edu.degree || '').toLowerCase().includes('bachelor') ||
      (edu.degree || '').toLowerCase().includes('master') ||
      (edu.degree || '').toLowerCase().includes('phd') ||
      (edu.degree || '').toLowerCase().includes('b.tech') ||
      (edu.degree || '').toLowerCase().includes('m.tech') ||
      (edu.degree || '').toLowerCase().includes('bca') ||
      (edu.degree || '').toLowerCase().includes('mca')
    );
    
    if (hasDegree) {
      score += 10;
      passed.push('Degree requirement met');
    } else {
      score -= 15;
      failed.push('Degree requirement not met');
    }
  }
  
  if (hasCertReq) {
    const certs = resume.certifications || [];
    if (certs.length > 0) {
      score += 5;
      passed.push('Certifications present');
    } else {
      score -= 10;
      failed.push('Required certification not found');
    }
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score: Math.round(score),
    passed,
    failed,
    unclear
  };
}

function generateSummary(job, resume, skillResult, experienceResult, projectResult, educationResult, locationResult, workModeResult, eligibilityResult) {
  const parts = [];
  
  if (skillResult.score >= 80) {
    parts.push(`Strong skill match (${skillResult.matchedSkills.length}/${skillResult.matchedSkills.length + skillResult.missingSkills.length} required skills)`);
  } else if (skillResult.score >= 50) {
    parts.push(`Moderate skill match (${skillResult.matchedSkills.length}/${skillResult.matchedSkills.length + skillResult.missingSkills.length} required skills)`);
  } else {
    parts.push(`Weak skill match (${skillResult.matchedSkills.length}/${skillResult.matchedSkills.length + skillResult.missingSkills.length} required skills)`);
  }
  
  if (experienceResult.score >= 70) {
    parts.push(experienceResult.reason);
  } else if (experienceResult.score >= 40) {
    parts.push(experienceResult.reason);
  }
  
  if (projectResult.relevantProjects.length > 0) {
    parts.push(`${projectResult.relevantProjects.length} relevant project(s)`);
  }
  
  if (educationResult.score >= 70) {
    parts.push('Education requirements met');
  }
  
  if (locationResult.status === 'MATCH') {
    parts.push('Location compatible');
  } else if (locationResult.status === 'MISMATCH') {
    parts.push('Location mismatch');
  }
  
  if (eligibilityResult.failed.length > 0) {
    parts.push(`Hard requirement(s) not met: ${eligibilityResult.failed.join(', ')}`);
  }
  
  return parts.join('. ') + '.';
}

function generateStrengths(job, resume, skillResult, experienceResult, projectResult, educationResult) {
  const strengths = [];
  
  if (skillResult.matchedSkills.length > 0) {
    strengths.push(`Strong in: ${skillResult.matchedSkills.slice(0, 5).join(', ')}`);
  }
  
  if (experienceResult.score >= 70) {
    strengths.push('Relevant professional experience');
  }
  
  if (projectResult.relevantProjects.length > 0) {
    strengths.push(`Relevant projects: ${projectResult.relevantProjects.slice(0, 3).join(', ')}`);
  }
  
  if (educationResult.score >= 70) {
    strengths.push('Meets education requirements');
  }
  
  return strengths;
}

function generateGaps(job, resume, skillResult, experienceResult, eligibilityResult) {
  const gaps = [];
  
  if (skillResult.missingSkills.length > 0) {
    gaps.push(`Missing skills: ${skillResult.missingSkills.slice(0, 5).join(', ')}`);
  }
  
  if (experienceResult.score < 50) {
    gaps.push('Limited relevant experience');
  }
  
  if (eligibilityResult.failed.length > 0) {
    gaps.push(`Failed hard requirements: ${eligibilityResult.failed.join(', ')}`);
  }
  
  return gaps;
}

export function matchJobWithResume(job, resume) {
  const skillResult = calculateSkillScore(job, resume);
  const experienceResult = calculateExperienceScore(job, resume);
  const projectResult = calculateProjectScore(job, resume);
  const educationResult = calculateEducationScore(job, resume);
  const locationResult = calculateLocationScore(job, resume);
  const workModeResult = calculateWorkModeScore(job, resume);
  const eligibilityResult = calculateEligibilityScore(job, resume);
  
  const weightedScore = 
    (skillResult.score * MATCH_WEIGHTS.skills) / 100 +
    (experienceResult.score * MATCH_WEIGHTS.experience) / 100 +
    (projectResult.score * MATCH_WEIGHTS.projects) / 100 +
    (educationResult.score * MATCH_WEIGHTS.education) / 100 +
    (locationResult.status === 'MATCH' ? MATCH_WEIGHTS.location : 
     locationResult.status === 'PARTIAL' ? MATCH_WEIGHTS.location * 0.5 : 0) +
    (workModeResult.status === 'MATCH' ? MATCH_WEIGHTS.workMode :
     workModeResult.status === 'PARTIAL' ? MATCH_WEIGHTS.workMode * 0.5 : 0) +
    (eligibilityResult.score * MATCH_WEIGHTS.eligibility) / 100;
  
  const matchScore = Math.round(Math.max(0, Math.min(100, weightedScore)));
  
  let recommendation;
  if (eligibilityResult.failed.length > 0) {
    recommendation = 'SKIP';
  } else if (matchScore >= MATCH_THRESHOLDS.apply) {
    recommendation = 'APPLY';
  } else if (matchScore >= MATCH_THRESHOLDS.consider) {
    recommendation = 'CONSIDER';
  } else {
    recommendation = 'SKIP';
  }
  
  const summary = generateSummary(job, resume, skillResult, experienceResult, projectResult, educationResult, locationResult, workModeResult, eligibilityResult);
  const strengths = generateStrengths(job, resume, skillResult, experienceResult, projectResult, educationResult);
  const gaps = generateGaps(job, resume, skillResult, experienceResult, eligibilityResult);
  
  return {
    matchScore,
    recommendation,
    summary,
    matchedSkills: skillResult.matchedSkills,
    missingSkills: skillResult.missingSkills,
    additionalSkills: skillResult.additionalSkills,
    optionalSkills: skillResult.optionalSkills,
    matchedOptional: skillResult.matchedOptional,
    hardRequirements: {
      passed: eligibilityResult.passed,
      failed: eligibilityResult.failed,
      unclear: eligibilityResult.unclear
    },
    experienceMatch: experienceResult,
    educationMatch: educationResult,
    projectMatch: projectResult,
    locationMatch: locationResult,
    workModeMatch: workModeResult,
    strengths,
    gaps
  };
}
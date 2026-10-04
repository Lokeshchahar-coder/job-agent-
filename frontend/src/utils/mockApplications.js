const MOCK_APPLICATIONS = [
  {
    id: 'app-001',
    company: 'InnovateLabs',
    role: 'Software Engineer Intern',
    recipient: 'hr@innovatelabs.com',
    status: 'sent',
    durationMs: 3200,
    createdAt: '2026-08-27T10:30:00Z',
    jobText: 'Company: InnovateLabs\nRole: Software Engineer Intern\nLocation: Hyderabad / Remote\nEligibility: 2026 / 2027\n\nWork on production software applications.\nDevelop APIs and backend services.\nParticipate in code reviews.\n\nRequired: Python, REST APIs, Git, DSA\nPreferred: React.js, FastAPI, MongoDB, AWS',
    timing: { fileRead: '1.2ms', smtp: '2.8s', total: '3.2s' },
  },
  {
    id: 'app-002',
    company: 'DevBazar',
    role: 'Python Developer Intern',
    recipient: 'saurabh.sharma1_cs23@gla.ac.in',
    status: 'sent',
    durationMs: 6400,
    createdAt: '2026-08-26T14:15:00Z',
    jobText: 'Company: DevBazar\nRole: Python Developer Intern\nLocation: Remote\n\nBuild backend services using Python and FastAPI.\nWork with PostgreSQL and Redis.\nDeploy on AWS.',
    timing: { fileRead: '1.1ms', smtp: '5.3s', total: '6.4s' },
  },
  {
    id: 'app-003',
    company: 'TechCorp',
    role: 'Backend Intern',
    recipient: 'careers@techcorp.io',
    status: 'failed',
    durationMs: 2100,
    createdAt: '2026-08-25T09:00:00Z',
    jobText: 'Company: TechCorp\nRole: Backend Intern\nLocation: Bangalore\n\nDevelop REST APIs.\nWork with microservices architecture.',
    error: 'Recipient email rejected by server',
  },
  {
    id: 'app-004',
    company: 'CloudNine',
    role: 'Full Stack Developer',
    recruiter: 'talent@cloudnine.dev',
    status: 'sent',
    durationMs: 4100,
    createdAt: '2026-08-24T16:45:00Z',
    jobText: 'Company: CloudNine\nRole: Full Stack Developer\nLocation: Remote\n\nBuild web applications with React and Node.js.\nExperience with cloud services preferred.',
    timing: { fileRead: '1.3ms', smtp: '3.5s', total: '4.1s' },
  },
  {
    id: 'app-005',
    company: 'DataFlow',
    role: 'Data Engineer Intern',
    recipient: 'jobs@dataflow.com',
    status: 'sent',
    durationMs: 5200,
    createdAt: '2026-08-23T11:20:00Z',
    jobText: 'Company: DataFlow\nRole: Data Engineer Intern\nLocation: Hyderabad\n\nBuild data pipelines.\nWork with Apache Spark and Kafka.',
    timing: { fileRead: '1.0ms', smtp: '4.6s', total: '5.2s' },
  },
];

export function getMockApplications() {
  return MOCK_APPLICATIONS;
}

export function getMockApplication(id) {
  return MOCK_APPLICATIONS.find((a) => a.id === id) || null;
}

export function addMockApplication(app) {
  MOCK_APPLICATIONS.unshift(app);
  return app;
}

# Job Application Agent — Backend

Personal AI-powered job application backend that parses WhatsApp job notifications into structured data, matches them against resumes, and generates personalized application emails.

## Tech Stack

- **Node.js** (ES Modules)
- **Express.js** — Web framework
- **Axios** — HTTP client for AI API
- **dotenv** — Environment variables
- **CORS** — Cross-origin requests
- **Nodemon** — Development hot reload
- **pdf-parse** — PDF text extraction
- **multer** — File upload handling
- **nodemailer** — Email sending

## Folder Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── job.controller.js
│   │   ├── resume.controller.js
│   │   ├── match.controller.js
│   │   ├── email.controller.js
│   │   ├── emailSender.controller.js
│   │   └── apply.controller.js
│   ├── routes/
│   │   ├── job.routes.js
│   │   ├── resume.routes.js
│   │   ├── match.routes.js
│   │   ├── email.routes.js
│   │   ├── emailSender.routes.js
│   │   └── apply.routes.js
│   ├── services/
│   │   ├── ai.service.js
│   │   └── email.service.js
│   ├── prompts/
│   │   ├── jobParser.prompt.js
│   │   ├── resumeParser.prompt.js
│   │   ├── jobResumeMatcher.prompt.js
│   │   └── emailGenerator.prompt.js
│   ├── utils/
│   │   └── response.js
│   └── server.js
├── resume/
│   └── .gitkeep
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
AI_API_KEY=your_groq_api_key
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=llama3-70b-8192
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=http://localhost:5173
```

**Groq Model Names:** Use valid Groq model IDs (not OpenAI names). Examples:
- `llama3-8b-8192`
- `llama3-70b-8192`
- `mixtral-8x7b-32768`
- `gemma-7b-it`
- `gemma2-9b-it`

Get your API key from: https://console.groq.com/keys

**Gmail App Password Setup:**
1. Enable 2-Step Verification on your Google Account
2. Go to App Passwords in Google Account settings
3. Generate an app password for "Mail"
4. Use that app password as `EMAIL_PASS` (NOT your normal Gmail password)

## Development

```bash
npm run dev
```

Server runs at `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Parse Job Notification
```
POST /api/jobs/parse
```

**Request:**
```json
{
  "text": "raw WhatsApp notification here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Job parsed successfully",
  "data": {
    "company": "Spyne",
    "role": "SDE Intern",
    "location": "Gurugram",
    "workMode": "Work From Office",
    "salary": "₹30,000–₹40,000/month",
    "experience": null,
    "eligibility": [],
    "skills": ["JavaScript", "React.js", "Node.js", "REST APIs", "Databases", "Data Structures & Algorithms", "Git / GitHub", "HTML & CSS", "AWS"],
    "description": "Internship duration: 6 months. Work on real-world software development projects...",
    "email": null,
    "applyLink": "https://spyneai.keka.com/careers/applyjob/156605"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Job notification text is required"
}
```

### Parse Resume
```
POST /api/resume/parse
```
**Content-Type:** `multipart/form-data`
**Field:** `resume` (PDF file, max 5MB)

**Response (Success):**
```json
{
  "success": true,
  "message": "Resume parsed successfully",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "location": "Gurugram",
    "summary": "Full-stack developer...",
    "skills": [...],
    "programmingLanguages": [...],
    "frameworks": [...],
    "databases": [...],
    "tools": [...],
    "cloud": [...],
    "education": [...],
    "experience": [...],
    "projects": [...],
    "certifications": [...],
    "achievements": [...],
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.dev"
  }
}
```

### Job ↔ Resume Match
```
POST /api/match
```

**Request:**
```json
{
  "job": {
    "company": "Spyne",
    "role": "SDE Intern",
    "location": "Gurugram",
    "workMode": "Work From Office",
    "salary": "₹30,000–₹40,000/month",
    "experience": null,
    "eligibility": [],
    "skills": ["JavaScript", "React.js", "Node.js", "REST APIs", "Databases", "Data Structures & Algorithms", "Git / GitHub", "HTML & CSS", "AWS"],
    "description": "...",
    "email": null,
    "applyLink": "https://..."
  },
  "resume": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "location": "Gurugram",
    "summary": "Full-stack developer...",
    "skills": ["JavaScript", "React", "Node.js", "Express", "MongoDB", "Git", "HTML", "CSS"],
    "programmingLanguages": ["JavaScript", "TypeScript"],
    "frameworks": ["React", "Node.js", "Express"],
    "databases": ["MongoDB"],
    "tools": ["Git", "GitHub", "VS Code"],
    "cloud": [],
    "education": [{"degree": "B.Tech CSE", "institution": "XYZ University", "year": "2024"}],
    "experience": [{"title": "SDE Intern", "company": "ABC Corp", "duration": "6 months", "description": "Built React/Node apps"}],
    "projects": [{"name": "E-commerce App", "technologies": ["React", "Node.js", "MongoDB"]}],
    "certifications": [],
    "achievements": [],
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": null
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Match analysis completed",
  "data": {
    "matchScore": 85,
    "recommendation": "APPLY",
    "summary": "Strong match for the SDE Intern role due to React, Node.js, JavaScript and REST API experience. AWS is not mentioned in the resume, but it is listed as good to have rather than mandatory.",
    "matchedSkills": ["JavaScript", "React.js", "Node.js", "REST APIs", "Git / GitHub", "HTML & CSS"],
    "missingSkills": ["AWS", "Data Structures & Algorithms"],
    "additionalSkills": ["TypeScript", "Express", "MongoDB"],
    "hardRequirements": {
      "passed": ["Bachelor's degree", "2024 batch"],
      "failed": [],
      "unclear": ["AWS experience"]
    },
    "experienceMatch": {
      "score": 80,
      "reason": "Relevant internship experience with React and Node.js. Projects demonstrate full-stack capabilities."
    },
    "educationMatch": {
      "score": 90,
      "reason": "B.Tech CSE 2024 graduate matches typical internship eligibility."
    },
    "projectMatch": {
      "score": 85,
      "relevantProjects": ["E-commerce App"],
      "reason": "Projects demonstrate React, Node.js and database experience."
    },
    "locationMatch": {
      "status": "MATCH",
      "reason": "Candidate in Gurugram, job in Gurugram with Work From Office mode."
    },
    "workModeMatch": {
      "status": "MATCH",
      "reason": "Candidate location compatible with Work From Office requirement."
    },
    "strengths": [
      "Strong React.js and Node.js experience",
      "REST API development knowledge",
      "Relevant full-stack projects",
      "Git/GitHub proficiency"
    ],
    "gaps": [
      "AWS is not mentioned in resume",
      "Data Structures & Algorithms not explicitly mentioned"
    ]
  }
}
```

**Recommendation Meanings:**
- `STRONG_APPLY` (90-100): Excellent match, high confidence
- `APPLY` (75-89): Good match, recommended to apply
- `CONSIDER` (55-74): Moderate match, consider if interested
- `SKIP` (0-54): Poor match, likely not worth applying

### Generate Application Email
```
POST /api/email/generate
```

**Request:**
```json
{
  "emailType": "APPLICATION",
  "job": {
    "company": "Spyne",
    "role": "SDE Intern",
    "location": "Gurugram",
    "workMode": "Work From Office",
    "skills": ["JavaScript", "React.js", "Node.js", "REST APIs"],
    "description": "Work on real-world software development projects.",
    "email": "hr@example.com",
    "applyLink": "https://example.com/apply"
  },
  "resume": {
    "name": "Dinesh Sharma",
    "email": "dinesh@example.com",
    "phone": "+91XXXXXXXXXX",
    "skills": ["JavaScript", "React.js", "Node.js", "MongoDB"],
    "programmingLanguages": ["JavaScript"],
    "frameworks": ["React", "Node.js", "Express"],
    "experience": [],
    "projects": [
      {
        "name": "Job Application Automation",
        "description": "Built a job automation backend using Node.js and AI."
      }
    ],
    "education": [],
    "github": "https://github.com/example",
    "linkedin": "https://linkedin.com/in/example",
    "portfolio": null
  },
  "match": {
    "matchScore": 88,
    "recommendation": "APPLY",
    "matchedSkills": ["JavaScript", "React.js", "Node.js"],
    "missingSkills": [],
    "strengths": ["Strong JavaScript experience", "Relevant React and Node.js projects"],
    "gaps": []
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Application email generated successfully",
  "data": {
    "subject": "Application for SDE Intern – Dinesh Sharma",
    "recipient": "hr@example.com",
    "body": "Dear Hiring Team,\n\nI am writing to apply for the SDE Intern position at Spyne. With hands-on experience in JavaScript, React.js and Node.js, I am particularly interested in contributing to your engineering team...\n\nBest regards,\nDinesh Sharma\nEmail: dinesh@example.com\nPhone: +91XXXXXXXXXX\nLinkedIn: https://linkedin.com/in/example\nGitHub: https://github.com/example",
    "attachments": [
      {
        "type": "resume",
        "required": true
      }
    ],
    "personalization": {
      "skillsMentioned": ["JavaScript", "React.js", "Node.js"],
      "projectsMentioned": ["Job Application Automation"],
      "experienceMentioned": []
    }
  }
}
```

**Email Type:**
- `APPLICATION` (default): Standard job application email
- Other types not yet implemented

**Recipient Behavior:**
- If `job.email` exists: `recipient` will be that email
- If `job.email` is missing: `recipient` will be `null`

**Attachment Metadata:**
The `attachments` field indicates that a resume should be attached. This is metadata for future Gmail integration — no actual file attachment is included in the response.

## Example Request (curl)

### Job Parser
```bash
curl -X POST http://localhost:5000/api/jobs/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🚨Free Hiring Alert 🚨\n\nCompany: Spyne\nRole: SDE Intern\nStipend: ₹30,000–₹40,000/month\nLocation: Gurugram – Work From Office\n\n🛠 Required Skills:\nJavaScript\nReact.js\nNode.js\nREST APIs\nDatabases\nData Structures & Algorithms\nGit / GitHub\nHTML & CSS\nAWS (Good to have)\n\n📌 Job Details:\nInternship duration: 6 months.\nWork on real-world software development projects.\nCollaborate with engineering teams.\nPerformance-based PPO opportunity.\n\n📩 How to Apply:\n\n🔗 Complete Apply Link:\nhttps://spyneai.keka.com/careers/applyjob/156605"
  }'
```

### Resume Parser
```bash
curl -X POST http://localhost:5000/api/resume/parse \
  -F "resume=@/path/to/resume.pdf"
```

### Job-Resume Match
```bash
curl -X POST http://localhost:5000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "job": {...},
    "resume": {...}
  }'
```

### Generate Email
```bash
curl -X POST http://localhost:5000/api/email/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "APPLICATION",
    "job": {...},
    "resume": {...},
    "match": {...}
  }'
```

### Send Application Email
```
POST /api/email/send
```
**Content-Type:** `application/json`

**Request:**
```json
{
  "recipient": "hr@example.com",
  "subject": "Application for SDE Intern – Dinesh Sharma",
  "body": "Dear Hiring Team,\n\nI am writing to apply...\n\nBest regards,\nDinesh Sharma",
  "resumePath": "resume/Dinesh-Sharma-Resume.pdf"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<abc123@gmail.com>",
    "recipient": "hr@example.com",
    "subject": "Application for SDE Intern – Dinesh Sharma",
    "attachment": "Dinesh-Sharma-Resume.pdf"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Resume file not found"
}
```

**Requirements:**
- Resume must be a PDF file inside `backend/resume/`
- Maximum resume size: 5 MB
- Valid Gmail SMTP credentials in `.env` (EMAIL_USER, EMAIL_PASS with App Password)
- Recipient must be a valid email address

**Example curl:**
```bash
curl -X POST http://localhost:5000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "hr@example.com",
    "subject": "Application for SDE Intern – Dinesh Sharma",
    "body": "Dear Hiring Team,\n\nI am writing to apply...",
    "resumePath": "resume/Dinesh-Sharma-Resume.pdf"
  }'
```

### Complete Application Workflow
```
POST /api/apply
```
**Content-Type:** `multipart/form-data`

**Fields:**
- `jobText` (required): Raw job notification/description text
- `resume` (required): PDF resume file (max 5MB)
- `autoSend` (optional): `true` or `false` (default: `false`)

**Workflow:**
1. Validates job text and resume file
2. Parses job notification using AI
3. Parses resume using AI
4. Matches job with resume
5. If recommendation is "SKIP": Returns match result, no email generated
6. If recommendation is "APPLY": Generates application email
7. If `autoSend=true` and valid recipient: Sends email with resume attached
8. If `autoSend=false` (default): Returns generated email, ready to send

**Response Examples:**

**SKIP (match recommendation):**
```json
{
  "success": true,
  "message": "Job analyzed but application skipped based on match recommendation",
  "data": {
    "job": {},
    "resume": {},
    "match": {},
    "email": null,
    "emailGenerated": false,
    "emailSent": false,
    "sendStatus": "SKIPPED"
  }
}
```

**APPLY + autoSend=false (default):**
```json
{
  "success": true,
  "message": "Job application workflow completed successfully",
  "data": {
    "job": {},
    "resume": {},
    "match": {},
    "email": {
      "subject": "Application for SDE Intern – Dinesh Sharma",
      "recipient": "hr@example.com",
      "body": "Dear Hiring Team,...",
      "attachments": [{ "type": "resume", "required": true }],
      "personalization": { "skillsMentioned": [], "projectsMentioned": [], "experienceMentioned": [] }
    },
    "emailGenerated": true,
    "emailSent": false,
    "sendStatus": "READY_TO_SEND"
  }
}
```

**APPLY + autoSend=true + valid recipient:**
```json
{
  "success": true,
  "message": "Job application email sent successfully",
  "data": {
    "job": {},
    "resume": {},
    "match": {},
    "email": {},
    "emailGenerated": true,
    "emailSent": true,
    "sendStatus": "SENT",
    "emailDelivery": {
      "messageId": "<abc123@gmail.com>",
      "recipient": "hr@example.com",
      "subject": "Application for SDE Intern – Dinesh Sharma",
      "attachment": "Dinesh-Sharma-Resume.pdf"
    }
  }
}
```

**Recipient unavailable:**
```json
{
  "success": true,
  "message": "Job matched, but application email cannot be sent because no recipient email was found",
  "data": {
    "job": {},
    "resume": {},
    "match": {},
    "email": {},
    "emailGenerated": true,
    "emailSent": false,
    "sendStatus": "RECIPIENT_UNAVAILABLE"
  }
}
```

**Auto-send Safety:**
- Default `autoSend=false` — generates email but does NOT send
- Requires explicit `autoSend=true` to trigger SMTP sending
- Never invents recipient emails — uses `job.email` from parsed job data
- If `job.email` is missing: `sendStatus: RECIPIENT_UNAVAILABLE`

**Example curl:**
```bash
curl -X POST http://localhost:5000/api/apply \
  -F "jobText=Company: Spyne
Role: SDE Intern
Stipend: ₹30,000–₹40,000/month
Location: Gurugram
Required Skills:
JavaScript
React.js
Node.js
REST APIs
Apply Link: https://example.com/apply" \
  -F "resume=@resume/saurabh_sharma.pdf" \
  -F "autoSend=false"
```

## Current Limitations

- Single job notification per request (batch parsing planned)
- Requires valid AI API key and endpoint
- No database/storage (stateless)
- Gmail SMTP requires App Password (2-Step Verification must be enabled)
- No automatic application submission

## Future Roadmap

### Phase 6 — Application Tracking
Track applications, status, follow-ups.

## Security Notes

- Never commit `.env` file
- API keys loaded from environment variables only
- No secrets in code or responses
- Input validation on all endpoints
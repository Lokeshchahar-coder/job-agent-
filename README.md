# XJobAgent — AI-Powered Job Application Automation Platform

XJobAgent is a full-stack AI-powered job application automation platform designed to simplify and accelerate the job application process.

The platform analyzes unstructured job descriptions, extracts important job information, matches requirements against a user's resume, generates personalized application emails, and sends applications directly through the user's authenticated Gmail account with the resume attached.

## 🚀 Live Demo

**Live Demo:** Add your deployed application URL here

---

## 📌 Overview

Applying to multiple jobs manually can be repetitive and time-consuming. XJobAgent automates the major steps involved in the application workflow through a single platform.

The system combines a modern React frontend with Node.js/Express, Python/FastAPI, MongoDB, Groq-powered AI processing, Gmail API integration, and Google OAuth 2.0.

### What XJobAgent Can Do

* Analyze unstructured job descriptions
* Extract company, role, recipient, requirements, and other job details
* Match job requirements with the user's resume
* Generate personalized, context-aware application emails
* Parse and manage PDF resumes
* Authenticate users securely
* Connect authenticated Gmail accounts
* Send HTML/plain-text emails through Gmail
* Automatically attach the user's PDF resume
* Maintain application history
* Track application status and timing metrics
* Provide a centralized dashboard for managing applications and resumes

---

# ✨ Key Features

## 🤖 AI-Powered Job Analysis

XJobAgent uses Groq-powered LLM processing to analyze unstructured job descriptions and extract relevant information such as:

* Company name
* Job role
* Recipient information
* Job requirements
* Skills
* Responsibilities
* Other relevant job details

The extracted information is then used throughout the application workflow.

## 📄 Resume Management

Users can upload and manage their resumes in PDF format.

The platform supports:

* PDF resume parsing
* Resume storage
* Resume-to-job matching
* User-specific resume management
* Secure resume path validation
* Automatic resume attachment during application delivery

## 🎯 Resume–Job Matching

The system compares the user's resume information with extracted job requirements to help generate application content that is relevant to the specific job.

## ✉️ AI-Generated Application Emails

Instead of sending the same generic message to every company, XJobAgent generates personalized application emails based on:

* Job description
* Extracted job information
* User resume
* Job requirements
* Recipient/company information

The generated email can be delivered as HTML/plain text.

## 🔐 Secure Authentication

The platform provides multi-user authentication using:

* JWT
* bcrypt
* Protected frontend routes
* User-scoped data management

Each user's resumes and application history are managed within their authenticated account.

## 🔑 Google OAuth 2.0 & Gmail API

Users can connect their Gmail account using Google OAuth 2.0.

After authentication, the application can use the Gmail API to send personalized job applications from the user's authenticated Gmail account.

Features include:

* Google OAuth 2.0 authentication
* Gmail account connection
* HTML/plain-text email delivery
* Automatic PDF resume attachment
* Authenticated email sending

## 📊 Application Dashboard

The React dashboard provides a centralized interface for managing the job application workflow.

It includes:

* Application management
* Resume management
* Application history
* Application status tracking
* Timing/performance metrics
* Application details
* Gmail connection management

## ⚡ Performance Optimization

The backend includes several performance and reliability improvements, including:

* SMTP connection pooling
* Transporter warm-up
* PDF buffering
* Timeout controls
* Performance instrumentation
* Secure resume path validation
* Reliable email delivery

The automated workflow can reduce application processing time from approximately **1 minute manually to around 3–4 seconds per application**, depending on the workflow and external services involved.

---

# 🔄 How XJobAgent Works

The overall workflow can be summarized as:

```text
User
  │
  ▼
Login / Signup
  │
  ▼
Upload Resume
  │
  ▼
Provide Job Description
  │
  ▼
AI Job Analysis
  │
  ▼
Extract Job Details
  │
  ├── Company
  ├── Role
  ├── Recipient
  ├── Requirements
  └── Skills
  │
  ▼
Resume ↔ Job Matching
  │
  ▼
AI Email Generation
  │
  ▼
Google OAuth 2.0
  │
  ▼
Authenticated Gmail Account
  │
  ▼
Email + PDF Resume Attachment
  │
  ▼
Gmail API
  │
  ▼
Application Sent
  │
  ▼
Application History & Status
```

---

# 🏗️ System Architecture

The project follows a full-stack architecture consisting of a React frontend, Node.js/Express backend, Python/FastAPI services, MongoDB database, AI processing, and external authentication/email services.

```text
                     ┌──────────────────────┐
                     │       User           │
                     └──────────┬───────────┘
                                │
                                ▼
                  ┌─────────────────────────┐
                  │ React + Vite + Tailwind │
                  │       Frontend          │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │   Node.js + Express.js  │
                  │        Backend          │
                  └──────┬─────────┬────────┘
                         │         │
              ┌──────────┘         └──────────┐
              ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐
     │    MongoDB      │             │ Python/FastAPI  │
     │    Database     │             │    Services     │
     └─────────────────┘             └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Groq / LLM AI  │
                                     └─────────────────┘

                         ┌─────────────────────┐
                         │ Google OAuth 2.0    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     Gmail API       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                              Application Email
```

---

# 🛠️ Tech Stack

## Frontend

* **React.js** — Component-based user interface
* **Vite** — Frontend development and build tooling
* **Tailwind CSS** — Responsive and utility-first styling

## Backend

* **Node.js** — Backend runtime
* **Express.js** — REST API and server framework
* **MongoDB** — Database
* **JWT** — Authentication and authorization
* **bcrypt** — Password hashing

## AI & Automation

* **Groq** — LLM-powered job analysis and email generation
* **Python** — Supporting backend/AI services
* **FastAPI** — Python API services

## Authentication & Communication

* **Google OAuth 2.0** — Secure Gmail account authorization
* **Gmail API** — Application email delivery
* **SMTP** — Email delivery/performance optimization

## Document Processing

* **PDF parsing** — Resume extraction and processing
* **PDF buffering** — Efficient resume handling and attachment processing

---

# 📁 Project Structure

```text
Job-Agent/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── prompts/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── test/
│   ├── resume/
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

# 🔐 Security

The application includes several security-focused mechanisms:

* JWT-based authentication
* bcrypt password hashing
* Protected frontend routes
* User-scoped resume and application data
* Google OAuth 2.0
* Authenticated Gmail access
* Secure resume path validation
* Environment-based configuration
* Timeout controls for external operations

> **Important:** Never commit real API keys, OAuth credentials, database credentials, passwords, or other secrets to the repository.

Use environment variables for sensitive configuration.

---

# ⚙️ Core Application Flow

### 1. User Authentication

A user creates an account or logs in using the authentication system.

```text
Signup/Login
     ↓
JWT Authentication
     ↓
Protected User Session
```

### 2. Resume Upload

The user uploads a PDF resume.

```text
PDF Resume
    ↓
Resume Processing
    ↓
Resume Storage / Parsing
    ↓
User Resume Profile
```

### 3. Job Analysis

The user provides a job description.

The AI workflow analyzes the content and extracts useful information.

```text
Job Description
       ↓
    Groq / LLM
       ↓
Company + Role + Recipient
+ Requirements + Skills
```

### 4. Resume Matching

The extracted requirements are compared against the user's resume information.

```text
Job Requirements
       +
User Resume
       ↓
Resume–Job Matching
```

### 5. Email Generation

The AI generates a personalized application email based on the job and resume context.

```text
Job Details
    +
Resume Context
    ↓
AI Email Generation
    ↓
Personalized Application Email
```

### 6. Gmail Authorization

The user connects their Gmail account through Google OAuth 2.0.

```text
User
 ↓
Google OAuth 2.0
 ↓
Authenticated Gmail Account
```

### 7. Application Delivery

The generated email is sent through the authenticated Gmail account with the PDF resume attached.

```text
Personalized Email
       +
PDF Resume
       ↓
   Gmail API
       ↓
Application Delivered
```

### 8. Application Tracking

The application is stored in the user's application history so that previous applications and their statuses can be managed from the dashboard.

---

# 🧪 Testing

The backend contains automated tests covering multiple application workflows and regression scenarios.

Testing areas include:

* Job skills extraction
* Job description extraction
* Email generation
* Email context handling
* Application runtime behavior
* Profile handling
* Resume-related workflows
* Subject resolution
* Input sanitization

Run the backend tests using the project's configured npm test command.

---

# 📈 Performance

One of the main goals of XJobAgent is reducing repetitive manual work involved in job applications.

### Manual Process

```text
Read Job Description
        ↓
Understand Requirements
        ↓
Check Resume
        ↓
Write Email
        ↓
Attach Resume
        ↓
Open Gmail
        ↓
Send Email
```

### XJobAgent

```text
Job Description
      ↓
AI Analysis
      ↓
Resume Matching
      ↓
AI Email Generation
      ↓
Gmail API
      ↓
Application Sent
```

The automated workflow can reduce processing time from approximately **1 minute manually to around 3–4 seconds per application**, depending on external API/network performance.

---

# 🌟 Why XJobAgent?

XJobAgent brings multiple job-search tasks into one automated workflow:

| Traditional Process               | XJobAgent                        |
| --------------------------------- | -------------------------------- |
| Manually analyze job descriptions | AI-powered job analysis          |
| Manually compare resume with job  | Automated matching               |
| Write every email manually        | AI-generated personalized emails |
| Manually attach resume            | Automatic PDF attachment         |
| Switch between applications       | Centralized dashboard            |
| Manually track applications       | Application history              |
| Manually open Gmail               | Gmail API integration            |
| Repetitive workflow               | Automated end-to-end workflow    |

---

# 🚀 Future Improvements

Potential future enhancements include:

* More job-board integrations
* Automated job discovery
* Advanced resume scoring
* Application analytics
* Better job recommendation algorithms
* Additional email providers
* Scheduled application workflows
* Enhanced AI-based career recommendations
* Application success analytics

---

# 👨‍💻 Project Highlights

XJobAgent demonstrates practical experience with:

* Full-stack web development
* REST API development
* React application architecture
* Node.js and Express.js backend development
* MongoDB database integration
* AI/LLM integration
* Prompt engineering
* PDF processing
* Authentication and authorization
* Google OAuth 2.0
* Gmail API integration
* Email automation
* Performance optimization
* Automated testing
* Responsive UI development

---

# 📄 License

Add the appropriate license for this project here.

---

# 👤 Author

**Lokesh Chahar**

GitHub: [@Lokeshchahar-coder](https://github.com/Lokeshchahar-coder)

---

## ⭐ If you find this project useful

Consider giving the repository a star ⭐ and exploring the project.

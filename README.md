# XJobAgent — AI-Powered Job Application Automation Platform

XJobAgent is a full-stack job application automation platform that helps simplify and speed up the process of applying to jobs.

The platform analyzes job descriptions, extracts important job information, matches job requirements with a user's resume, generates personalized application emails, and sends applications directly through the user's authenticated Gmail account with the resume attached.

## Overview

Applying to multiple jobs manually can be repetitive and time-consuming. XJobAgent brings the major steps of the application process into one platform.

The project uses a React-based frontend, a Node.js and Express.js backend, MongoDB for data storage, Groq for AI/LLM processing, and Google services for authentication and email delivery.

### What the platform does

* Analyzes unstructured job descriptions
* Extracts company, role, recipient, requirements, and other job details
* Matches job requirements with the user's resume
* Generates personalized application emails
* Supports PDF resume upload and management
* Provides secure user authentication
* Connects authenticated Gmail accounts
* Sends HTML or plain-text application emails
* Automatically attaches the user's PDF resume
* Maintains application history
* Tracks application status and timing information
* Provides a dashboard for managing applications and resumes

## Key Features

### AI-Powered Job Analysis

XJobAgent uses Groq-powered LLM processing to analyze job descriptions and extract relevant information such as:

* Company name
* Job role
* Recipient information
* Job requirements
* Skills
* Responsibilities
* Other relevant job details

The extracted information is then used in the rest of the application workflow.

### Resume Management

Users can upload and manage their resumes in PDF format.

The platform supports:

* PDF resume parsing
* Resume storage
* Resume-to-job matching
* User-specific resume management
* Secure resume path validation
* Automatic resume attachment during application delivery

### Resume-Job Matching

The system compares information from the user's resume with the requirements extracted from the job description.

This helps generate application content that is relevant to the particular job opportunity.

### Personalized Application Emails

Instead of sending the same generic email to every company, XJobAgent generates personalized application emails using:

* Job description
* Extracted job information
* User resume
* Job requirements
* Recipient and company information

The generated email can be sent as HTML or plain text.

### Authentication

The platform supports multi-user authentication using:

* JWT
* bcrypt
* Protected frontend routes
* User-scoped data management

Each user's resumes and application history are associated with their authenticated account.

### Google OAuth 2.0 and Gmail API

Users can connect their Gmail account through Google OAuth 2.0.

Once authenticated, the application can use the Gmail API to send personalized job applications from the user's Gmail account.

Features include:

* Google OAuth 2.0 authentication
* Gmail account connection
* HTML and plain-text email delivery
* Automatic PDF resume attachment
* Authenticated email sending

### Application Dashboard

The React dashboard provides a centralized interface for managing the application process.

It includes:

* Application management
* Resume management
* Application history
* Application status tracking
* Timing and performance metrics
* Application details
* Gmail connection management

### Performance and Reliability

The application includes several improvements focused on performance and reliable email delivery:

* SMTP connection pooling
* Transporter warm-up
* PDF buffering
* Timeout controls
* Performance instrumentation
* Secure resume path validation
* Reliable email delivery

The automated workflow can reduce application processing time from approximately 1 minute manually to around 3–4 seconds per application, depending on external services and network conditions.

## How XJobAgent Works

The overall application flow is:

```text
User
  |
  v
Login / Signup
  |
  v
Upload Resume
  |
  v
Provide Job Description
  |
  v
AI Job Analysis
  |
  v
Extract Job Details
  |
  +-- Company
  +-- Role
  +-- Recipient
  +-- Requirements
  +-- Skills
  |
  v
Resume-Job Matching
  |
  v
AI Email Generation
  |
  v
Google OAuth 2.0
  |
  v
Authenticated Gmail Account
  |
  v
Email + PDF Resume Attachment
  |
  v
Gmail API
  |
  v
Application Sent
  |
  v
Application History and Status
```

## System Architecture

XJobAgent follows a full-stack architecture consisting of a React frontend, Node.js and Express.js backend, MongoDB database, AI/LLM integration, and Google services for authentication and email delivery.

```text
                         +------------------+
                         |       User       |
                         +--------+---------+
                                  |
                                  v
                    +---------------------------+
                    | React + Vite + Tailwind   |
                    |         Frontend          |
                    +-------------+-------------+
                                  |
                                  v
                    +---------------------------+
                    |   Node.js + Express.js    |
                    |         Backend           |
                    +---------+----------+------+
                              |          |
                              |          |
                              v          v
                       +----------+  +-------------+
                       | MongoDB  |  | Groq / LLM  |
                       | Database |  | AI Services |
                       +----------+  +-------------+
                              |
                              v
                    +---------------------------+
                    | Application & User Data   |
                    +---------------------------+

                                  |
                                  v
                    +---------------------------+
                    |     Google OAuth 2.0      |
                    +-------------+-------------+
                                  |
                                  v
                    +---------------------------+
                    |        Gmail API          |
                    +-------------+-------------+
                                  |
                                  v
                         Application Email
```

## Tech Stack

### Frontend

| Technology   | Purpose                                |
| ------------ | -------------------------------------- |
| React.js     | Component-based user interface         |
| Vite         | Frontend development and build tooling |
| Tailwind CSS | Responsive and utility-first styling   |

### Backend

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| Node.js    | Backend runtime               |
| Express.js | REST API and server framework |

### Database

| Technology | Purpose                                                            |
| ---------- | ------------------------------------------------------------------ |
| MongoDB    | Storing users, resumes, applications, and related application data |

### AI and LLM Integration

| Technology      | Purpose                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| Groq            | LLM-powered job analysis and personalized email generation                  |
| LLM Integration | Extracting job information and generating context-aware application content |

### Authentication and Authorization

| Technology       | Purpose                                      |
| ---------------- | -------------------------------------------- |
| JWT              | User authentication and protected API access |
| bcrypt           | Password hashing                             |
| Google OAuth 2.0 | Gmail account authorization                  |

### Email and Communication

| Technology | Purpose                                     |
| ---------- | ------------------------------------------- |
| Gmail API  | Sending personalized job application emails |
| SMTP       | Email delivery and performance optimization |

### Document Processing

* PDF resume parsing
* PDF buffering
* Resume extraction and processing
* Automatic PDF resume attachment

## Project Structure

```text
Job-Agent/
|
+-- backend/
|   +-- src/
|   |   +-- controllers/
|   |   +-- middleware/
|   |   +-- models/
|   |   +-- prompts/
|   |   +-- routes/
|   |   +-- services/
|   |   +-- utils/
|   |   +-- server.js
|   |
|   +-- test/
|   +-- resume/
|   +-- package.json
|   +-- package-lock.json
|   +-- README.md
|
+-- frontend/
|   +-- public/
|   +-- src/
|   |   +-- components/
|   |   +-- contexts/
|   |   +-- pages/
|   |   +-- services/
|   |   +-- utils/
|   |   +-- App.jsx
|   |   +-- index.css
|   |   +-- main.jsx
|   |
|   +-- package.json
|   +-- package-lock.json
|   +-- vite.config.js
|
+-- .gitignore
+-- README.md
```

## Security

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

Never commit real API keys, OAuth credentials, database credentials, passwords, or other sensitive information to the repository.

Sensitive configuration should be stored using environment variables.

## Core Application Flow

### 1. User Authentication

A user creates an account or logs in using the authentication system.

```text
Signup / Login
      |
      v
JWT Authentication
      |
      v
Protected User Session
```

### 2. Resume Upload

The user uploads a PDF resume.

```text
PDF Resume
    |
    v
Resume Processing
    |
    v
Resume Storage / Parsing
    |
    v
User Resume Profile
```

### 3. Job Analysis

The user provides a job description.

The AI workflow analyzes the content and extracts useful information.

```text
Job Description
      |
      v
  Groq / LLM
      |
      v
Company + Role + Recipient
+ Requirements + Skills
```

### 4. Resume Matching

The extracted requirements are compared against the user's resume information.

```text
Job Requirements
       +
User Resume
       |
       v
Resume-Job Matching
```

### 5. Email Generation

The AI generates a personalized application email based on the job and resume context.

```text
Job Details
    +
Resume Context
    |
    v
AI Email Generation
    |
    v
Personalized Application Email
```

### 6. Gmail Authorization

The user connects their Gmail account through Google OAuth 2.0.

```text
User
 |
 v
Google OAuth 2.0
 |
 v
Authenticated Gmail Account
```

### 7. Application Delivery

The generated email is sent through the authenticated Gmail account with the PDF resume attached.

```text
Personalized Email
       +
PDF Resume
       |
       v
   Gmail API
       |
       v
Application Delivered
```

### 8. Application Tracking

The application is stored in the user's application history so previous applications and their statuses can be managed from the dashboard.

## Testing

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

## Performance

One of the main goals of XJobAgent is to reduce repetitive manual work involved in job applications.

### Traditional Manual Process

```text
Read Job Description
        |
        v
Understand Requirements
        |
        v
Check Resume
        |
        v
Write Email
        |
        v
Attach Resume
        |
        v
Open Gmail
        |
        v
Send Email
```

### XJobAgent

```text
Job Description
      |
      v
AI Analysis
      |
      v
Resume Matching
      |
      v
AI Email Generation
      |
      v
Gmail API
      |
      v
Application Sent
```

The automated workflow can reduce processing time from approximately 1 minute manually to around 3–4 seconds per application, depending on external API and network performance.

## Why XJobAgent?

XJobAgent brings multiple job application tasks into a single workflow.

| Traditional Process                   | XJobAgent                        |
| ------------------------------------- | -------------------------------- |
| Manually analyze job descriptions     | AI-powered job analysis          |
| Manually compare resume with job      | Automated resume-job matching    |
| Write every email manually            | AI-generated personalized emails |
| Manually attach resume                | Automatic PDF attachment         |
| Switch between different applications | Centralized dashboard            |
| Manually track applications           | Application history              |
| Manually open Gmail                   | Gmail API integration            |
| Repetitive workflow                   | Automated end-to-end workflow    |

## Future Improvements

Potential future improvements include:

* More job-board integrations
* Automated job discovery
* Advanced resume scoring
* Application analytics
* Better job recommendation algorithms
* Additional email providers
* Scheduled application workflows
* Enhanced AI-based career recommendations
* Application success analytics

## Project Highlights

This project demonstrates practical experience with:

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

## Author

**Lokesh Chahar**

GitHub: [@Lokeshchahar-coder](https://github.com/Lokeshchahar-coder)


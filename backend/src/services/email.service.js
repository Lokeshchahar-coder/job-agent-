import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { google } from 'googleapis';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = process.env.EMAIL_SECURE === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Email configuration is missing. Check EMAIL_USER and EMAIL_PASS in .env');
  }

  const isDev = process.env.NODE_ENV !== 'production';

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: !isDev },
    pool: true,
    maxConnections: 2,
    maxMessages: 500,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
    disableUrlAccess: true,
    debug: (level, ...args) => {
      if (level === 'error') {
        console.error(`[SMTP-PROTO]`, ...args);
      } else {
        const msg = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
        if (!msg.match(/^[A-Za-z0-9+/=]{20,}$/)) {
          console.log(`[SMTP-PROTO]`, msg);
        } else {
          console.log(`[SMTP-PROTO] [REDACTED AUTH]`);
        }
      }
    }
  });

  return transporter;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bodyToHtml(body) {
  if (!body) return '';
  const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim());
  const htmlParagraphs = paragraphs.map(p => {
    const escaped = escapeHtml(p.trim()).replace(/\n/g, '<br>');
    return `<p>${escaped}</p>`;
  });
  return htmlParagraphs.join('\n');
}

function rfc2047Encode(str) {
  if (!str) return '';
  const hasNonAscii = /[^\x00-\x7F]/.test(str);
  if (!hasNonAscii) return str;
  return `=?UTF-8?B?${Buffer.from(str, 'utf-8').toString('base64')}?=`;
}

function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function validateUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function buildProfileText(profileLinks) {
  if (!profileLinks) return '';
  const { github, linkedin } = profileLinks;
  const parts = [];
  if (github) parts.push(`GitHub: ${github}`);
  if (linkedin) parts.push(`LinkedIn: ${linkedin}`);
  return parts.length ? '\n\n' + parts.join('\n') : '';
}

function buildProfileHtml(profileLinks) {
  if (!profileLinks) return '';
  const { github, linkedin } = profileLinks;
  const links = [];
  if (github) links.push(`<a href="${escapeHtml(github)}" style="color: #0969da; text-decoration: none;">GitHub</a>`);
  if (linkedin) links.push(`<a href="${escapeHtml(linkedin)}" style="color: #0a66c2; text-decoration: none;">LinkedIn</a>`);
  if (!links.length) return '';
  return `<p style="margin-top: 24px; font-size: 13px; color: #666;">${links.join(' &nbsp;|&nbsp; ')}</p>`;
}

function resolveAttachmentFilename(attachmentName) {
  if (attachmentName) {
    return `${sanitizeFilename(attachmentName)}_CV.pdf`;
  }
  return 'resume.pdf';
}

function resolveBufferAndFilename({ resumeBuffer, attachmentName, resumePath }) {
  if (resumeBuffer && Buffer.isBuffer(resumeBuffer)) {
    const filename = resolveAttachmentFilename(attachmentName);
    return { buffer: resumeBuffer, filename };
  }

  // Legacy fallback: read from filesystem
  if (resumePath) {
    const resumeDir = path.resolve('resume');
    const requestedPath = path.resolve(resumePath);
    if (!requestedPath.startsWith(resumeDir)) {
      throw new Error('Resume path must be inside the resume directory');
    }
    if (!fs.existsSync(requestedPath)) {
      throw new Error('Resume file not found');
    }
    const stats = fs.statSync(requestedPath);
    if (stats.size > 5 * 1024 * 1024) {
      throw new Error('Resume file exceeds maximum size of 5 MB');
    }
    const ext = path.extname(requestedPath).toLowerCase();
    if (ext !== '.pdf') {
      throw new Error('Only PDF files are allowed for resume attachment');
    }
    const buffer = fs.readFileSync(requestedPath);
    const filename = resolveAttachmentFilename(attachmentName || path.basename(requestedPath, ext));
    return { buffer, filename };
  }

  throw new Error('No resume buffer or path provided');
}

export async function sendEmail({ recipient, subject, body, resumeBuffer, attachmentName, profileLinks, resumePath }) {
  const t0 = performance.now();
  const transport = getTransporter();
  const t1 = performance.now();

  const storageReadStart = performance.now();
  const { buffer: resumeBufferResolved, filename: resumeFilename } = resolveBufferAndFilename({ resumeBuffer, attachmentName, resumePath });
  const storageReadEnd = performance.now();
  const fileSize = (resumeBufferResolved.length / 1024).toFixed(1);

  const validatedGithub = validateUrl(profileLinks?.github);
  const validatedLinkedin = validateUrl(profileLinks?.linkedin);
  const hasProfiles = validatedGithub || validatedLinkedin;
  const fullBody = hasProfiles ? body + buildProfileText({ github: validatedGithub, linkedin: validatedLinkedin }) : body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipient,
    subject,
    text: fullBody,
    html: bodyToHtml(fullBody) + (hasProfiles ? buildProfileHtml({ github: validatedGithub, linkedin: validatedLinkedin }) : ''),
    attachments: [{
      filename: resumeFilename,
      content: resumeBufferResolved,
      contentType: 'application/pdf'
    }]
  };

  const smtpStart = performance.now();

  try {
    const info = await transport.sendMail(mailOptions);
    const smtpEnd = performance.now();
    const timing = {
      transporter: `${(t1 - t0).toFixed(1)}ms`,
      storageRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      fileRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      smtp: `${(smtpEnd - smtpStart).toFixed(1)}ms`,
      total: `${(smtpEnd - t0).toFixed(1)}ms`,
      attachmentSize: `${fileSize}KB`
    };
    console.log(`[EMAIL] Sent to ${recipient} | StorageRead: ${timing.storageRead} | SMTP: ${timing.smtp} | Total: ${timing.total} | Attach: ${timing.attachmentSize}`);
    return {
      messageId: info.messageId,
      recipient,
      subject,
      attachment: resumeFilename,
      timing
    };
  } catch (error) {
    const smtpEnd = performance.now();
    const timing = {
      transporter: `${(t1 - t0).toFixed(1)}ms`,
      storageRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      fileRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      smtp: `${(smtpEnd - smtpStart).toFixed(1)}ms`,
      total: `${(smtpEnd - t0).toFixed(1)}ms`,
      attachmentSize: `${fileSize}KB`
    };
    console.error(`[EMAIL] Failed to ${recipient} | StorageRead: ${timing.storageRead} | SMTP: ${timing.smtp} | Total: ${timing.total} | Error: ${error.message}`);
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Check EMAIL_USER and EMAIL_PASS');
    }
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      throw new Error('Failed to connect to email server. Check SMTP configuration');
    }
    if (error.responseCode === 550 || error.responseCode === 554) {
      throw new Error('Recipient email rejected by server');
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendEmailViaGmail({ recipient, subject, body, resumeBuffer, attachmentName, oauth2Client, profileLinks, resumePath }) {
  const t0 = performance.now();

  const storageReadStart = performance.now();
  const { buffer: resumeBufferResolved, filename: resumeFilename } = resolveBufferAndFilename({ resumeBuffer, attachmentName, resumePath });
  const storageReadEnd = performance.now();
  const fileSize = (resumeBufferResolved.length / 1024).toFixed(1);

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const validatedGithub = validateUrl(profileLinks?.github);
  const validatedLinkedin = validateUrl(profileLinks?.linkedin);
  const hasProfiles = validatedGithub || validatedLinkedin;
  const fullBody = hasProfiles ? body + buildProfileText({ github: validatedGithub, linkedin: validatedLinkedin }) : body;

  const boundary = `boundary_${Date.now()}`;
  const encodedSubject = rfc2047Encode(subject);
  const htmlContent = bodyToHtml(fullBody);
  const escapedHtmlContent = escapeHtml(fullBody).replace(/\n/g, '<br>');
  const profileHtml = hasProfiles ? buildProfileHtml({ github: validatedGithub, linkedin: validatedLinkedin }) : '';

  const rawBody = [
    `From: me`,
    `To: ${recipient}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="alt_${boundary}"`,
    '',
    `--alt_${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    '',
    fullBody,
    '',
    `--alt_${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    '',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">',
    htmlContent || `<p>${escapedHtmlContent}</p>`,
    profileHtml,
    '</body></html>',
    '',
    `--alt_${boundary}--`,
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="${resumeFilename}"`,
    `Content-Disposition: attachment; filename="${resumeFilename}"`,
    `Content-Transfer-Encoding: base64`,
    '',
    resumeBufferResolved.toString('base64'),
    `--${boundary}--`,
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawBody, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const smtpStart = performance.now();

  try {
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });
    const smtpEnd = performance.now();
    const timing = {
      storageRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      fileRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      smtp: `${(smtpEnd - smtpStart).toFixed(1)}ms`,
      total: `${(smtpEnd - t0).toFixed(1)}ms`,
      attachmentSize: `${fileSize}KB`
    };
    console.log(`[GMAIL] Sent to ${recipient} | StorageRead: ${timing.storageRead} | SMTP: ${timing.smtp} | Total: ${timing.total} | Attach: ${timing.attachmentSize}`);
    return {
      messageId: result.data.id,
      recipient,
      subject,
      attachment: resumeFilename,
      timing
    };
  } catch (error) {
    const smtpEnd = performance.now();
    const timing = {
      storageRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      fileRead: `${(storageReadEnd - storageReadStart).toFixed(1)}ms`,
      smtp: `${(smtpEnd - smtpStart).toFixed(1)}ms`,
      total: `${(smtpEnd - t0).toFixed(1)}ms`,
      attachmentSize: `${fileSize}KB`
    };
    console.error(`[GMAIL] Failed to ${recipient} | Error: ${error.message}`);
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      throw new Error('Gmail token expired. Please reconnect your Gmail account.');
    }
    throw new Error(`Failed to send via Gmail: ${error.message}`);
  }
}

export async function warmUpTransporter() {
  try {
    const t0 = performance.now();
    const transport = getTransporter();
    await transport.verify();
    const t1 = performance.now();
    console.log(`[EMAIL] Transporter warmed up in ${(t1 - t0).toFixed(1)}ms`);
    return { success: true, time: t1 - t0 };
  } catch (error) {
    console.error(`[EMAIL] Transporter warmup failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

import { google } from 'googleapis';
import { GmailConnection } from '../models/GmailConnection.js';

const SCOPES = ['https://mail.google.com/'];
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5000/api/auth/google/callback';

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URL
  );
}

export function getGoogleAuthUrl(req, res) {
  try {
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.userId.toString(),
    });
    res.json({ success: true, data: { url } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate auth URL' });
  }
}

export async function googleCallback(req, res) {
  try {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply?gmail=error`);
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    await GmailConnection.findOneAndUpdate(
      { userId },
      {
        userId,
        provider: 'google',
        email: profile.data.emailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date),
      },
      { upsert: true, new: true }
    );

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply?gmail=connected`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply?gmail=error`);
  }
}

export async function getGmailStatus(req, res) {
  try {
    const connection = await GmailConnection.findOne({ userId: req.userId });
    res.json({
      success: true,
      data: {
        connected: !!connection,
        email: connection?.email || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check Gmail status' });
  }
}

export async function disconnectGmail(req, res) {
  try {
    await GmailConnection.findOneAndDelete({ userId: req.userId });
    res.json({ success: true, message: 'Gmail disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to disconnect Gmail' });
  }
}

export async function getAccessTokenForUser(userId) {
  const connection = await GmailConnection.findOne({ userId }).select('+accessToken +refreshToken');
  if (!connection) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiry.getTime(),
  });

  if (new Date() >= connection.tokenExpiry) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    await GmailConnection.findOneAndUpdate(
      { userId },
      { accessToken: credentials.access_token, tokenExpiry: new Date(credentials.expiry_date) }
    );
  }

  return { oauth2Client, email: connection.email };
}

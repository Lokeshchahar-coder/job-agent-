import { useState, useEffect } from 'react';
import { parseResume, getMyResume, getGmailAuthUrl, getGmailStatus, disconnectGmail, getCurrentUser, updateProfile } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { FileText, Mail, Link as LinkIcon, MapPin, User, Save, Upload } from 'lucide-react';

export default function Resume() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [gmail, setGmail] = useState({ connected: false, email: null });
  const [uploadError, setUploadError] = useState(null);

  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  useEffect(() => {
    Promise.all([
      getMyResume().then((res) => setResume(res.data)).catch(() => {}),
      getGmailStatus().then((res) => setGmail(res.data)).catch(() => {}),
      getCurrentUser().then((res) => {
        setGithub(res.data.user.github || '');
        setLinkedin(res.data.user.linkedin || '');
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected') {
      getGmailStatus().then((res) => setGmail(res.data));
      window.history.replaceState({}, '', '/resume');
    }
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await parseResume(file);
      setResume(res.data);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res = await getGmailAuthUrl();
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await disconnectGmail();
      setGmail({ connected: false, email: null });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await updateProfile({ github: github.trim(), linkedin: linkedin.trim() });
      setProfileMsg({ type: 'success', text: 'Profile links saved.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to save.' });
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="My Resume" subtitle="Your parsed resume data used for applications." />
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Resume" subtitle="Your parsed resume data used for applications." />

      <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-200">Profile Links</h3>
        </div>
        <p className="text-xs text-zinc-500 mb-4">These will appear in every application email you send.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">GitHub URL</label>
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-surface-0 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://www.linkedin.com/in/username"
              className="w-full bg-surface-0 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Button onClick={handleSaveProfile} disabled={profileSaving} size="sm">
            {profileSaving ? <LoadingSpinner size="sm" /> : <Save className="w-3.5 h-3.5" />}
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          {profileMsg && (
            <span className={`text-xs ${profileMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {profileMsg.text}
            </span>
          )}
        </div>
      </div>

      <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">Upload Resume</h3>
            <p className="text-xs text-zinc-500 mt-0.5">PDF only, max 5MB. Replacing your resume will delete the old one.</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-lg bg-surface-200 border border-white/[0.06] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-surface-300 transition cursor-pointer">
            {uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Choose PDF'}
            <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
      </div>

      <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">Gmail Connection</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {gmail.connected ? `Connected as ${gmail.email}` : 'Connect Gmail to send emails from your account'}
            </p>
          </div>
          {gmail.connected ? (
            <div className="flex items-center gap-2">
              <Badge status="ready">Connected</Badge>
              <button
                onClick={handleDisconnectGmail}
                className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <Button variant="secondary" onClick={handleConnectGmail} size="sm">
              <Mail className="w-3.5 h-3.5" /> Connect Gmail
            </Button>
          )}
        </div>
      </div>

      {resume ? (
        <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-6 max-w-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-200 border border-white/[0.06] flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-zinc-100">{resume.personal?.name || 'Unknown'}</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                {[resume.experience?.[0]?.title, resume.education?.[0]?.degree].filter(Boolean).join(' · ') || 'Resume'}
              </p>

              <div className="mt-4 space-y-1.5 text-sm">
                {resume.personal?.location && (
                  <p className="text-zinc-500 inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {resume.personal.location}
                  </p>
                )}
                {resume.personal?.email && (
                  <p className="text-zinc-500 inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {resume.personal.email}
                  </p>
                )}
              </div>

              {resume.skills && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(resume.skills).flat().filter(Boolean).slice(0, 10).map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-md bg-surface-200 text-xs text-zinc-400 border border-white/[0.06]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-zinc-600">File: {resume.originalFilename || 'resume.pdf'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">No resume uploaded yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Upload a PDF to get started.</p>
        </div>
      )}
    </div>
  );
}

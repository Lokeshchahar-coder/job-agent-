import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplicationById } from '../services/api';
import { formatDuration } from '../utils/formatTime';
import { formatDate } from '../utils/formatDate';
import Badge from '../components/common/Badge';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';

export default function ApplicationDetails() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getApplicationById(id)
      .then((res) => setApp(res.data.application))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <Link to="/applications" className="text-sm text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
        </Link>
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div>
        <PageHeader title="Application Not Found" />
        <Link to="/applications" className="text-sm text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/applications" className="text-sm text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
        </Link>
      </div>

      <PageHeader title={app.company || 'Unknown Company'} subtitle={app.role || 'Unknown Role'} />

      <Section title="Status">
        <div className="flex items-center gap-2">
          <Badge status={app.status}>{app.status === 'sent' ? 'Application Sent' : 'Application Failed'}</Badge>
        </div>
      </Section>

      {app.email?.subject && (
        <Section title="Email">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Subject</p>
              <p className="text-sm text-zinc-300">{app.email.subject}</p>
            </div>
            {app.email.body && (
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Body</p>
                <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">{app.email.body}</pre>
              </div>
            )}
          </div>
        </Section>
      )}

      {app.jobText && (
        <Section title="Job">
          <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">{app.jobText}</pre>
        </Section>
      )}

      {app.timing && (
        <Section title="Timing">
          <div className="space-y-1.5 text-sm">
            <TimingRow label="File Read" value={app.timing.fileRead} />
            <TimingRow label="SMTP" value={app.timing.smtp} />
            <TimingRow label="Total" value={app.timing.total} />
          </div>
        </Section>
      )}

      <Section title="Details">
        <div className="space-y-1.5 text-sm">
          {app.recipient && (
            <p className="text-zinc-400">
              <span className="text-zinc-600">Recipient:</span> {app.recipient}
            </p>
          )}
          {app.durationMs && (
            <p className="text-zinc-400">
              <span className="text-zinc-600">Duration:</span> {formatDuration(app.durationMs)}
            </p>
          )}
          {app.createdAt && (
            <p className="text-zinc-400">
              <span className="text-zinc-600">Date:</span> {formatDate(app.createdAt)}
            </p>
          )}
        </div>
      </Section>

      {app.error && (
        <Section title="Error">
          <p className="text-sm text-red-400">{app.error}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-5 mb-4">
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function TimingRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300 font-medium">{value || '—'}</span>
    </div>
  );
}

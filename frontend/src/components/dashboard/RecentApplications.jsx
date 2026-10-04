import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { formatDuration } from '../../utils/formatTime';

export default function RecentApplications({ applications = [] }) {
  if (!applications.length) {
    return <EmptyState icon={ClipboardList} title="No applications yet" description="Apply to your first job to see it here." />;
  }

  return (
    <div className="bg-surface-100 border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-zinc-200">Recent Applications</h3>
        <Link to="/applications" className="text-xs text-brand-400 hover:text-brand-300 transition inline-flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {applications.slice(0, 5).map((app) => (
          <Link
            key={app._id}
            to={`/applications/${app._id}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition group"
          >
            <div className="min-w-0">
              <p className="text-sm text-zinc-200 truncate group-hover:text-zinc-100 transition">
                <span className="font-medium">{app.company || '—'}</span>
                <span className="text-zinc-600 mx-2">—</span>
                <span className="text-zinc-400">{app.role || '—'}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="text-xs text-zinc-600">{formatDuration(app.durationMs)}</span>
              <Badge status={app.status}>{app.status === 'sent' ? 'Sent' : 'Failed'}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

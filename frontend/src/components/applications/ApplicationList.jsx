import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ClipboardList } from 'lucide-react';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { formatDuration } from '../../utils/formatTime';
import { formatDate } from '../../utils/formatDate';

export default function ApplicationList({ applications = [] }) {
  const [search, setSearch] = useState('');
  const filtered = applications.filter(
    (a) =>
      (a.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applications..."
          className="w-full bg-surface-100 border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No applications found" description="Apply to your first job to see it here." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-100 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1.5fr_100px_80px] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <span>Company</span>
              <span>Role</span>
              <span>Status</span>
              <span className="text-right">Time</span>
            </div>
            {filtered.map((app) => (
              <Link
                key={app._id}
                to={`/applications/${app._id}`}
                className="grid grid-cols-[1fr_1.5fr_100px_80px] gap-4 px-5 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition items-center"
              >
                <span className="text-sm font-medium text-zinc-200 truncate">{app.company || '—'}</span>
                <span className="text-sm text-zinc-400 truncate">{app.role || '—'}</span>
                <Badge status={app.status}>{app.status === 'sent' ? 'Sent' : 'Failed'}</Badge>
                <span className="text-sm text-zinc-500 text-right">{formatDuration(app.durationMs)}</span>
              </Link>
            ))}
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map((app) => (
              <Link
                key={app._id}
                to={`/applications/${app._id}`}
                className="block bg-surface-100 border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{app.company || '—'}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{app.role || '—'}</p>
                  </div>
                  <Badge status={app.status}>{app.status === 'sent' ? 'Sent' : 'Failed'}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                  <span>{formatDate(app.createdAt)}</span>
                  <span>·</span>
                  <span>{formatDuration(app.durationMs)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

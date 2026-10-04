import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApplications } from '../services/api';
import { formatDuration } from '../utils/formatTime';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import QuickApplyCard from '../components/dashboard/QuickApplyCard';
import RecentApplications from '../components/dashboard/RecentApplications';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart3, CheckCircle2, XCircle, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApplications()
      .then((res) => setApps(res.data.applications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sent = apps.filter((a) => a.status === 'sent').length;
  const failed = apps.filter((a) => a.status === 'failed').length;
  const avgMs = apps.length ? apps.reduce((s, a) => s + (a.durationMs || 0), 0) / apps.length : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <PageHeader title={`${greeting}, ${user?.name || 'there'}`} subtitle="Here's your application overview." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={BarChart3} value={apps.length} label="Applications" />
        <StatCard icon={CheckCircle2} value={sent} label="Emails Sent" />
        <StatCard icon={XCircle} value={failed} label="Failed" />
        <StatCard icon={Zap} value={loading ? '—' : formatDuration(avgMs)} label="Avg Time" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <QuickApplyCard />
        </div>
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-8 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <RecentApplications applications={apps} />
          )}
        </div>
      </div>
    </div>
  );
}

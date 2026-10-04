import { useState, useEffect } from 'react';
import { getApplications } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import ApplicationList from '../components/applications/ApplicationList';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApplications()
      .then((res) => setApps(res.data.applications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Applications" subtitle="Track all your job applications." />
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <ApplicationList applications={apps} />
      )}
    </div>
  );
}

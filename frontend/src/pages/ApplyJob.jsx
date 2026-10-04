import PageHeader from '../components/common/PageHeader';
import ApplyJobForm from '../components/apply/ApplyJobForm';

export default function ApplyJob() {
  return (
    <div>
      <PageHeader title="Apply to a Job" subtitle="Paste the complete job description below." />
      <ApplyJobForm />
    </div>
  );
}

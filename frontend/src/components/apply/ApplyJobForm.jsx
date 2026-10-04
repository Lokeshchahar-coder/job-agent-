import { useState, useEffect } from 'react';
import { applyForJob, getMyResume } from '../../services/api';
import { Send, FileText, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Badge from '../common/Badge';

const STAGES = [
  'Analyzing job description',
  'Generating personalized email',
  'Attaching resume',
  'Sending application',
];

export default function ApplyJobForm() {
  const [jobText, setJobText] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [resume, setResume] = useState(null);

  const isProcessing = status === 'processing';

  useEffect(() => {
    getMyResume()
      .then((res) => setResume(res.data))
      .catch(() => {});
  }, []);

  const handleApply = async () => {
    if (!jobText.trim() || isProcessing) return;
    setStatus('processing');
    setError(null);
    setResult(null);

    try {
      const data = await applyForJob(jobText);
      if (data.success && data.data?.emailSent) {
        setResult(data.data);
        setStatus('success');
      } else if (data.success && data.data?.sendStatus === 'AI_UNAVAILABLE') {
        setError('AI email generation failed. Please try again.');
        setStatus('error');
      } else {
        setError(data.message || 'Application could not be sent.');
        setStatus('error');
      }
    } catch (err) {
      setError(
        err.name === 'TypeError'
          ? 'Unable to connect to the server. Please try again.'
          : err.message || 'Unable to send the application. Please try again.'
      );
      setStatus('error');
    }
  };

  const handleReset = () => {
    setJobText('');
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-5">
        <label htmlFor="jd" className="block text-sm font-medium text-zinc-300 mb-2">
          Paste Job Description
        </label>
        <textarea
          id="jd"
          rows={12}
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          disabled={isProcessing}
          placeholder="Paste the complete job description here..."
          className="w-full bg-surface-0 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none resize-none transition disabled:opacity-50"
        />
      </div>

      <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-200 border border-white/[0.06] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {resume?.originalFilename || 'No resume uploaded'}
            </p>
            <p className="text-xs text-zinc-500">
              {resume?.personal?.name || 'Upload a resume first'}
            </p>
          </div>
        </div>
        <Badge status={resume ? 'ready' : 'processing'}>
          {resume ? 'Ready' : 'Missing'}
        </Badge>
      </div>

      {status !== 'success' && (
        <Button onClick={handleApply} disabled={!jobText.trim() || isProcessing || !resume}>
          {isProcessing ? (
            <>
              <LoadingSpinner size="sm" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" /> Apply Automatically
            </>
          )}
        </Button>
      )}

      {isProcessing && (
        <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-5 space-y-2.5">
          {STAGES.map((stage) => (
            <div key={stage} className="flex items-center gap-3 text-sm text-zinc-400">
              <LoadingSpinner size="sm" />
              {stage}
            </div>
          ))}
        </div>
      )}

      {status === 'success' && result && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-300">Application Sent</p>
          </div>
          <div className="space-y-1 text-sm">
            {result.company && (
              <p className="text-zinc-200">
                <span className="font-medium">{result.company}</span>
              </p>
            )}
            {result.role && <p className="text-zinc-400">{result.role}</p>}
            {result.recipient && (
              <p className="text-zinc-500 mt-2">
                Sent to: <span className="text-zinc-400">{result.recipient}</span>
              </p>
            )}
            {result.sendMethod && (
              <p className="text-zinc-500">
                Via: <span className="text-zinc-400">{result.sendMethod === 'gmail' ? 'Gmail OAuth' : 'SMTP'}</span>
              </p>
            )}
            {result.durationMs && (
              <p className="text-zinc-500">
                Application time: <span className="text-zinc-400">{(result.durationMs / 1000).toFixed(1)} seconds</span>
              </p>
            )}
          </div>
          <Button variant="secondary" onClick={handleReset} className="mt-4">
            New Application
          </Button>
        </div>
      )}

      {status === 'error' && error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-medium text-red-400">Application Failed</p>
          </div>
          <p className="text-sm text-zinc-400">{error}</p>
          <button onClick={() => setStatus('idle')} className="mt-3 text-sm text-brand-400 hover:text-brand-300 font-medium cursor-pointer">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

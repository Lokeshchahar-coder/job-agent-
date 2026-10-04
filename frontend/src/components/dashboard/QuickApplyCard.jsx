import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Send, ArrowRight } from 'lucide-react';
import { applyForJob } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

export default function QuickApplyCard() {
  const [jobText, setJobText] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApply = async () => {
    if (!jobText.trim() || processing) return;
    setProcessing(true);
    try {
      await applyForJob(jobText);
      setJobText('');
    } catch {}
    setProcessing(false);
  };

  return (
    <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-200 mb-3">Quick Apply</h3>
      <textarea
        rows={4}
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        placeholder="Paste a job description..."
        disabled={processing}
        className="w-full bg-surface-0 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none resize-none transition disabled:opacity-50"
      />
      <div className="flex items-center justify-between mt-3">
        <Link to="/apply" className="text-xs text-zinc-600 hover:text-zinc-400 transition inline-flex items-center gap-1">
          Full view <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={handleApply}
          disabled={!jobText.trim() || processing}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shadow-brand-600/20 cursor-pointer"
        >
          {processing ? <LoadingSpinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
          {processing ? 'Sending...' : 'Apply Now'}
        </button>
      </div>
    </div>
  );
}

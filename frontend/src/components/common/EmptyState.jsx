import { FileText } from 'lucide-react';

export default function EmptyState({ icon, title, description }) {
  const Icon = icon || FileText;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-200 border border-white/5 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-zinc-500" />
      </div>
      <h3 className="text-base font-medium text-zinc-200">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-zinc-500 max-w-sm">{description}</p>}
    </div>
  );
}

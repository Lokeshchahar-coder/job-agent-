const COLORS = {
  sent: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 ring-red-500/20',
  processing: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  ready: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
};

const DOT_COLORS = {
  sent: 'bg-emerald-400',
  failed: 'bg-red-400',
  processing: 'bg-amber-400 animate-pulse',
  ready: 'bg-blue-400',
};

export default function Badge({ status = 'ready', children }) {
  const color = COLORS[status] || COLORS.ready;
  const dot = DOT_COLORS[status] || DOT_COLORS.ready;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

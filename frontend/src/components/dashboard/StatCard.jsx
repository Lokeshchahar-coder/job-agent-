export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-surface-100 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-200 border border-white/[0.06] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-zinc-100 tracking-tight">{value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

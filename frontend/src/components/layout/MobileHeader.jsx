import { Menu, Zap } from 'lucide-react';

export default function MobileHeader({ onMenuClick }) {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-surface-50 border-b border-white/[0.06] sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">JobAgent</span>
      </div>
      <button onClick={onMenuClick} className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer">
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
}

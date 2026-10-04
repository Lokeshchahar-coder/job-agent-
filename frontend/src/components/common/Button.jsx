export default function Button({ children, variant = 'primary', size = 'md', disabled = false, onClick, className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-0 disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-500 focus:ring-brand-500 shadow-sm shadow-brand-600/20',
    secondary: 'bg-surface-200 text-zinc-300 hover:bg-surface-300 focus:ring-zinc-500 border border-white/5',
    ghost: 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 shadow-sm shadow-red-600/20',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

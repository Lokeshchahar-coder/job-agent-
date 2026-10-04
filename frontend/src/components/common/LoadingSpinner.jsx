import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
  return <Loader2 className={`animate-spin text-brand-500 ${sizes[size]}`} />;
}

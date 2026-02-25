import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'light' | 'dark';
  showText?: boolean;
}

const sizes = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-12',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export function Logo({ className, size = 'md', variant = 'default', showText = false }: LogoProps) {
  const isLight = variant === 'light';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/fuse-logo.png"
        alt="Fuse"
        className={cn(
          sizes[size],
          "object-contain w-auto",
          isLight && "invert"
        )}
      />
      {showText && (
        <span className={cn(
          "font-bold tracking-tight",
          textSizes[size],
          isLight ? "text-white" : "text-charcoal"
        )}>
          Fuse
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ className, variant = 'light' }: { className?: string; variant?: 'light' | 'dark' }) {
  const isLight = variant === 'light';
  return (
    <img
      src="/fuse-logo.png"
      alt="Fuse"
      className={cn(className, isLight && "invert")}
    />
  );
}

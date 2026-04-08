import { clsx } from 'clsx';

export type BadgeVariant = 'open' | 'closed' | 'obstacle' | 'damage' | 'role' | 'priority-high' | 'priority-medium' | 'priority-low' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  open: 'badge-open',
  closed: 'badge-closed',
  obstacle: 'badge-obstacle',
  damage: 'badge-damage',
  role: 'badge-role',
  'priority-high': 'badge-priority-high',
  'priority-medium': 'badge-priority-medium',
  'priority-low': 'badge-priority-low',
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-900/30 dark:text-amber-200',
  danger: 'bg-red-50 text-red-800 border border-red-200/80 dark:bg-red-900/30 dark:text-red-200',
  info: 'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-900/30 dark:text-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={clsx('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
}

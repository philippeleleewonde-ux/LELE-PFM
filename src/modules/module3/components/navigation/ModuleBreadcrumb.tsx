import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface ModuleBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function ModuleBreadcrumb({ items }: ModuleBreadcrumbProps) {
  const navigate = useNavigate();

  const breadcrumbItems: BreadcrumbItem[] =
    items.length > 0 && items[0].label === 'Cost Savings'
      ? items
      : [{ label: 'Cost Savings', path: '/modules/module3' }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex items-center gap-1.5 text-sm">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isClickable = !!item.path && !isLast;
          const isFirst = index === 0;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {isClickable ? (
                <button
                  type="button"
                  onClick={() => item.path && navigate(item.path)}
                  className={cn(
                    'inline-flex items-center gap-1.5 transition-colors duration-200',
                    'text-slate-500 dark:text-slate-400',
                    'hover:text-blue-600 dark:hover:text-blue-400',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-sm'
                  )}
                >
                  {isFirst && (
                    <Home className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </button>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5',
                    isLast
                      ? 'text-slate-900 dark:text-white font-medium'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && (
                    <Home className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

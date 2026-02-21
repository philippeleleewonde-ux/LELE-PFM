import { useAppStore, ViewMode } from '@/stores/app.store';

export function useViewMode() {
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);

  return {
    viewMode,
    setViewMode,
    isSimple: viewMode === 'simple',
    isExpert: viewMode === 'expert',
    isInvestor: viewMode === 'investor',
    showSection: (visibility: ViewMode[]) => visibility.includes(viewMode),
  };
}

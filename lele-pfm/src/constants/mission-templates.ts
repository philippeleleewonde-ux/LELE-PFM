// GPS Investment Mission templates — 12-month progressive roadmap
import { MissionTemplate } from '@/types/investment';

export const MISSION_TEMPLATES: MissionTemplate[] = [
  { id: 'M01', month: 1, titleKey: 'gps.missions.m01.title', descKey: 'gps.missions.m01.desc', pillar: 'base_arriere', difficulty: 1, actionType: 'open_account' },
  { id: 'M02', month: 2, titleKey: 'gps.missions.m02.title', descKey: 'gps.missions.m02.desc', pillar: 'base_arriere', difficulty: 1, actionType: 'setup_transfer' },
  { id: 'M03', month: 3, titleKey: 'gps.missions.m03.title', descKey: 'gps.missions.m03.desc', pillar: 'croissance', difficulty: 2, actionType: 'first_invest' },
  { id: 'M04', month: 4, titleKey: 'gps.missions.m04.title', descKey: 'gps.missions.m04.desc', pillar: 'croissance', difficulty: 2, actionType: 'first_invest' },
  { id: 'M05', month: 5, titleKey: 'gps.missions.m05.title', descKey: 'gps.missions.m05.desc', pillar: 'amortisseur', difficulty: 2, actionType: 'first_invest' },
  { id: 'M06', month: 6, titleKey: 'gps.missions.m06.title', descKey: 'gps.missions.m06.desc', pillar: 'refuge', difficulty: 2, actionType: 'first_invest' },
  { id: 'M07', month: 7, titleKey: 'gps.missions.m07.title', descKey: 'gps.missions.m07.desc', pillar: 'base_arriere', difficulty: 1, actionType: 'review' },
  { id: 'M08', month: 8, titleKey: 'gps.missions.m08.title', descKey: 'gps.missions.m08.desc', pillar: 'croissance', difficulty: 2, actionType: 'rebalance' },
  { id: 'M09', month: 9, titleKey: 'gps.missions.m09.title', descKey: 'gps.missions.m09.desc', pillar: 'amortisseur', difficulty: 3, actionType: 'diversify' },
  { id: 'M10', month: 10, titleKey: 'gps.missions.m10.title', descKey: 'gps.missions.m10.desc', pillar: 'refuge', difficulty: 3, actionType: 'diversify' },
  { id: 'M11', month: 11, titleKey: 'gps.missions.m11.title', descKey: 'gps.missions.m11.desc', pillar: 'croissance', difficulty: 2, actionType: 'review' },
  { id: 'M12', month: 12, titleKey: 'gps.missions.m12.title', descKey: 'gps.missions.m12.desc', pillar: 'base_arriere', difficulty: 3, actionType: 'rebalance' },
];

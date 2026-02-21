const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.utils.book_new();

// ============================================
// SHEET 1: Business Lines (Zone 1)
// ============================================
const zone1Data = [
  ['LIGNES MÉTIER - EXERCICE 2025'],
  [],
  ['Activité', 'Effectifs', 'Équipes', 'Budget (k€)', 'CA N (k€)', 'CA N-1 (k€)'],
  ['Banque de Détail', 450, 12, 8500, 45000, 42000],
  ['Banque Privée', 120, 4, 3200, 18000, 16500],
  ['Assurance Vie', 85, 3, 2100, 12000, 11200],
  ['Gestion d\'Actifs', 65, 2, 4500, 28000, 25000],
  ['Services Numériques', 95, 5, 1800, 8500, 7200],
  ['Crédit Immobilier', 110, 4, 2800, 15000, 14200],
];

const ws1 = XLSX.utils.aoa_to_sheet(zone1Data);
ws1['!cols'] = [
  { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 14 }, { wch: 14 }
];
XLSX.utils.book_append_sheet(wb, ws1, 'Lignes Métier');

// ============================================
// SHEET 2: Financial History (Zone 2)
// ============================================
const zone2Data = [
  ['HISTORIQUE FINANCIER - GROUPE LELE BANQUE'],
  [],
  ['Indicateur', '2025 (N)', '2024 (N-1)', '2023 (N-2)', '2022 (N-3)', '2021 (N-4)'],
  [],
  ['Heures annuelles par personne', 1607],
  [],
  ['Chiffre d\'affaires (k€)', 126500, 116100, 108500, 101200, 95800],
  ['Produit Net Bancaire (k€)', 85200, 78400, 73100, 68500, 64200],
  ['Total revenus (k€)', 126500, 116100, 108500, 101200, 95800],
  [],
  ['Charges d\'exploitation (k€)', 72400, 68200, 65100, 62800, 60500],
  ['Frais de personnel (k€)', 48500, 45800, 43200, 41500, 39800],
  ['Charges générales (k€)', 23900, 22400, 21900, 21300, 20700],
  ['Total dépenses (k€)', 72400, 68200, 65100, 62800, 60500],
  [],
  ['Résultat brut d\'exploitation (k€)', 54100, 47900, 43400, 38400, 35300],
  ['Coefficient d\'exploitation (%)', 57.2, 58.7, 60.0, 62.1, 63.2],
];

const ws2 = XLSX.utils.aoa_to_sheet(zone2Data);
ws2['!cols'] = [
  { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }
];
XLSX.utils.book_append_sheet(wb, ws2, 'Historique Financier');

// ============================================
// SHEET 3: Risk Data (Zone 3)
// ============================================
const zone3Data = [
  ['DONNÉES DE RISQUE PRL/UL - RAPPORT ANNUEL 2025'],
  [],
  ['Paramètre', 'Valeur', 'Unité'],
  ['Unexpected Loss (UL) total', 2450000, 'EUR'],
  ['Années de collecte historique', '5 ans de collecte'],
  [],
  ['VENTILATION PAR CATÉGORIE DE RISQUE'],
  [],
  ['Catégorie', 'Montant (k€)', 'Part (%)'],
  ['Risque opérationnel (Basel II)', 485, 19.8],
  ['Risque de crédit (contrepartie, EAD, PD, LGD)', 720, 29.4],
  ['Risque de marché (VaR, settlement)', 380, 15.5],
  ['Risque de liquidité (transformation, gap)', 295, 12.0],
  ['Risque de réputation (organisationnel, image)', 310, 12.7],
  ['Risque stratégique (assurance santé)', 260, 10.6],
  [],
  ['Total risques', 2450, 100.0],
  [],
  ['INDICATEURS COMPLÉMENTAIRES'],
  [],
  ['Ratio de solvabilité CET1', '12.8%'],
  ['Ratio de levier', '4.5%'],
  ['LCR (Liquidity Coverage Ratio)', '135%'],
  ['NSFR (Net Stable Funding Ratio)', '118%'],
];

const ws3 = XLSX.utils.aoa_to_sheet(zone3Data);
ws3['!cols'] = [
  { wch: 42 }, { wch: 16 }, { wch: 10 }
];
XLSX.utils.book_append_sheet(wb, ws3, 'Données de Risque');

// ============================================
// SHEET 4: Company Info
// ============================================
const companyData = [
  ['FICHE ENTREPRISE'],
  [],
  ['Raison sociale', 'LELE Banque SA'],
  ['Secteur d\'activité', 'Banque & Services Financiers'],
  ['Effectif total', 925],
  ['Nombre d\'équipes', 30],
  ['Email contact', 'cfo@lele-banque.fr'],
  ['Exercice fiscal', '01/01/2025 - 31/12/2025'],
  ['Devise', 'EUR'],
];

const ws4 = XLSX.utils.aoa_to_sheet(companyData);
ws4['!cols'] = [{ wch: 22 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, ws4, 'Entreprise');

// ============================================
// WRITE FILE
// ============================================
const outputPath = path.join(process.env.HOME, 'Downloads', 'LELE_Banque_Test_DataScanner.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`Fichier créé: ${outputPath}`);

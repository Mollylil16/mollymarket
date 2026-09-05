/**
 * Utilitaires de formatage monétaire et numérique pour Molly Market (Côte d'Ivoire - FCFA)
 */

export const formatFCFA = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 FCFA';
  }
  // En Côte d'Ivoire (Zone UEMOA / Franc CFA), les montants n'ont généralement pas de centimes
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
};

export const formatNombre = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) {
    return '0';
  }
  return val.toLocaleString('fr-FR');
};

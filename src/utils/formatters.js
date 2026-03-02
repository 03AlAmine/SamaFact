// utils/formatters.js

/**
 * Formate un nombre avec séparateurs de milliers
 * @param {number} value - La valeur à formater
 * @returns {string} - La valeur formatée
 */
/**
 * Retourne l'icône correspondant au statut
 * @param {string} statut - Le statut
 * @returns {JSX.Element} - L'élément JSX de l'icône
 */
import { FaCheckCircle, FaClock, FaMoneyBillWave, FaFileInvoiceDollar, FaTimesCircle } from 'react-icons/fa';

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return Number(value).toLocaleString('fr-FR');
};

/**
 * Formate une date
 * @param {string|Date} date - La date à formater
 * @param {string} format - Le format souhaité (short, long, full)
 * @returns {string} - La date formatée
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'Date invalide';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Date invalide';
  
  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
  };
  
  return d.toLocaleDateString('fr-FR', options[format] || options.short);
};

/**
 * Retourne la couleur correspondant au statut
 * @param {string} statut - Le statut
 * @returns {string} - Le code couleur hexadécimal
 */
export const getStatusColor = (statut) => {
  switch (statut?.toLowerCase()) {
    case 'payé':
    case 'paye':
      return '#10b981';
    case 'en attente':
    case 'attente':
      return '#f59e0b';
    case 'acompte':
      return '#8b5cf6';
    case 'brouillon':
      return '#64748b';
    case 'annulé':
    case 'annule':
      return '#ef4444';
    default:
      return '#64748b';
  }
};

export const getStatusIcon = (statut) => {
  switch (statut?.toLowerCase()) {
    case 'payé':
    case 'paye':
      return <FaCheckCircle />;
    case 'en attente':
    case 'attente':
      return <FaClock />;
    case 'acompte':
      return <FaMoneyBillWave />;
    case 'annulé':
    case 'annule':
      return <FaTimesCircle />;
    default:
      return <FaFileInvoiceDollar />;
  }
};

/**
 * Calcule le pourcentage
 * @param {number} value - La valeur partielle
 * @param {number} total - La valeur totale
 * @returns {string} - Le pourcentage formaté
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
};

/**
 * Tronque un texte avec des points de suspension
 * @param {string} text - Le texte à tronquer
 * @param {number} length - La longueur maximale
 * @returns {string} - Le texte tronqué
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Formate un montant en FCFA
 * @param {number} amount - Le montant
 * @returns {string} - Le montant formaté
 */
export const formatCurrency = (amount) => {
  return formatNumber(amount) + ' FCFA';
};
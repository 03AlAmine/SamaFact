import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  startAfter,
} from 'firebase/firestore';

// Cache pour les requêtes fréquentes
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Requête paginée pour les factures
export const getInvoicesPaginated = async (
  companyId,
  type = 'facture',
  lastVisible = null,
  pageSize = 20
) => {
  try {
    let q = query(
      collection(db, `companies/${companyId}/factures`),
      where('type', '==', type),
      orderBy('date', 'desc'),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return {
      invoices,
      lastVisible: lastDoc,
      hasMore: snapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error('Erreur pagination factures:', error);
    throw error;
  }
};

// Requête avec cache
export const getCachedQuery = async (cacheKey, queryFn) => {
  const cached = queryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await queryFn();
  queryCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
};

// Requête optimisée pour les statistiques
export const getOptimizedStats = async (companyId, period = 'month') => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const q = query(
    collection(db, `companies/${companyId}/factures`),
    where('date', '>=', startDate.toISOString()),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  const invoices = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Calcul des statistiques
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.statut === 'payé').length,
    pending: invoices.filter(i => i.statut === 'en attente').length,
    totalAmount: invoices.reduce((sum, i) => sum + (parseFloat(i.totalTTC) || 0), 0),
    paidAmount: invoices
      .filter(i => i.statut === 'payé')
      .reduce((sum, i) => sum + (parseFloat(i.totalTTC) || 0), 0)
  };

  return stats;
};

// Requête pour les tendances
export const getTrends = async (companyId, months = 6) => {
  const now = new Date();
  const startDate = new Date(now.setMonth(now.getMonth() - months));

  const q = query(
    collection(db, `companies/${companyId}/factures`),
    where('date', '>=', startDate.toISOString()),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  const invoices = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Regroupement par mois
  const monthlyData = {};
  
  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: date.toLocaleString('fr-FR', { month: 'short' }),
        year: date.getFullYear(),
        count: 0,
        amount: 0
      };
    }
    
    monthlyData[monthKey].count++;
    monthlyData[monthKey].amount += parseFloat(invoice.totalTTC) || 0;
  });

  return Object.values(monthlyData);
};
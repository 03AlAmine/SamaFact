import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

// ─── Types de notifications ───────────────────────────────────────────────────
export const NOTIF_TYPES = {
  OVERDUE_INVOICE:    'overdue_invoice',
  UNPAID_INVOICE:     'unpaid_invoice',
  EXPIRING_CONTRACT:  'expiring_contract',
  UNPAID_PAYROLL:     'unpaid_payroll',
  NEW_CLIENT:         'new_client',
  EMPLOYEE_ON_LEAVE:  'employee_on_leave',
};

const NOTIF_CONFIG = {
  [NOTIF_TYPES.OVERDUE_INVOICE]:   { color: '#ef4444', severity: 'danger',  icon: '🚨' },
  [NOTIF_TYPES.UNPAID_INVOICE]:    { color: '#f59e0b', severity: 'warning', icon: '⚠️' },
  [NOTIF_TYPES.EXPIRING_CONTRACT]: { color: '#f97316', severity: 'warning', icon: '📋' },
  [NOTIF_TYPES.UNPAID_PAYROLL]:    { color: '#ef4444', severity: 'danger',  icon: '💸' },
  [NOTIF_TYPES.NEW_CLIENT]:        { color: '#10b981', severity: 'success', icon: '🎉' },
  [NOTIF_TYPES.EMPLOYEE_ON_LEAVE]: { color: '#3b82f6', severity: 'info',   icon: '🏖️' },
};

// ─── Context ─────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

export function NotificationProvider({ children, allFactures, employees, payrolls, clients }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const companyId = currentUser?.companyId;
  const userId    = currentUser?.uid;

  // ── Charger les notifs lues depuis Firestore ──────────────────────────────
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    if (!companyId || !userId) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, `companies/${companyId}/notifications`),
          where('userId', '==', userId),
          where('read', '==', true),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const ids = new Set(snap.docs.map(d => d.data().notifKey));
        setReadIds(ids);
      } catch (e) {
        // Silencieux — les notifs restent visibles si Firestore échoue
      }
    };
    load();
  }, [companyId, userId]);

  // ── Générer les notifications depuis les données ──────────────────────────
  const generated = useMemo(() => {
    const notifs = [];
    const today  = new Date();

    // 1. Factures en retard (échéance dépassée + non payée)
    const overdue = (allFactures || []).filter(f => {
      if (!['en attente', 'partiel'].includes(f?.statut)) return false;
      const due = new Date(f.echeance || f.date);
      return due < today;
    });
    if (overdue.length > 0) {
      const total = overdue.reduce((s, f) => s + (parseFloat(f.totalTTC) || 0), 0);
      notifs.push({
        key:      NOTIF_TYPES.OVERDUE_INVOICE,
        type:     NOTIF_TYPES.OVERDUE_INVOICE,
        title:    'Factures en retard',
        message:  `${overdue.length} facture(s) dépassent leur échéance`,
        amount:   total,
        count:    overdue.length,
        link:     '/invoice',
        time:     'Urgent',
        ...NOTIF_CONFIG[NOTIF_TYPES.OVERDUE_INVOICE],
      });
    }

    // 2. Factures en attente (pas encore échues)
    const unpaidInvoices = (allFactures || []).filter(f => {
      if (f?.statut !== 'en attente') return false;
      const due = new Date(f.echeance || f.date);
      return due >= today;
    });
    if (unpaidInvoices.length > 0) {
      const total = unpaidInvoices.reduce((s, f) => s + (parseFloat(f.totalTTC) || 0), 0);
      notifs.push({
        key:     NOTIF_TYPES.UNPAID_INVOICE,
        type:    NOTIF_TYPES.UNPAID_INVOICE,
        title:   'Factures impayées',
        message: `${unpaidInvoices.length} facture(s) en attente de paiement`,
        amount:  total,
        count:   unpaidInvoices.length,
        link:    '/invoice',
        time:    'À suivre',
        ...NOTIF_CONFIG[NOTIF_TYPES.UNPAID_INVOICE],
      });
    }

    // 3. Contrats CDD expirant dans les 30 jours
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring = (employees || []).filter(e => {
      if (e?.typeContrat?.toLowerCase() !== 'cdd') return false;
      if (!e?.dateFinContrat) return false;
      const end = new Date(e.dateFinContrat);
      return end >= today && end <= in30Days;
    });
    if (expiring.length > 0) {
      notifs.push({
        key:     NOTIF_TYPES.EXPIRING_CONTRACT,
        type:    NOTIF_TYPES.EXPIRING_CONTRACT,
        title:   'Contrats CDD expirants',
        message: `${expiring.length} contrat(s) expirent dans moins de 30 jours`,
        count:   expiring.length,
        details: expiring.map(e => `${e.prenom} ${e.nom}`).slice(0, 3),
        link:    '/payroll',
        time:    'Ce mois',
        ...NOTIF_CONFIG[NOTIF_TYPES.EXPIRING_CONTRACT],
      });
    }

    // 4. Bulletins de paie non payés
    const unpaidPayrolls = (payrolls || []).filter(p => p?.statut === 'validated');
    if (unpaidPayrolls.length > 0) {
      const total = unpaidPayrolls.reduce((s, p) =>
        s + (parseFloat(p?.calculations?.salaireNetAPayer) || 0), 0);
      notifs.push({
        key:     NOTIF_TYPES.UNPAID_PAYROLL,
        type:    NOTIF_TYPES.UNPAID_PAYROLL,
        title:   'Bulletins non payés',
        message: `${unpaidPayrolls.length} bulletin(s) validé(s) en attente de paiement`,
        amount:  total,
        count:   unpaidPayrolls.length,
        link:    '/payroll',
        time:    'En attente',
        ...NOTIF_CONFIG[NOTIF_TYPES.UNPAID_PAYROLL],
      });
    }

    // 5. Employés en congés
    const onLeave = (employees || []).filter(e => e?.enConges);
    if (onLeave.length > 0) {
      notifs.push({
        key:     NOTIF_TYPES.EMPLOYEE_ON_LEAVE,
        type:    NOTIF_TYPES.EMPLOYEE_ON_LEAVE,
        title:   'Employés en congés',
        message: `${onLeave.length} employé(s) actuellement absent(s)`,
        count:   onLeave.length,
        details: onLeave.map(e => `${e.prenom} ${e.nom}`).slice(0, 3),
        link:    '/payroll',
        time:    "Aujourd'hui",
        ...NOTIF_CONFIG[NOTIF_TYPES.EMPLOYEE_ON_LEAVE],
      });
    }

    // 6. Nouveaux clients ce mois
    const newClients = (clients || []).filter(c => {
      try {
        const d = new Date(c?.createdAt?.seconds ? c.createdAt.toDate() : c.createdAt);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      } catch { return false; }
    });
    if (newClients.length > 0) {
      notifs.push({
        key:     NOTIF_TYPES.NEW_CLIENT,
        type:    NOTIF_TYPES.NEW_CLIENT,
        title:   'Nouveaux clients',
        message: `${newClients.length} nouveau(x) client(s) ce mois-ci`,
        count:   newClients.length,
        link:    '/invoice',
        time:    'Ce mois',
        ...NOTIF_CONFIG[NOTIF_TYPES.NEW_CLIENT],
      });
    }

    return notifs;
  }, [allFactures, employees, payrolls, clients]);

  // Filtrer les notifs déjà lues
  useEffect(() => {
    setNotifications(generated.filter(n => !readIds.has(n.key)));
  }, [generated, readIds]);

  // ── Marquer une notif comme lue ───────────────────────────────────────────
  const markAsRead = useCallback(async (key) => {
    setNotifications(prev => prev.filter(n => n.key !== key));
    setReadIds(prev => new Set([...prev, key]));

    if (!companyId || !userId) return;
    try {
      await addDoc(collection(db, `companies/${companyId}/notifications`), {
        notifKey:  key,
        userId,
        read:      true,
        createdAt: serverTimestamp(),
      });
    } catch { /* silencieux */ }
  }, [companyId, userId]);

  // ── Tout marquer comme lu ─────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const keys = notifications.map(n => n.key);
    setNotifications([]);
    setReadIds(prev => new Set([...prev, ...keys]));

    if (!companyId || !userId || keys.length === 0) return;
    try {
      const batch = writeBatch(db);
      keys.forEach(key => {
        const ref = doc(collection(db, `companies/${companyId}/notifications`));
        batch.set(ref, { notifKey: key, userId, read: true, createdAt: serverTimestamp() });
      });
      await batch.commit();
    } catch { /* silencieux */ }
  }, [notifications, companyId, userId]);

  // ── Réinitialiser (ex: refresh forcé) ────────────────────────────────────
  const resetRead = useCallback(async () => {
    if (!companyId || !userId) return;
    try {
      const q = query(
        collection(db, `companies/${companyId}/notifications`),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setReadIds(new Set());
    } catch { /* silencieux */ }
  }, [companyId, userId]);

  const unreadCount = notifications.length;

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    resetRead,
    NOTIF_CONFIG,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
import { createContext, useContext, useCallback } from 'react';
import {
  collection, addDoc, getDocs, query,
  where, orderBy, limit, serverTimestamp, writeBatch, doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

// ─── Types d'actions auditées ─────────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  // Documents
  CREATE_INVOICE:    'CREATE_INVOICE',
  UPDATE_INVOICE:    'UPDATE_INVOICE',
  DELETE_INVOICE:    'DELETE_INVOICE',
  PAY_INVOICE:       'PAY_INVOICE',
  CREATE_DEVIS:      'CREATE_DEVIS',
  UPDATE_DEVIS:      'UPDATE_DEVIS',
  DELETE_DEVIS:      'DELETE_DEVIS',
  CREATE_AVOIR:      'CREATE_AVOIR',
  DELETE_AVOIR:      'DELETE_AVOIR',

  // Clients
  CREATE_CLIENT:     'CREATE_CLIENT',
  UPDATE_CLIENT:     'UPDATE_CLIENT',
  DELETE_CLIENT:     'DELETE_CLIENT',

  // Employés
  CREATE_EMPLOYEE:   'CREATE_EMPLOYEE',
  UPDATE_EMPLOYEE:   'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE:   'DELETE_EMPLOYEE',

  // Bulletins
  CREATE_PAYROLL:    'CREATE_PAYROLL',
  UPDATE_PAYROLL:    'UPDATE_PAYROLL',
  DELETE_PAYROLL:    'DELETE_PAYROLL',
  PAY_PAYROLL:       'PAY_PAYROLL',
  VALIDATE_PAYROLL:  'VALIDATE_PAYROLL',
  CANCEL_PAYROLL:    'CANCEL_PAYROLL',

  // Utilisateurs
  LOGIN:             'LOGIN',
  LOGOUT:            'LOGOUT',
  CREATE_USER:       'CREATE_USER',
  UPDATE_USER_ROLE:  'UPDATE_USER_ROLE',
  DELETE_USER:       'DELETE_USER',

  // Équipes
  CREATE_TEAM:       'CREATE_TEAM',
  UPDATE_TEAM:       'UPDATE_TEAM',
  DELETE_TEAM:       'DELETE_TEAM',
};

// ─── Catégories lisibles ──────────────────────────────────────────────────────
export const ACTION_LABELS = {
  CREATE_INVOICE:   { label: 'Facture créée',         category: 'Facture',   color: '#10b981', icon: '📄' },
  UPDATE_INVOICE:   { label: 'Facture modifiée',       category: 'Facture',   color: '#3b82f6', icon: '✏️' },
  DELETE_INVOICE:   { label: 'Facture supprimée',      category: 'Facture',   color: '#ef4444', icon: '🗑️' },
  PAY_INVOICE:      { label: 'Facture payée',          category: 'Facture',   color: '#8b5cf6', icon: '💰' },
  CREATE_DEVIS:     { label: 'Devis créé',             category: 'Devis',     color: '#10b981', icon: '📋' },
  UPDATE_DEVIS:     { label: 'Devis modifié',          category: 'Devis',     color: '#3b82f6', icon: '✏️' },
  DELETE_DEVIS:     { label: 'Devis supprimé',         category: 'Devis',     color: '#ef4444', icon: '🗑️' },
  CREATE_AVOIR:     { label: 'Avoir créé',             category: 'Avoir',     color: '#10b981', icon: '📋' },
  DELETE_AVOIR:     { label: 'Avoir supprimé',         category: 'Avoir',     color: '#ef4444', icon: '🗑️' },
  CREATE_CLIENT:    { label: 'Client créé',            category: 'Client',    color: '#10b981', icon: '👤' },
  UPDATE_CLIENT:    { label: 'Client modifié',         category: 'Client',    color: '#3b82f6', icon: '✏️' },
  DELETE_CLIENT:    { label: 'Client supprimé',        category: 'Client',    color: '#ef4444', icon: '🗑️' },
  CREATE_EMPLOYEE:  { label: 'Employé créé',           category: 'Employé',   color: '#10b981', icon: '👷' },
  UPDATE_EMPLOYEE:  { label: 'Employé modifié',        category: 'Employé',   color: '#3b82f6', icon: '✏️' },
  DELETE_EMPLOYEE:  { label: 'Employé supprimé',       category: 'Employé',   color: '#ef4444', icon: '🗑️' },
  CREATE_PAYROLL:   { label: 'Bulletin créé',          category: 'Paie',      color: '#10b981', icon: '🧾' },
  UPDATE_PAYROLL:   { label: 'Bulletin modifié',       category: 'Paie',      color: '#3b82f6', icon: '✏️' },
  DELETE_PAYROLL:   { label: 'Bulletin supprimé',      category: 'Paie',      color: '#ef4444', icon: '🗑️' },
  PAY_PAYROLL:      { label: 'Bulletin payé',          category: 'Paie',      color: '#8b5cf6', icon: '💸' },
  VALIDATE_PAYROLL: { label: 'Bulletin validé',        category: 'Paie',      color: '#f59e0b', icon: '✅' },
  CANCEL_PAYROLL:   { label: 'Bulletin annulé',        category: 'Paie',      color: '#6b7280', icon: '❌' },
  LOGIN:            { label: 'Connexion',              category: 'Session',   color: '#10b981', icon: '🔐' },
  LOGOUT:           { label: 'Déconnexion',            category: 'Session',   color: '#6b7280', icon: '🚪' },
  CREATE_USER:      { label: 'Utilisateur créé',       category: 'Utilisateur', color: '#10b981', icon: '👤' },
  UPDATE_USER_ROLE: { label: 'Rôle modifié',           category: 'Utilisateur', color: '#f59e0b', icon: '🔑' },
  DELETE_USER:      { label: 'Utilisateur supprimé',   category: 'Utilisateur', color: '#ef4444', icon: '🗑️' },
  CREATE_TEAM:      { label: 'Équipe créée',           category: 'Équipe',    color: '#10b981', icon: '👥' },
  UPDATE_TEAM:      { label: 'Équipe modifiée',        category: 'Équipe',    color: '#3b82f6', icon: '✏️' },
  DELETE_TEAM:      { label: 'Équipe supprimée',       category: 'Équipe',    color: '#ef4444', icon: '🗑️' },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AuditContext = createContext(null);

export function AuditProvider({ children }) {
  const { currentUser } = useAuth();

  // ── Logger une action ────────────────────────────────────────────────────
  const logAction = useCallback(async ({
    action,
    targetType,       // 'facture' | 'employee' | 'client' | etc.
    targetId,         // ID de la ressource concernée
    targetLabel,      // Libellé lisible ex: "FAC-2024-001" ou "Jean Dupont"
    before = null,    // État avant modification
    after  = null,    // État après modification
    metadata = {},    // Infos supplémentaires libres
  }) => {
    if (!currentUser?.uid || !currentUser?.companyId) return;

    try {
      const entry = {
        // Qui
        userId:       currentUser.uid,
        userName:     currentUser.name || currentUser.email,
        userRole:     currentUser.role,
        userEmail:    currentUser.email,

        // Quoi
        action,
        targetType,
        targetId:     targetId || null,
        targetLabel:  targetLabel || null,

        // Avant / Après
        before:       before ? sanitize(before) : null,
        after:        after  ? sanitize(after)  : null,

        // Contexte technique
        ip:           await getClientIP(),
        userAgent:    navigator.userAgent,
        platform:     getPlatform(),

        // Méta
        ...metadata,

        // Quand
        createdAt:    serverTimestamp(),
        companyId:    currentUser.companyId,
      };

      await addDoc(
        collection(db, `companies/${currentUser.companyId}/audit_logs`),
        entry
      );
    } catch (err) {
      // Silencieux en prod — l'audit ne doit jamais bloquer une action métier
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Audit] Failed to log:', err?.message);
      }
    }
  }, [currentUser]);

  // ── Charger les logs (pour la page audit) ────────────────────────────────
  const fetchLogs = useCallback(async ({
    limitCount = 200,
    filterAction = null,
    filterCategory = null,
    filterUserId = null,
    startDate = null,
    endDate = null,
  } = {}) => {
    if (!currentUser?.companyId) return [];

    try {
      let q = query(
        collection(db, `companies/${currentUser.companyId}/audit_logs`),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snap = await getDocs(q);
      let logs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      }));

      // Filtres côté client (plus flexible qu'index Firestore)
      if (filterAction)   logs = logs.filter(l => l.action === filterAction);
      if (filterCategory) logs = logs.filter(l => ACTION_LABELS[l.action]?.category === filterCategory);
      if (filterUserId)   logs = logs.filter(l => l.userId === filterUserId);
      if (startDate)      logs = logs.filter(l => l.createdAt >= new Date(startDate));
      if (endDate)        logs = logs.filter(l => l.createdAt <= new Date(endDate + 'T23:59:59'));

      return logs;
    } catch (err) {
      console.error('[Audit] fetchLogs failed:', err);
      return [];
    }
  }, [currentUser?.companyId]);

  // ── Supprimer les anciens logs (>1 an) ───────────────────────────────────
  const purgeOldLogs = useCallback(async () => {
    if (!currentUser?.companyId) return;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    try {
      const q = query(
        collection(db, `companies/${currentUser.companyId}/audit_logs`),
        where('createdAt', '<', oneYearAgo)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;

      // Batch delete par tranches de 500
      const chunks = [];
      for (let i = 0; i < snap.docs.length; i += 500) {
        chunks.push(snap.docs.slice(i, i + 500));
      }
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(doc(db, `companies/${currentUser.companyId}/audit_logs`, d.id)));
        await batch.commit();
      }
    } catch (err) {
      console.warn('[Audit] Purge failed:', err?.message);
    }
  }, [currentUser?.companyId]);

  return (
    <AuditContext.Provider value={{ logAction, fetchLogs, purgeOldLogs }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error('useAudit must be used inside AuditProvider');
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Supprimer les champs sensibles avant de stocker
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const EXCLUDED = ['password', 'motDePasse', 'token', 'secret', 'privateKey'];
  const result = { ...obj };
  EXCLUDED.forEach(k => delete result[k]);
  // Limiter la taille (Firestore: 1MB/doc)
  const str = JSON.stringify(result);
  if (str.length > 50000) return { _truncated: true, _size: str.length };
  return result;
}

// IP publique (best-effort, silencieux si bloqué)
async function getClientIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getPlatform() {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}
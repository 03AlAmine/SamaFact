import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShieldAlt, FaFilter, FaDownload, FaSearch, FaSync,
  FaTable, FaStream, FaTrash, FaEye, FaTimes, 
  FaUser, FaCalendarAlt, FaTag, FaInfoCircle
} from 'react-icons/fa';
import { useAudit, ACTION_LABELS } from '../contexts/AuditContext';
import { useAuth } from '../auth/AuthContext';
import '../css/AuditPage.css';

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Tous', 'Facture', 'Devis', 'Avoir', 'Client', 'Employé', 'Paie', 'Session', 'Utilisateur', 'Équipe'];

const ROLE_LABELS = {
  superadmin: 'Super Admin', supadmin: 'Sup Admin', admin: 'Admin',
  comptable: 'Comptable', rh_daf: 'RH/DAF', charge_compte: 'Chargé Compte',
  employe: 'Employé', lecteur: 'Lecteur',
};

// ─── Composant détail d'un log ────────────────────────────────────────────────
const LogDetail = ({ log, onClose }) => {
  if (!log) return null;
  const meta = ACTION_LABELS[log.action] || { label: log.action, icon: '📝', color: '#6b7280' };

  return (
    <motion.div
      className="audit-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="audit-detail-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="audit-detail-header" style={{ borderColor: meta.color }}>
          <div className="audit-detail-title">
            <span className="audit-detail-icon">{meta.icon}</span>
            <div>
              <h2>{meta.label}</h2>
              <span className="audit-detail-time">
                {log.createdAt?.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
          <button className="audit-detail-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="audit-detail-body">
          {/* Qui */}
          <section className="audit-detail-section">
            <h3><FaUser /> Utilisateur</h3>
            <div className="audit-detail-grid">
              <div><span>Nom</span><strong>{log.userName || '—'}</strong></div>
              <div><span>Email</span><strong>{log.userEmail || '—'}</strong></div>
              <div><span>Rôle</span><strong>{ROLE_LABELS[log.userRole] || log.userRole || '—'}</strong></div>
              <div><span>Appareil</span><strong>{log.platform || '—'}</strong></div>
              <div><span>IP</span><strong>{log.ip || '—'}</strong></div>
            </div>
          </section>

          {/* Quoi */}
          <section className="audit-detail-section">
            <h3><FaTag /> Ressource concernée</h3>
            <div className="audit-detail-grid">
              <div><span>Type</span><strong>{log.targetType || '—'}</strong></div>
              <div><span>Référence</span><strong>{log.targetLabel || log.targetId || '—'}</strong></div>
            </div>
          </section>

          {/* Avant */}
          {log.before && (
            <section className="audit-detail-section">
              <h3 className="audit-before">Avant la modification</h3>
              <pre className="audit-json audit-json--before">
                {JSON.stringify(log.before, null, 2)}
              </pre>
            </section>
          )}

          {/* Après */}
          {log.after && (
            <section className="audit-detail-section">
              <h3 className="audit-after">Après la modification</h3>
              <pre className="audit-json audit-json--after">
                {JSON.stringify(log.after, null, 2)}
              </pre>
            </section>
          )}

          {/* Navigateur */}
          {log.userAgent && (
            <section className="audit-detail-section">
              <h3><FaInfoCircle /> Navigateur</h3>
              <p className="audit-useragent">{log.userAgent}</p>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const AuditPage = () => {
  const { fetchLogs, purgeOldLogs } = useAudit();
  const { currentUser } = useAuth();

  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [viewMode, setViewMode]       = useState('table'); // 'table' | 'timeline'
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtres
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('Tous');
  const [dateStart, setDateStart]     = useState('');
  const [dateEnd, setDateEnd]         = useState('');
  const [userFilter, setUserFilter]   = useState('');

  // ── Chargement ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLogs({
      limitCount: 500,
      filterCategory: category !== 'Tous' ? category : null,
      startDate: dateStart || null,
      endDate:   dateEnd   || null,
    });
    setLogs(data);
    setLoading(false);
  }, [fetchLogs, category, dateStart, dateEnd]);

  useEffect(() => { load(); }, [load]);

  // ── Filtres côté client (search + user) ──────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter(l => {
      if (q && !(
        l.userName?.toLowerCase().includes(q) ||
        l.targetLabel?.toLowerCase().includes(q) ||
        l.userEmail?.toLowerCase().includes(q) ||
        ACTION_LABELS[l.action]?.label?.toLowerCase().includes(q)
      )) return false;
      if (userFilter && l.userId !== userFilter) return false;
      return true;
    });
  }, [logs, search, userFilter]);

  // ── Utilisateurs distincts (pour le filtre) ───────────────────────────────
  const uniqueUsers = useMemo(() => {
    const map = new Map();
    logs.forEach(l => { if (l.userId) map.set(l.userId, l.userName || l.userEmail); });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [logs]);

  // ── Stats rapides ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const deletions   = filtered.filter(l => l.action?.includes('DELETE')).length;
    const creations   = filtered.filter(l => l.action?.includes('CREATE')).length;
    const payments    = filtered.filter(l => l.action?.includes('PAY')).length;
    const sessions    = filtered.filter(l => ['LOGIN','LOGOUT'].includes(l.action)).length;
    return { deletions, creations, payments, sessions, total: filtered.length };
  }, [filtered]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const headers = ['Date', 'Utilisateur', 'Rôle', 'Action', 'Catégorie', 'Référence', 'IP', 'Appareil'];
    const rows = filtered.map(l => [
      l.createdAt?.toLocaleString('fr-FR') || '',
      l.userName || '',
      ROLE_LABELS[l.userRole] || l.userRole || '',
      ACTION_LABELS[l.action]?.label || l.action || '',
      ACTION_LABELS[l.action]?.category || '',
      l.targetLabel || l.targetId || '',
      l.ip || '',
      l.platform || '',
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // ── Purge ─────────────────────────────────────────────────────────────────
  const handlePurge = useCallback(async () => {
    if (!window.confirm('Supprimer tous les logs de plus d\'1 an ? Cette action est irréversible.')) return;
    await purgeOldLogs();
    load();
  }, [purgeOldLogs, load]);

  // ─── Rendu tableau ────────────────────────────────────────────────────────
  const renderTable = () => (
    <div className="audit-table-wrapper">
      <table className="audit-table">
        <thead>
          <tr>
            <th>Date & Heure</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Ressource</th>
            <th>IP</th>
            <th>Appareil</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {filtered.length > 0 ? filtered.map((log, i) => {
              const meta = ACTION_LABELS[log.action] || { label: log.action, icon: '📝', color: '#6b7280', category: '?' };
              return (
                <motion.tr
                  key={log.id}
                  className="audit-row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="audit-cell-date">
                    <span className="audit-date">{log.createdAt?.toLocaleDateString('fr-FR')}</span>
                    <span className="audit-time">{log.createdAt?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="audit-cell-user">
                    <div className="audit-user-chip">
                      <div className="audit-user-avatar" style={{ background: stringToColor(log.userName) }}>
                        {(log.userName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="audit-user-name">{log.userName || '—'}</span>
                        <span className="audit-user-role">{ROLE_LABELS[log.userRole] || log.userRole}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="audit-action-badge" style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>
                      {meta.icon} {meta.label}
                    </span>
                  </td>
                  <td className="audit-cell-target">
                    <span className="audit-category">{meta.category}</span>
                    {log.targetLabel && <span className="audit-target-label">{log.targetLabel}</span>}
                  </td>
                  <td><span className="audit-ip">{log.ip || '—'}</span></td>
                  <td>
                    <span className={`audit-platform audit-platform--${log.platform}`}>
                      {log.platform === 'mobile' ? '📱' : log.platform === 'tablet' ? '💻' : '🖥️'}
                      {log.platform || '—'}
                    </span>
                  </td>
                  <td>
                    <button className="audit-view-btn" title="Voir les détails">
                      <FaEye />
                    </button>
                  </td>
                </motion.tr>
              );
            }) : (
              <tr><td colSpan={7} className="audit-empty">Aucun log trouvé</td></tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );

  // ─── Rendu timeline ───────────────────────────────────────────────────────
  const renderTimeline = () => {
    // Grouper par jour
    const groups = filtered.reduce((acc, log) => {
      const day = log.createdAt?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || 'Inconnu';
      if (!acc[day]) acc[day] = [];
      acc[day].push(log);
      return acc;
    }, {});

    return (
      <div className="audit-timeline">
        {Object.entries(groups).map(([day, dayLogs]) => (
          <div key={day} className="audit-timeline-day">
            <div className="audit-timeline-day-label">
              <FaCalendarAlt />
              <span>{day}</span>
              <span className="audit-timeline-day-count">{dayLogs.length} action(s)</span>
            </div>
            <div className="audit-timeline-events">
              {dayLogs.map((log, i) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, icon: '📝', color: '#6b7280' };
                return (
                  <motion.div
                    key={log.id}
                    className="audit-timeline-event"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="audit-timeline-dot" style={{ background: meta.color }} />
                    <div className="audit-timeline-content">
                      <div className="audit-timeline-top">
                        <span className="audit-action-badge" style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>
                          {meta.icon} {meta.label}
                        </span>
                        <span className="audit-timeline-hour">
                          {log.createdAt?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="audit-timeline-meta">
                        <span>
                          <div className="audit-user-avatar-sm" style={{ background: stringToColor(log.userName) }}>
                            {(log.userName || '?')[0].toUpperCase()}
                          </div>
                          {log.userName}
                        </span>
                        {log.targetLabel && <span>→ {log.targetLabel}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="audit-empty">Aucun log trouvé</div>}
      </div>
    );
  };

  return (
    <div className="audit-page">
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="audit-header">
        <div className="audit-header-left">
          <div className="audit-header-icon">
            <FaShieldAlt />
          </div>
          <div>
            <h1>Journal d'Audit</h1>
            <p>Traçabilité complète de toutes les actions sur la plateforme</p>
          </div>
        </div>
        <div className="audit-header-actions">
          <button className="audit-btn audit-btn--ghost" onClick={load} title="Actualiser">
            <FaSync className={loading ? 'spinning' : ''} />
          </button>
          <button className="audit-btn audit-btn--ghost" onClick={exportCSV} title="Exporter CSV">
            <FaDownload /> Export CSV
          </button>
          <button className="audit-btn audit-btn--danger" onClick={handlePurge} title="Purger les logs anciens">
            <FaTrash /> Purger ({'>'}1 an)
          </button>
        </div>
      </div>

      {/* ── Stats rapides ────────────────────────────────────────────────── */}
      <div className="audit-stats-row">
        {[
          { label: 'Total', value: stats.total, color: '#6b7280', icon: '📊' },
          { label: 'Créations', value: stats.creations, color: '#10b981', icon: '✨' },
          { label: 'Suppressions', value: stats.deletions, color: '#ef4444', icon: '🗑️' },
          { label: 'Paiements', value: stats.payments, color: '#8b5cf6', icon: '💰' },
          { label: 'Sessions', value: stats.sessions, color: '#3b82f6', icon: '🔐' },
        ].map(s => (
          <div key={s.label} className="audit-stat-card" style={{ borderColor: s.color + '40' }}>
            <span className="audit-stat-icon">{s.icon}</span>
            <div>
              <span className="audit-stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="audit-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barre de contrôle ────────────────────────────────────────────── */}
      <div className="audit-controls">
        <div className="audit-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Rechercher un utilisateur, une référence, une action…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><FaTimes /></button>}
        </div>

        <div className="audit-view-toggle">
          <button
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
            title="Vue tableau"
          >
            <FaTable />
          </button>
          <button
            className={viewMode === 'timeline' ? 'active' : ''}
            onClick={() => setViewMode('timeline')}
            title="Vue timeline"
          >
            <FaStream />
          </button>
        </div>

        <button
          className={`audit-btn audit-btn--ghost ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filtres
          {(category !== 'Tous' || dateStart || dateEnd || userFilter) && (
            <span className="audit-filter-dot" />
          )}
        </button>
      </div>

      {/* ── Filtres avancés ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="audit-filters-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="audit-filters-grid">
              {/* Catégorie */}
              <div className="audit-filter-group">
                <label><FaTag /> Catégorie</label>
                <div className="audit-category-chips">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`audit-chip ${category === cat ? 'active' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="audit-filter-group">
                <label><FaCalendarAlt /> Période</label>
                <div className="audit-date-range">
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                  <span>→</span>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                </div>
              </div>

              {/* Utilisateur */}
              <div className="audit-filter-group">
                <label><FaUser /> Utilisateur</label>
                <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="audit-select">
                  <option value="">Tous les utilisateurs</option>
                  {uniqueUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset filtres */}
            {(category !== 'Tous' || dateStart || dateEnd || userFilter) && (
              <button className="audit-reset-btn" onClick={() => {
                setCategory('Tous'); setDateStart(''); setDateEnd(''); setUserFilter('');
              }}>
                <FaTimes /> Réinitialiser les filtres
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Résultats count ──────────────────────────────────────────────── */}
      <div className="audit-result-count">
        {loading ? 'Chargement…' : `${filtered.length} log(s) affiché(s)`}
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="audit-loading">
          <div className="audit-spinner" />
          <span>Chargement des logs…</span>
        </div>
      ) : (
        viewMode === 'table' ? renderTable() : renderTimeline()
      )}

      {/* ── Panneau détail ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLog && <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />}
      </AnimatePresence>
    </div>
  );
};

// ─── Helper couleur depuis string ─────────────────────────────────────────────
function stringToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

export default AuditPage;
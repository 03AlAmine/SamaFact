import React, { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaCheckDouble, FaRedo } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../contexts/NotificationContext';
import { formatNumber } from '../utils/formatters';
import '../css/Notification.css';
// ─── Composant cloche ─────────────────────────────────────────────────────────
const NotificationBell = ({ open, onToggle }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, resetRead } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const btnRef      = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        btnRef.current      && !btnRef.current.contains(e.target)
      ) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onToggle]);

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === 'Escape') onToggle(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onToggle]);

  const handleItemClick = useCallback((notif) => {
    markAsRead(notif.key);
    onToggle(false);
    if (notif.link) navigate(notif.link);
  }, [markAsRead, navigate, onToggle]);

  return (
    <div className="notif-bell-wrapper">
      {/* Bouton cloche */}
      <button
        ref={btnRef}
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''} ${open ? 'active' : ''}`}
        onClick={() => onToggle(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={open}
      >
        <FaBell />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              className="notif-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            className="notif-dropdown"
            role="dialog"
            aria-label="Centre de notifications"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* En-tête */}
            <div className="notif-header">
              <div className="notif-header-left">
                <FaBell className="notif-header-icon" />
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="notif-header-count">{unreadCount}</span>
                )}
              </div>
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button
                    className="notif-action-btn"
                    onClick={markAllAsRead}
                    title="Tout marquer comme lu"
                  >
                    <FaCheckDouble />
                  </button>
                )}
                <button
                  className="notif-action-btn"
                  onClick={resetRead}
                  title="Réinitialiser (réafficher toutes)"
                >
                  <FaRedo />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="notif-list">
              <AnimatePresence initial={false}>
                {notifications.length > 0 ? (
                  notifications.map((notif, i) => (
                    <motion.div
                      key={notif.key}
                      className={`notif-item notif-${notif.severity}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleItemClick(notif)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleItemClick(notif)}
                    >
                      {/* Barre colorée */}
                      <div
                        className="notif-item-bar"
                        style={{ backgroundColor: notif.color }}
                      />

                      {/* Icône */}
                      <div className="notif-item-icon" style={{ color: notif.color }}>
                        <span>{notif.icon}</span>
                      </div>

                      {/* Contenu */}
                      <div className="notif-item-body">
                        <div className="notif-item-top">
                          <span className="notif-item-title">{notif.title}</span>
                          <span className="notif-item-time">{notif.time}</span>
                        </div>
                        <p className="notif-item-message">{notif.message}</p>

                        {/* Détails employés/contrats */}
                        {notif.details && notif.details.length > 0 && (
                          <div className="notif-item-details">
                            {notif.details.map((d, idx) => (
                              <span key={idx} className="notif-detail-chip">{d}</span>
                            ))}
                            {notif.count > 3 && (
                              <span className="notif-detail-chip notif-detail-more">
                                +{notif.count - 3} autres
                              </span>
                            )}
                          </div>
                        )}

                        {/* Montant */}
                        {notif.amount > 0 && (
                          <span
                            className="notif-item-amount"
                            style={{ color: notif.color }}
                          >
                            {formatNumber(notif.amount)} FCFA
                          </span>
                        )}
                      </div>

                      {/* Bouton fermer */}
                      <button
                        className="notif-item-close"
                        onClick={e => { e.stopPropagation(); markAsRead(notif.key); }}
                        aria-label="Marquer comme lu"
                      >
                        <FaTimes />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="notif-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="notif-empty-icon">🔕</div>
                    <p>Tout est à jour</p>
                    <span>Aucune alerte pour le moment</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pied */}
            {notifications.length > 0 && (
              <div className="notif-footer">
                <button className="notif-footer-btn" onClick={markAllAsRead}>
                  Tout marquer comme lu
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(NotificationBell);
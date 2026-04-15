import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import {
  FaArrowDown, FaArrowLeft, FaArrowUp, FaCopy, FaEdit,
  FaEye, FaEyeSlash, FaTrash, FaBars, FaTimes
} from "react-icons/fa";
import InvoicePDF from './InvoicePDF';
import DynamicPDFViewer from '../../components/views/DynamicPDFViewer';
import './styles/Fact.css';
import { PDFDownloadLink } from '@react-pdf/renderer';
import LoadingState from '../../components/common/LoadingState';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const formatCurrency = (numStr) => {
  if (!numStr) return "0,00";
  const cleaned = numStr.toString().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? "0,00" : num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatNumberWithSpaces = (numStr) => {
  if (!numStr) return "0";
  const cleaned = numStr.toString().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  const r = Math.round(num);
  return isNaN(r) ? "0" : r.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const transformToLegacyFormat = (invoiceData) => {
  if (invoiceData.facture && invoiceData.items) return invoiceData;
  const sumItems = (items, key) =>
    (items || []).reduce((s, i) => s + parseFloat((i[key] || '0').replace(',', '.')), 0);
  return {
    facture: {
      Numéro:       [invoiceData.number || ''],
      Date:         [invoiceData.date || new Date().toISOString().split('T')[0]],
      DateEcheance: [invoiceData.dueDate || ''],
      Type:         [invoiceData.type || 'facture']
    },
    client: invoiceData.client ? {
      Nom:     [invoiceData.client.nom || ''],
      Adresse: [invoiceData.client.adresse || ''],
      Ville:   [invoiceData.client.ville || ''],
      Email:   [invoiceData.client.email || '']
    } : { Nom: [], Adresse: [], Ville: [], Email: [] },
    items: invoiceData.items ? {
      Designation:     invoiceData.items.map(i => i.description || ''),
      Quantite:        invoiceData.items.map(i => i.quantity?.toString() || '1'),
      "Prix Unitaire": invoiceData.items.map(i => i.unitPrice?.toString() || '0'),
      TVA:             invoiceData.items.map(i => `${i.taxRate || 0}%`),
      "Montant HT":    invoiceData.items.map(i => i.montantHT || '0'),
      "Montant TVA":   invoiceData.items.map(i => i.montantTVA || '0'),
      "Prix Total":    invoiceData.items.map(i => i.montantTTC || '0')
    } : { Designation:[], Quantite:[], "Prix Unitaire":[], TVA:[], "Montant HT":[], "Montant TVA":[], "Prix Total":[] },
    totals: {
      "Total HT":  [sumItems(invoiceData.items, 'montantHT').toFixed(2).replace('.', ',')],
      "Total TVA": [sumItems(invoiceData.items, 'montantTVA').toFixed(2).replace('.', ',')],
      "Total TTC": [sumItems(invoiceData.items, 'montantTTC').toFixed(2).replace('.', ',')]
    }
  };
};

// ─── Hook largeur fenêtre ──────────────────────────────────────────────────────
const useWindowWidth = () => {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1400
  );
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
};

// ─── EditorHeader ─────────────────────────────────────────────────────────────

const EditorHeader = ({
  invoice, onSave, saving, isSaved,
  showPreview, onTogglePreview, onBack,
  pdfData, companyInfo, isUpdate, onToggleSidebar
}) => (
  <header className="ie-header">
    <div className="ie-header-left">
      {/* Hamburger — visible < 900px */}
      <button className="ie-hamburger" onClick={onToggleSidebar} type="button" aria-label="Menu">
        <FaBars />
      </button>
      <button className="ie-floating-back-button" onClick={onBack}>
        <FaArrowLeft className="button-icon" />
        <span className="button-text">Quitter</span>
      </button>
      <div className="ie-header-title">
        <h1>
          {isUpdate ? 'Modifier' : 'Nouveau'} —
          {invoice?.type === 'avoir' ? ' Avoir' : invoice?.type === 'devis' ? ' Devis' : ' Facture'}
          {isUpdate && <span className="ie-edit-badge"> (Édition)</span>}
        </h1>
        {invoice?.number && <span className="ie-invoice-number">{invoice.number}</span>}
      </div>
    </div>

    <div className="ie-header-actions">
      <button className="ie-floating-show-button" onClick={() => onTogglePreview(!showPreview)}>
        {showPreview
          ? <><FaEyeSlash className="button-icon" /><span className="button-text">Masquer</span></>
          : <><FaEye className="button-icon" /><span className="button-text">Aperçu</span></>
        }
      </button>
      <button
        onClick={onSave}
        disabled={saving || (isSaved && !isUpdate)}
        className="ie-btn-save"
      >
        {saving
          ? <><i className="fas fa-spinner fa-spin"></i><span>{isUpdate ? ' Mise à jour…' : ' Enreg…'}</span></>
          : <><i className="fas fa-save"></i><span>{isUpdate ? ' Modifier' : ' Enregistrer'}</span></>
        }
      </button>
      {isSaved && pdfData && (
        <PDFDownloadLink
          document={
            <InvoicePDF
              data={pdfData}
              ribType={invoice?.ribs || []}
              objet={invoice?.objet || ''}
              showSignature={invoice?.showSignature !== false}
              companyInfo={companyInfo}
            />
          }
          fileName={`${invoice.type}_${invoice.number || 'document'}.pdf`}
          className="ie-btn-download"
        >
          {({ loading, error }) => error
            ? <span>Erreur PDF</span>
            : loading
              ? <span><i className="fas fa-spinner fa-spin"></i><span> Génération…</span></span>
              : <span><i className="fas fa-file-download"></i><span> Télécharger</span></span>
          }
        </PDFDownloadLink>
      )}
    </div>
  </header>
);

// ─── Sidebar hybride ──────────────────────────────────────────────────────────
//
//  windowWidth > 1280  → sidebar complète (230 px, labels + résumé)
//  900 < w ≤ 1280      → sidebar réduite  (64 px, icônes + tooltip)
//  w ≤ 900             → sidebar masquée  (hamburger → overlay)
//
//  BUG FIX : en mode "collapsed" on ne masque PLUS le tiroir Options avancées
//  via CSS ; on le gère entièrement en JS dans le composant.

const HybridSidebar = ({
  activeSection, onSectionChange, invoice,
  showAdvanced, onToggleAdvanced,
  windowWidth, mobileOpen, onCloseMobile
}) => {
  // On calcule les états responsive en JS — plus fiable que media-queries
  // pour les éléments conditionnels.
  const isMobile    = windowWidth <= 900;
  const isCollapsed = windowWidth > 900 && windowWidth <= 1280;
  const isExpanded  = windowWidth > 1280;

  const steps = [
    {
      id:       'type',
      icon:     '📄',
      label:    'Type & infos',
      sublabel: () => {
        const t = invoice?.type;
        const lbl = t === 'avoir' ? 'Avoir' : t === 'devis' ? 'Devis' : 'Facture';
        return invoice?.number ? `${lbl} · ${invoice.number}` : lbl;
      },
      done: !!invoice?.number && !!invoice?.date
    },
    {
      id:       'client',
      icon:     '👤',
      label:    'Client',
      sublabel: () => invoice?.client?.nom || 'Sélectionner',
      done:     !!invoice?.client
    },
    {
      id:       'items',
      icon:     '📦',
      label:    'Articles',
      sublabel: () => {
        const n = invoice?.items?.length || 0;
        return n === 0 ? 'Aucun article' : `${n} ligne${n > 1 ? 's' : ''}`;
      },
      done: (invoice?.items?.length || 0) > 0
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPct    = Math.round((completedCount / steps.length) * 100);
  const totalTTC       = (invoice?.items || []).reduce(
    (s, i) => s + parseFloat((i.montantTTC || '0').toString().replace(',', '.')), 0
  );

  // En mode collapsed, le libellé "Options avancées" n'est pas affiché.
  // Le clic sur l'icône ⚙ doit quand même déclencher onToggleAdvanced.
  // Quand le sous-menu s'ouvre en mode collapsed, on navigue directement
  // vers 'settings' (pas besoin de voir le sous-item).
  const handleAdvancedClick = () => {
    if (isCollapsed) {
      // Collapsed : un clic = aller directement sur settings
      onSectionChange('settings');
      onCloseMobile();
    } else {
      onToggleAdvanced();
    }
  };

  const handleStepClick = (id) => {
    onSectionChange(id);
    onCloseMobile();
  };

  // ── Calcul des classes CSS de la sidebar ──
  const sidebarClass = [
    'ie-hybrid-sidebar',
    isCollapsed ? 'collapsed' : '',
    mobileOpen  ? 'mobile-open' : '',
    isMobile && !mobileOpen ? 'mobile-hidden' : ''
  ].filter(Boolean).join(' ');

  // ── Détermine si on affiche les textes/résumé ──
  const showText    = isExpanded || (isMobile && mobileOpen);
  const showSummary = isExpanded || (isMobile && mobileOpen);

  return (
    <>
      {/* Overlay sombre — mobile uniquement */}
      {mobileOpen && (
        <div className="ie-sidebar-overlay" onClick={onCloseMobile} />
      )}

      <aside className={sidebarClass}>

        {/* Bouton fermeture — mobile overlay uniquement */}
        {mobileOpen && (
          <button className="ie-sidebar-close-mobile" onClick={onCloseMobile} type="button">
            <FaTimes />
            <span>Fermer</span>
          </button>
        )}

        {/* ── Navigation ── */}
        <nav className="ie-sidebar-nav">
          {steps.map(step => {
            const isActive = activeSection === step.id;
            const isDone   = step.done && !isActive;
            return (
              <button
                key={step.id}
                className={`ie-sidebar-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isCollapsed ? 'icon-only' : ''}`}
                onClick={() => handleStepClick(step.id)}
                type="button"
                title={isCollapsed ? step.label : undefined}
              >
                <div className={`ie-sidebar-step-icon ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  {isDone ? '✓' : step.icon}
                </div>
                {showText && (
                  <div className="ie-sidebar-step-text">
                    <span className="ie-sidebar-step-label">{step.label}</span>
                    <span className="ie-sidebar-step-sub">{step.sublabel()}</span>
                  </div>
                )}
                {isActive && !isCollapsed && <div className="ie-sidebar-active-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="ie-sidebar-divider" />

        {/* ── Options avancées ── */}
        {/* En collapsed : juste l'icône ⚙ cliquable avec tooltip natif */}
        {/* En expanded / mobile : le toggle complet avec chevron */}
        <button
          className={`ie-sidebar-advanced-toggle ${showAdvanced && !isCollapsed ? 'open' : ''} ${isCollapsed ? 'icon-only' : ''} ${activeSection === 'settings' ? 'settings-active' : ''}`}
          onClick={handleAdvancedClick}
          type="button"
          title={isCollapsed ? 'Options avancées (RIB, signature)' : undefined}
        >
          <div className={`ie-sidebar-step-icon ${activeSection === 'settings' ? 'active' : ''}`}>⚙</div>
          {showText && (
            <>
              <div className="ie-sidebar-step-text">
                <span className="ie-sidebar-step-label">Options avancées</span>
                <span className="ie-sidebar-step-sub">RIB, signature</span>
              </div>
              <span className="ie-sidebar-chevron">{showAdvanced ? '▲' : '▼'}</span>
            </>
          )}
        </button>

        {/* Sous-item RIB & Signature — affiché seulement si expanded ET showAdvanced */}
        {showAdvanced && !isCollapsed && (
          <button
            className={`ie-sidebar-step settings-sub ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => handleStepClick('settings')}
            type="button"
          >
            <div className={`ie-sidebar-step-icon ${activeSection === 'settings' ? 'active' : ''}`}>🏦</div>
            <div className="ie-sidebar-step-text">
              <span className="ie-sidebar-step-label">RIB & Signature</span>
              <span className="ie-sidebar-step-sub">Paiement, affichage</span>
            </div>
          </button>
        )}

        <div className="ie-sidebar-divider" />

        {/* ── Résumé — visible uniquement quand les textes sont affichés ── */}
        {showSummary && (
          <div className="ie-sidebar-summary">
            <div className="ie-sidebar-summary-row">
              <span>Client</span>
              <strong className={invoice?.client ? 'ok' : 'missing'}>
                {invoice?.client?.nom
                  ? (invoice.client.nom.length > 13
                      ? invoice.client.nom.substring(0, 13) + '…'
                      : invoice.client.nom)
                  : '—'
                }
              </strong>
            </div>
            <div className="ie-sidebar-summary-row">
              <span>Articles</span>
              <strong>{invoice?.items?.length || 0} ligne{(invoice?.items?.length || 0) !== 1 ? 's' : ''}</strong>
            </div>
            <div className="ie-sidebar-summary-row total">
              <span>TTC</span>
              <strong>{formatCurrency(totalTTC.toString())} FCFA</strong>
            </div>
            <div className="ie-sidebar-progress-bar">
              <div className="ie-sidebar-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="ie-sidebar-progress-label">{completedCount} / {steps.length} sections complètes</p>
          </div>
        )}
      </aside>
    </>
  );
};

// ─── Aperçu PDF — panneau latéral OU modal selon la taille ────────────────────

const PreviewPanel = ({ invoice, companyInfo, selectedRibs, asModal, onClose }) => {
  const empty = !invoice?.client;

  const content = (
    <div className={asModal ? 'ie-preview-modal-inner' : 'ie-preview-panel-inner'}>
      {asModal && (
        <div className="ie-preview-modal-header">
          <span className="ie-preview-badge">
            {invoice?.type === 'avoir' ? 'AVOIR' : invoice?.type === 'devis' ? 'DEVIS' : 'FACTURE'}
          </span>
          <button className="ie-preview-modal-close" onClick={onClose} type="button">
            <FaTimes />
          </button>
        </div>
      )}

      {!asModal && (
        <div className="ie-preview-header">
          <h3>Aperçu</h3>
          <span className="ie-preview-badge">
            {invoice?.type === 'avoir' ? 'AVOIR' : invoice?.type === 'devis' ? 'DEVIS' : 'FACTURE'}
          </span>
        </div>
      )}

      {empty ? (
        <div className="ie-preview-placeholder">
          <i className="fas fa-file-invoice"></i>
          <h3>Aperçu</h3>
          <p>Ajoutez un client pour voir l'aperçu</p>
        </div>
      ) : (
        <DynamicPDFViewer
          width="100%"
          height={asModal ? '75vh' : '800px'}
          style={{ marginTop: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}
        >
          <InvoicePDF
            data={transformToLegacyFormat(invoice)}
            ribType={selectedRibs}
            objet={invoice.objet || ''}
            showSignature={invoice.showSignature !== false}
            companyInfo={companyInfo}
          />
        </DynamicPDFViewer>
      )}
    </div>
  );

  if (asModal) {
    return (
      <>
        <div className="ie-preview-overlay" onClick={onClose} />
        <div className="ie-preview-modal">{content}</div>
      </>
    );
  }

  return <aside className="ie-preview-panel">{content}</aside>;
};

// ─── Section Type & Infos (fusionnée) ────────────────────────────────────────

const TypeAndDetailsSection = ({ data, setData, errors, generateInvoiceNumber, currentUser }) => {
  const types = [
    { value: 'facture', label: 'Facture', icon: '📄', desc: 'Document de facturation standard' },
    { value: 'devis',   label: 'Devis',   icon: '📝', desc: 'Proposition commerciale' },
    { value: 'avoir',   label: 'Avoir',   icon: '🔄', desc: 'Note de crédit' }
  ];

  const canEditNumber = () => ['supadmin', 'superadmin'].includes(currentUser?.role);
  const canEditDates  = () => ['admin', 'supadmin', 'superadmin'].includes(currentUser?.role);

  const handleTypeChange = async (val) => {
    try {
      const n = await generateInvoiceNumber(new Date(data.facture.Date[0]), val);
      setData({ ...data, facture: { ...data.facture, Type: [val], Numéro: [n] } });
    } catch {
      setData({ ...data, facture: { ...data.facture, Type: [val] } });
    }
  };

  const handleDateChange = async (e) => {
    if (!canEditDates()) { alert("Permission refusée"); return; }
    const d = e.target.value;
    try {
      const n = await generateInvoiceNumber(new Date(d), data.facture.Type[0]);
      setData({ ...data, facture: { ...data.facture, Date: [d], Numéro: [n] } });
    } catch {
      setData({ ...data, facture: { ...data.facture, Date: [d] } });
    }
  };

  return (
    <div className="ie-section">
      {/* Bloc 1 — Type */}
      <div className="ie-section-block">
        <div className="ie-section-block-header">
          <span className="ie-section-block-num">1</span>
          <div>
            <h2>Type de document</h2>
            <p>Choisissez la nature du document à créer</p>
          </div>
        </div>
        <div className="ie-type-selector">
          {types.map(t => {
            const isActive = data.facture.Type?.[0] === t.value;
            return (
              <button
                key={t.value}
                type="button"
                className={`ie-type-option ${isActive ? 'active' : ''}`}
                onClick={() => handleTypeChange(t.value)}
              >
                <span className="ie-type-icon">{t.icon}</span>
                <span className="ie-type-label">{t.label}</span>
                <span className="ie-type-desc">{t.desc}</span>
                {isActive && <span className="ie-type-check">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="ie-section-divider" />

      {/* Bloc 2 — Numéro & dates */}
      <div className="ie-section-block">
        <div className="ie-section-block-header">
          <span className="ie-section-block-num">2</span>
          <div>
            <h2>Numéro & dates</h2>
            <p>Référence et période de validité</p>
          </div>
        </div>
        <div className="ie-details-grid">
          <div className="ie-form-group">
            <label>
              Numéro *
              {!canEditNumber() && <span className="ie-lock-badge"><i className="fas fa-lock"></i> Auto</span>}
            </label>
            <input
              type="text"
              value={data.facture.Numéro?.[0] || ''}
              onChange={e => setData({ ...data, facture: { ...data.facture, Numéro: [e.target.value] } })}
              className={`ie-input ${errors?.number ? 'error' : ''} ${!canEditNumber() ? 'disabled' : ''}`}
              placeholder="FACT-2024-001"
              disabled={!canEditNumber()}
              readOnly={!canEditNumber()}
            />
            {errors?.number && <span className="ie-field-error">{errors.number}</span>}
          </div>
          <div />
          <div className="ie-form-group">
            <label>
              Date d'émission *
              {!canEditDates() && <span className="ie-lock-badge"><i className="fas fa-lock"></i></span>}
            </label>
            <input
              type="date"
              value={data.facture.Date?.[0] || ''}
              onChange={handleDateChange}
              className={`ie-input ${!canEditDates() ? 'disabled' : ''}`}
              disabled={!canEditDates()}
              readOnly={!canEditDates()}
            />
            {!canEditDates() && <p className="ie-field-hint">Contactez un administrateur</p>}
          </div>
          <div className="ie-form-group">
            <label>
              Date d'échéance
              {!canEditDates() && <span className="ie-lock-badge"><i className="fas fa-lock"></i></span>}
            </label>
            <input
              type="date"
              value={data.facture.DateEcheance?.[0] || ''}
              onChange={e => {
                if (!canEditDates()) { alert("Permission refusée"); return; }
                setData({ ...data, facture: { ...data.facture, DateEcheance: [e.target.value] } });
              }}
              className={`ie-input ${!canEditDates() ? 'disabled' : ''}`}
              disabled={!canEditDates()}
              readOnly={!canEditDates()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section Client ───────────────────────────────────────────────────────────

const ClientSection = ({ clients = [], selectedClient, onClientChange, error }) => {
  const [search, setSearch] = useState('');
  const filtered = clients.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.adresse?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ie-section">
      <div className="ie-section-block">
        <div className="ie-section-block-header">
          <span className="ie-section-block-num">👤</span>
          <div><h2>Client</h2><p>Sélectionnez le destinataire du document</p></div>
        </div>

        {selectedClient && (
          <div className="ie-selected-client">
            <div className="ie-selected-client-avatar">
              {(selectedClient.nom?.charAt(0) || 'C').toUpperCase()}
            </div>
            <div className="ie-selected-client-details">
              <h4>{selectedClient.nom}</h4>
              <p>{selectedClient.email || 'Email non renseigné'}</p>
              <p>{[selectedClient.adresse, selectedClient.ville].filter(Boolean).join(', ') || '—'}</p>
            </div>
            <button onClick={() => onClientChange(null)} className="ie-btn-clear-client" type="button">
              <i className="fas fa-times"></i> Changer
            </button>
          </div>
        )}

        {!selectedClient && (
          <>
            <div className="ie-client-search">
              <div className="ie-search-input-wrapper">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Rechercher par nom, email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ie-search-input"
                />
                {search && (
                  <button className="ie-search-clear" onClick={() => setSearch('')} type="button">✕</button>
                )}
              </div>
            </div>
            {error && <div className="ie-error-message"><i className="fas fa-exclamation-triangle"></i> {error}</div>}
            <div className="ie-clients-grid">
              {filtered.map(c => (
                <div key={c.id} className="ie-client-card" onClick={() => onClientChange(c)}>
                  <div className="ie-client-avatar">{(c.nom?.charAt(0) || 'C').toUpperCase()}</div>
                  <div className="ie-client-info">
                    <h4>{c.nom || 'Client sans nom'}</h4>
                    <p className="ie-client-email"><i className="fas fa-envelope"></i> {c.email || '—'}</p>
                    <p className="ie-client-address">
                      <i className="fas fa-map-marker-alt"></i>
                      {c.adresse || '—'}{c.ville ? `, ${c.ville}` : ''}
                    </p>
                  </div>
                  <div className="ie-client-check"><i className="fas fa-check"></i></div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="ie-empty-state">
                <i className="fas fa-users"></i>
                <h3>Aucun client trouvé</h3>
                <p>{search ? `Aucun résultat pour "${search}"` : "Créez d'abord un client"}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Section Articles ─────────────────────────────────────────────────────────

const ItemsSection = ({ data, setData, error, objet, setObjet }) => {
  const [editingIndex, setEditingIndex]     = useState(null);
  const [cur, setCur]                       = useState({ description: '', quantity: 1, unitPrice: '', taxRate: '0' });
  const [dupModal, setDupModal]             = useState({ show: false, index: null, count: 1 });
  const editFormRef = useRef(null);

  const calcItem = (item) => {
    const qty  = parseFloat(item.quantity) || 1;
    const pu   = parseFloat(item.unitPrice.toString().replace(',', '.')) || 0;
    const ht   = qty * pu;
    const rate = parseFloat(item.taxRate === 'custom' ? item.customTaxRate || 0 : item.taxRate);
    const tva  = ht * (rate / 100);
    return {
      montantHT:  ht.toFixed(2).replace('.', ','),
      montantTVA: tva.toFixed(2).replace('.', ','),
      montantTTC: (ht + tva).toFixed(2).replace('.', ',')
    };
  };

  const KEY = {
    Designation: 'description', Quantite: 'quantity', 'Prix Unitaire': 'unitPrice',
    TVA: 'taxRate', 'Montant HT': 'montantHT', 'Montant TVA': 'montantTVA', 'Prix Total': 'montantTTC'
  };

  const addOrUpdate = () => {
    if (!cur.description || !cur.unitPrice) return;
    const t  = calcItem(cur);
    const ni = {
      ...cur,
      quantity:  parseFloat(cur.quantity) || 1,
      unitPrice: parseFloat(cur.unitPrice.toString().replace(',', '.')) || 0,
      taxRate:   cur.taxRate === 'custom' ? parseFloat(cur.customTaxRate || 0) : parseFloat(cur.taxRate),
      ...t
    };
    const items = { ...data.items };
    if (editingIndex !== null) {
      Object.keys(items).forEach(k => { if (Array.isArray(items[k])) { const v = ni[KEY[k]]; items[k][editingIndex] = v !== undefined ? v.toString() : ''; } });
      setEditingIndex(null);
    } else {
      Object.keys(items).forEach(k => { if (Array.isArray(items[k])) { const v = ni[KEY[k]]; items[k].push(v !== undefined ? v.toString() : ''); } });
    }
    setData({ ...data, items });
    setCur({ description: '', quantity: 1, unitPrice: '', taxRate: '0', customTaxRate: '' });
  };

  const removeItem = (i) => {
    const items = { ...data.items };
    Object.keys(items).forEach(k => { if (Array.isArray(items[k])) items[k] = items[k].filter((_, j) => j !== i); });
    setData({ ...data, items });
  };

  const editItem = (i) => {
    setCur({ description: data.items.Designation?.[i]||'', quantity: data.items.Quantite?.[i]||'1', unitPrice: data.items["Prix Unitaire"]?.[i]||'', taxRate: data.items.TVA?.[i]?.replace('%','')||'0' });
    setEditingIndex(i);
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const moveItem = (from, to) => {
    const n = data.items.Designation?.length || 0;
    if (to < 0 || to >= n) return;
    const items = { ...data.items };
    Object.keys(items).forEach(k => { if (Array.isArray(items[k])) { const a = [...items[k]]; [a[from], a[to]] = [a[to], a[from]]; items[k] = a; } });
    setData({ ...data, items });
  };

  const confirmDup = () => {
    if (dupModal.index === null) return;
    const items = { ...data.items };
    for (let i = 0; i < dupModal.count; i++) {
      Object.keys(items).forEach(k => { if (Array.isArray(items[k]) && items[k][dupModal.index] !== undefined) items[k].push(items[k][dupModal.index]); });
    }
    setData({ ...data, items });
    setDupModal({ show: false, index: null, count: 1 });
  };

  const sums = () => {
    const des = data.items.Designation || [];
    return {
      ht:  des.reduce((s,_,i) => s + parseFloat((data.items["Montant HT"]?.[i]||'0').toString().replace(',','.')), 0),
      tva: des.reduce((s,_,i) => s + parseFloat((data.items["Montant TVA"]?.[i]||'0').toString().replace(',','.')), 0),
      ttc: des.reduce((s,_,i) => s + parseFloat((data.items["Prix Total"]?.[i]||'0').toString().replace(',','.')), 0)
    };
  };

  const totals   = sums();
  const liveTot  = calcItem(cur);
  const n        = data.items.Designation?.length || 0;

  return (
    <div className="ie-section">
      <div className="ie-section-block">
        <div className="ie-section-block-header">
          <span className="ie-section-block-num">📦</span>
          <div><h2>Articles et services</h2><p>Lignes de votre document</p></div>
        </div>

        {/* Objet */}
        <div className="ie-form-group" style={{ marginBottom: '1.25rem' }}>
          <label>Objet du document</label>
          <input type="text" value={objet} onChange={e => setObjet(e.target.value)}
            placeholder="Objet de la facture…" className="ie-input" />
        </div>

        {error && <div className="ie-error-message"><i className="fas fa-exclamation-triangle"></i> {error}</div>}

        {/* Calcul temps réel */}
        {cur.quantity && cur.unitPrice && (
          <div className="ie-realtime-preview">
            <div className="ie-preview-card">
              <span className="ie-preview-pill">HT : <strong>{formatNumberWithSpaces(liveTot.montantHT)} FCFA</strong></span>
              <span className="ie-preview-sep">·</span>
              <span className="ie-preview-pill">TVA : <strong>{formatNumberWithSpaces(liveTot.montantTVA)} FCFA</strong></span>
              <span className="ie-preview-sep">·</span>
              <span className="ie-preview-pill ie-preview-total">TTC : <strong>{formatNumberWithSpaces(liveTot.montantTTC)} FCFA</strong></span>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div ref={editFormRef} className={`ie-item-form ${editingIndex !== null ? 'editing' : ''}`}>
          {editingIndex !== null && (
            <div className="ie-editing-banner"><i className="fas fa-pen"></i> Modification — ligne {editingIndex + 1}</div>
          )}
          <div className="ie-form-row">
            <div className="ie-form-group">
              <label>Description *</label>
              <input type="text" value={cur.description}
                onChange={e => setCur({...cur, description: e.target.value})}
                placeholder="Nom de l'article ou service" />
            </div>
            <div className="ie-form-row-child">
              <div className="ie-form-group">
                <label>Quantité</label>
                <input type="number" min="1" value={cur.quantity}
                  onChange={e => setCur({...cur, quantity: e.target.value})} />
              </div>
              <div className="ie-form-group">
                <label>Prix unitaire HT *</label>
                <input type="text" value={cur.unitPrice}
                  onChange={e => setCur({...cur, unitPrice: e.target.value})} placeholder="0,00" />
              </div>
              <div className="ie-form-group">
                <label>TVA (%)</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={cur.taxRate === 'custom' ? 'custom' : cur.taxRate}
                    onChange={e => {
                      if (e.target.value === 'custom') setCur({...cur, taxRate:'custom', customTaxRate:''});
                      else setCur({...cur, taxRate:e.target.value, customTaxRate:''});
                    }}
                    style={{ appearance:'none', paddingRight:'28px' }}
                  >
                    <option value="0">0%</option>
                    <option value="18">18%</option>
                    <option value="20">20%</option>
                    <option value="custom">Personnalisé…</option>
                  </select>
                  <i className="fas fa-chevron-down" style={{ position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#94a3b8' }}></i>
                </div>
                {cur.taxRate === 'custom' && (
                  <input type="number" value={cur.customTaxRate}
                    onChange={e => setCur({...cur, customTaxRate:e.target.value})}
                    placeholder="Taux" step="0.1" min="0" max="100" style={{ marginTop:'0.5rem' }} />
                )}
              </div>
            </div>
          </div>
          <div className="ie-form-actions">
            <button onClick={addOrUpdate} className="ie-btn-add-item"
              disabled={!cur.description || !cur.unitPrice} type="button">
              <i className={`fas fa-${editingIndex !== null ? 'check' : 'plus'}`}></i>
              <span>{editingIndex !== null ? ' Mettre à jour' : " Ajouter"}</span>
            </button>
            {editingIndex !== null && (
              <button onClick={() => { setEditingIndex(null); setCur({description:'',quantity:1,unitPrice:'',taxRate:'0',customTaxRate:''}); }}
                className="ie-btn-cancel" type="button">
                <i className="fas fa-times"></i> Annuler
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        {n > 0 ? (
          <>
            <div className="ie-items-table-wrapper">
              <div className="ie-items-table">
                <div className="ie-table-header">
                  <div>Description</div><div>Qté</div><div>P.U</div><div>TVA</div>
                  <div>HT</div><div>TVA</div><div>TTC</div><div>Actions</div>
                </div>
                {data.items.Designation.map((_, i) => (
                  <div key={i} className="ie-table-row">
                    <div className="ie-item-desc">{data.items.Designation[i]}</div>
                    <div>{formatNumberWithSpaces(data.items.Quantite[i])}</div>
                    <div>{formatNumberWithSpaces(data.items["Prix Unitaire"][i])}</div>
                    <div>{data.items.TVA[i]}</div>
                    <div>{formatNumberWithSpaces(data.items["Montant HT"][i])}</div>
                    <div>{formatNumberWithSpaces(data.items["Montant TVA"][i])}</div>
                    <div className="ie-ttc-cell">{formatNumberWithSpaces(data.items["Prix Total"][i])}</div>
                    <div className="ie-item-actions">
                      <button onClick={() => editItem(i)}                          className="ie-btn-edit"  type="button"><FaEdit /></button>
                      <button onClick={() => setDupModal({show:true,index:i,count:1})} className="ie-btn-dup"   type="button"><FaCopy /></button>
                      <button onClick={() => removeItem(i)}                        className="ie-btn-del"   type="button"><FaTrash /></button>
                      <button onClick={() => moveItem(i,i-1)} disabled={i===0}    className="ie-btn-move"  type="button"><FaArrowUp /></button>
                      <button onClick={() => moveItem(i,i+1)} disabled={i===n-1}  className="ie-btn-move"  type="button"><FaArrowDown /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ie-items-summary">
              <div className="ie-summary-row"><span>Total HT :</span><span>{formatCurrency(totals.ht)}</span></div>
              <div className="ie-summary-row"><span>Total TVA :</span><span>{formatCurrency(totals.tva)}</span></div>
              <div className="ie-summary-row ie-total"><span>Total TTC :</span><span>{formatCurrency(totals.ttc)} FCFA</span></div>
            </div>
          </>
        ) : (
          <div className="ie-empty-state">
            <i className="fas fa-receipt"></i>
            <h3>Aucun article ajouté</h3>
            <p>Remplissez le formulaire ci-dessus pour commencer</p>
          </div>
        )}
      </div>

      {/* Modal duplication */}
      {dupModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Dupliquer l'article</h3>
            <p>Combien de copies souhaitez-vous créer ?</p>
            <div className="ie-form-group">
              <label>Nombre de copies :</label>
              <input type="number" min="1" max="20" value={dupModal.count}
                onChange={e => setDupModal(p => ({...p, count: Math.max(1, Math.min(20, parseInt(e.target.value)||1))}))}
                className="ie-input" style={{maxWidth:'120px'}} />
            </div>
            <div className="modal-actions">
              <button onClick={() => setDupModal({show:false,index:null,count:1})} className="button danger-button">Annuler</button>
              <button onClick={confirmDup} className="button success-button">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Section Options avancées ─────────────────────────────────────────────────

const SettingsSection = ({ selectedRibs, setSelectedRibs, showSignature, setShowSignature }) => (
  <div className="ie-section">
    <div className="ie-section-block">
      <div className="ie-section-block-header">
        <span className="ie-section-block-num">⚙</span>
        <div><h2>Options avancées</h2><p>Coordonnées bancaires et options d'affichage</p></div>
      </div>
      <div className="ie-settings-grid">
        <div className="ie-setting-group">
          <h3>Coordonnées bancaires</h3>
          <div className="ie-rib-selector">
            {['CBAO', 'BIS'].map(rib => (
              <label key={rib} className="ie-rib-option">
                <input type="checkbox" checked={selectedRibs.includes(rib)}
                  onChange={e => setSelectedRibs(e.target.checked ? [...selectedRibs, rib] : selectedRibs.filter(r => r !== rib))} />
                <span className="ie-rib-checkmark"></span>
                <span className="ie-rib-label">{rib}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="ie-setting-group">
          <h3>Affichage</h3>
          <label className="ie-checkbox-option">
            <input type="checkbox" checked={showSignature} onChange={e => setShowSignature(e.target.checked)} />
            <span className="ie-checkmark"></span>
            Inclure la signature
          </label>
        </div>
      </div>
    </div>
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────

const InvoiceEditor = () => {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { currentUser } = useAuth();
  const location        = useLocation();
  const windowWidth     = useWindowWidth();

  // Breakpoints en JS (cohérent avec le CSS)
  const isMobile    = windowWidth <= 900;
  const isCollapsed = windowWidth > 900 && windowWidth <= 1280;
  // L'aperçu latéral n'est visible qu'au-delà de 1100 px
  const previewCanBeSide = windowWidth > 1100;

  const [data, setData] = useState({
    facture: {
      Numéro:       [""],
      Date:         [new Date().toISOString().split('T')[0]],
      DateEcheance: [new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]],
      Type:         ["facture"]
    },
    client: { Nom:[], Adresse:[], Ville:[], Email:[] },
    items:  { Designation:[], Quantite:[], "Prix Unitaire":[], TVA:[], "Montant HT":[], "Montant TVA":[], "Prix Total":[] },
    totals: { "Total HT":["0,00"], "Total TVA":["0,00"], "Total TTC":["0,00"] }
  });

  const [clients,           setClients]           = useState([]);
  const [companyInfo,       setCompanyInfo]       = useState({ name:'', logo:'' });
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [isSaved,           setIsSaved]           = useState(false);
  const [errors,            setErrors]            = useState({});
  const [activeSection,     setActiveSection]     = useState('type');
  const [showPreview,       setShowPreview]       = useState(false);
  const [showAdvanced,      setShowAdvanced]      = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedClientId,  setSelectedClientId]  = useState("");
  const [selectedRibs,      setSelectedRibs]      = useState([]);
  const [objet,             setObjet]             = useState("");
  const [showSignature,     setShowSignature]     = useState(true);
  const [isUpdate,          setIsUpdate]          = useState(false);

  // Ferme l'aperçu en side quand la fenêtre rétrécit
  useEffect(() => {
    if (!previewCanBeSide && showPreview) {
      // garde showPreview=true → passera en modal
    }
  }, [previewCanBeSide]);

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadClients = async () => {
      try {
        if (!currentUser?.companyId) return [];
        const { collection, query, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../firebase');
        const snap = await getDocs(query(collection(db, `companies/${currentUser.companyId}/clients`)));
        return snap.docs.map(d => ({ id:d.id, ...d.data(), createdAt:d.data().createdAt?.toDate?.()||null }));
      } catch { return []; }
    };

    const loadCompanyInfo = async () => {
      try {
        if (!currentUser?.companyId) return;
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase');
        const snap = await getDoc(doc(db, 'companies', currentUser.companyId));
        if (snap.exists()) {
          const d = snap.data();
          setCompanyInfo({ name:d.name||"Ma société", logo:d.logo||'', logoFileName:d.logoFileName||'', signatureFileName:d.signatureFileName||'', rcNumber:d.rcNumber||'', ninea:d.ninea||'', address:d.address||'', region:d.region||'', country:d.country||'', phone:d.phone||'', email:d.email||'', website:d.website||'', ribCBAO:d.ribCBAO||'', ribBIS:d.ribBIS||'', ribOther1:d.ribOther1||'', ribOther1Label:d.ribOther1Label||'', ribOther2:d.ribOther2||'', ribOther2Label:d.ribOther2Label||'', invoiceColor:d.invoiceColor||'#218838', invoiceFont:d.invoiceFont||'Helvetica', invoiceTemplate:d.invoiceTemplate||'classic', pdfQuality:d.pdfQuality||'high' });
        }
      } catch(e) { console.error('companyInfo:', e); }
    };

    const init = async () => {
      try {
        setLoading(true);
        const [clientsData] = await Promise.all([loadClients()]);
        setClients(clientsData);
        await loadCompanyInfo();

        let invoiceData;
        let isUpdateMode = false;
        const docType = location.state?.type || 'facture';

        if (location.state?.facture) {
          invoiceData = invoiceService.transformFactureData(location.state.facture);
          setIsSaved(!!location.state.facture.id);
          if (location.state.facture.clientId) {
            const c = clientsData.find(x => x.id === location.state.facture.clientId);
            if (c) { invoiceData.client = { Nom:[c.nom], Adresse:[c.adresse||''], Ville:[c.ville||''], Email:[c.email||''] }; setSelectedClientId(c.id); }
            else { invoiceData.client = invoiceData.client || { Nom:[location.state.facture.client?.nom||''], Adresse:[location.state.facture.client?.adresse||''], Ville:[location.state.facture.client?.ville||''], Email:[location.state.facture.client?.email||''] }; setSelectedClientId(location.state.facture.clientId); }
          }
          isUpdateMode = !!location.state.facture.id && !location.state.isDuplicate;
          if (location.state.isDuplicate) { const n = await invoiceService.generateInvoiceNumber(currentUser.companyId, new Date(invoiceData.facture.Date[0]||new Date()), docType); invoiceData.facture.Numéro=[n]; isUpdateMode=false; }
          setSelectedRibs(location.state.facture.ribs||[]); setObjet(location.state.facture.objet||''); setShowSignature(location.state.facture.showSignature!==false);
        } else if (id) {
          const result = await invoiceService.getInvoiceById(currentUser.companyId, id);
          if (result.success) {
            invoiceData = invoiceService.transformFactureData(result.data); setIsSaved(true); isUpdateMode=true;
            if (result.data.clientId) { const c = clientsData.find(x=>x.id===result.data.clientId); if(c) invoiceData.client={ Nom:[c.nom], Adresse:[c.adresse||''], Ville:[c.ville||''], Email:[c.email||''] }; }
            setSelectedClientId(result.data.clientId||''); setSelectedRibs(result.data.ribs||[]); setObjet(result.data.objet||''); setShowSignature(result.data.showSignature!==false);
          } else throw new Error('Facture introuvable');
        } else {
          const n = await invoiceService.generateInvoiceNumber(currentUser.companyId, new Date(), docType);
          invoiceData = { facture:{ Numéro:[n], Date:[new Date().toISOString().split('T')[0]], DateEcheance:[new Date(Date.now()+7*24*60*60*1000).toISOString().split('T')[0]], Type:[docType] }, client:{Nom:[],Adresse:[],Ville:[],Email:[]}, items:{Designation:[],Quantite:[],"Prix Unitaire":[],TVA:[],"Montant HT":[],"Montant TVA":[],"Prix Total":[]}, totals:{"Total HT":["0,00"],"Total TVA":["0,00"],"Total TTC":["0,00"]} };
          if (location.state?.client) { const c=location.state.client; invoiceData.client={Nom:[c.nom],Adresse:[c.adresse],Ville:[c.ville||''],Email:[c.email||'']}; setSelectedClientId(c.id); }
        }
        setData(invoiceData); setIsUpdate(isUpdateMode);
      } catch(err) {
        console.error('Init error:', err);
        const dt=location.state?.type||'facture'; const now=new Date(); const pfx=dt==='devis'?'DEV':dt==='avoir'?'AV':'F';
        setData({ facture:{Numéro:[`${pfx}-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-TEMP`],Date:[now.toISOString().split('T')[0]],DateEcheance:[new Date(Date.now()+7*24*60*60*1000).toISOString().split('T')[0]],Type:[dt]}, client:{Nom:[],Adresse:[],Ville:[],Email:[]}, items:{Designation:[],Quantite:[],"Prix Unitaire":[],TVA:[],"Montant HT":[],"Montant TVA":[],"Prix Total":[]}, totals:{"Total HT":["0,00"],"Total TVA":["0,00"],"Total TTC":["0,00"]} });
      } finally { setLoading(false); }
    };

    if (currentUser?.companyId) init(); else setLoading(false);
  }, [id, currentUser?.companyId, location.state]);

  // ── Recalcul totaux ──────────────────────────────────────────────────────────
  const recalcTotals = useCallback(() => {
    let ht=0,tva=0,ttc=0;
    if (data.items.Designation?.length>0) {
      data.items.Designation.forEach((_,i) => {
        ht  += parseFloat(data.items["Montant HT"]?.[i]?.replace(',','.')||0);
        tva += parseFloat(data.items["Montant TVA"]?.[i]?.replace(',','.')||0);
        ttc += parseFloat(data.items["Prix Total"]?.[i]?.replace(',','.')||0);
      });
    }
    setData(p=>({...p, totals:{ "Total HT":[ht.toFixed(2).replace('.',',')], "Total TVA":[tva.toFixed(2).replace('.',',')], "Total TTC":[ttc.toFixed(2).replace('.',',')] }}));
  }, [data.items]);
  useEffect(() => { recalcTotals(); }, [data.items, recalcTotals]);

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e={};
    if (!data.client?.Nom?.[0])                                       e.client='Client requis';
    if (!data.items.Designation||data.items.Designation.length===0)   e.items='Au moins un article requis';
    if (!data.facture.Numéro?.[0])                                    e.number='Numéro requis';
    setErrors(e); return Object.keys(e).length===0;
  };

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const saveInvoice = async () => {
    if (isSaved&&!isUpdate){ alert("Facture déjà enregistrée."); return; }
    if (!validate()) return;
    setSaving(true);
    try {
      let ht=0,tva=0,ttc=0;
      data.items.Designation?.forEach((_,i) => {
        ht  += parseFloat(data.items["Montant HT"]?.[i]?.replace(',','.')||0);
        tva += parseFloat(data.items["Montant TVA"]?.[i]?.replace(',','.')||0);
        ttc += parseFloat(data.items["Prix Total"]?.[i]?.replace(',','.')||0);
      });
      const finalTotals={"Total HT":[ht.toFixed(2).replace('.',',')],"Total TVA":[tva.toFixed(2).replace('.',',')],"Total TTC":[ttc.toFixed(2).replace('.',',')]};
      const updatedData={...data,totals:finalTotals};
      const completeData={...updatedData,clientId:selectedClientId,ribs:selectedRibs,objet,showSignature};
      const invoiceData=invoiceService.prepareInvoiceData(completeData);
      if(id||location.state?.facture?.id) await invoiceService.updateInvoice(currentUser.companyId,id||location.state.facture.id,invoiceData);
      else await invoiceService.addInvoice(currentUser.companyId,currentUser.uid,invoiceData);
      setData(updatedData); setIsSaved(true);
      const lbl=data.facture.Type[0]==='avoir'?'Avoir':data.facture.Type[0]==='devis'?'Devis':'Facture';
      alert(`${lbl} ${isUpdate?'modifiée':'enregistrée'} avec succès !`);
    } catch(err){ console.error(err); alert(`Erreur lors de la ${isUpdate?'modification':'création'}`); }
    finally { setSaving(false); }
  };

  // ── getPdfData ───────────────────────────────────────────────────────────────
  const getPdfData = () => {
    if(!data||!Object.keys(data).length) return { facture:{Numéro:["TEMP"],Date:[new Date().toISOString().split('T')[0]],DateEcheance:[""],Type:["facture"]}, client:{Nom:["Client"],Adresse:[""],Ville:[""],Email:[""]}, items:{Designation:[],Quantite:[],"Prix Unitaire":[],TVA:[],"Montant HT":[],"Montant TVA":[],"Prix Total":[]}, totals:{"Total HT":["0,00"],"Total TVA":["0,00"],"Total TTC":["0,00"]} };
    const t=transformToLegacyFormat(data);
    return { facture:{Numéro:t.facture.Numéro||[""],Date:t.facture.Date||[new Date().toISOString().split('T')[0]],DateEcheance:t.facture.DateEcheance||[""],Type:t.facture.Type||["facture"]}, client:{Nom:t.client?.Nom||[""],Adresse:t.client?.Adresse||[""],Ville:t.client?.Ville||[""],Email:t.client?.Email||[""]}, items:t.items||{Designation:[],Quantite:[],"Prix Unitaire":[],TVA:[],"Montant HT":[],"Montant TVA":[],"Prix Total":[]}, totals:t.totals||{"Total HT":["0,00"],"Total TVA":["0,00"],"Total TTC":["0,00"]} };
  };

  // ── invoiceCompatible ────────────────────────────────────────────────────────
  const inv = {
    id:id||location.state?.facture?.id, type:data.facture.Type?.[0]||'facture',
    number:data.facture.Numéro?.[0]||'', date:data.facture.Date?.[0]||'', dueDate:data.facture.DateEcheance?.[0]||'',
    objet, ribs:selectedRibs, showSignature,
    client:data.client?.Nom?.[0]?{id:selectedClientId,nom:data.client.Nom[0],email:data.client.Email[0],adresse:data.client.Adresse[0],ville:data.client.Ville[0]}:null,
    items:data.items.Designation?.map((_,i)=>({ description:data.items.Designation[i], quantity:data.items.Quantite[i], unitPrice:data.items["Prix Unitaire"][i], taxRate:data.items.TVA[i], montantHT:data.items["Montant HT"][i], montantTVA:data.items["Montant TVA"][i], montantTTC:data.items["Prix Total"][i] }))||[]
  };

  if (loading) return <LoadingState message="Chargement de l'éditeur…" />;

  // L'aperçu est en modal si la fenêtre est trop petite pour le side panel
  const previewAsModal = showPreview && !previewCanBeSide;
  const previewAsSide  = showPreview && previewCanBeSide;

  return (
    <div className="ie-invoice-editor">
      <EditorHeader
        invoice={inv} onSave={saveInvoice} saving={saving} isSaved={isSaved}
        showPreview={showPreview} onTogglePreview={setShowPreview}
        onBack={() => navigate('/')} pdfData={getPdfData()}
        companyInfo={companyInfo} isUpdate={isUpdate}
        onToggleSidebar={() => setMobileSidebarOpen(p => !p)}
      />

      <div className="ie-hybrid-layout">
        <HybridSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          invoice={inv}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(p => !p)}
          windowWidth={windowWidth}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="ie-hybrid-content">
          {activeSection === 'type' && (
            <TypeAndDetailsSection data={data} setData={setData} errors={errors}
              generateInvoiceNumber={(d,t) => invoiceService.generateInvoiceNumber(currentUser.companyId,d,t)}
              currentUser={currentUser} />
          )}
          {activeSection === 'client' && (
            <ClientSection clients={clients}
              selectedClient={data.client?.Nom?.[0]?{id:selectedClientId,nom:data.client.Nom[0],email:data.client.Email[0],adresse:data.client.Adresse[0],ville:data.client.Ville[0]}:null}
              onClientChange={c => {
                if(c){ setData({...data,client:{Nom:[c.nom],Adresse:[c.adresse],Ville:[c.ville||''],Email:[c.email||'']}}); setSelectedClientId(c.id); setActiveSection('items'); }
                else { setData({...data,client:{Nom:[],Adresse:[],Ville:[],Email:[]}}); setSelectedClientId(''); }
              }}
              error={errors.client} />
          )}
          {activeSection === 'items' && (
            <ItemsSection data={data} setData={setData} error={errors.items} objet={objet} setObjet={setObjet} />
          )}
          {activeSection === 'settings' && (
            <SettingsSection selectedRibs={selectedRibs} setSelectedRibs={setSelectedRibs}
              showSignature={showSignature} setShowSignature={setShowSignature} />
          )}
        </div>

        {/* Aperçu latéral (grand écran) */}
        {previewAsSide && (
          <PreviewPanel invoice={inv} companyInfo={companyInfo} selectedRibs={selectedRibs}
            asModal={false} onClose={() => setShowPreview(false)} />
        )}
      </div>

      {/* Aperçu en modal (petit / moyen écran) */}
      {previewAsModal && (
        <PreviewPanel invoice={inv} companyInfo={companyInfo} selectedRibs={selectedRibs}
          asModal={true} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
};

export default InvoiceEditor;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // AJOUT: useLocation
import { useAuth } from '../../auth/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import { FaArrowDown, FaArrowLeft, FaArrowUp, FaCopy, FaEdit, FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";
import InvoicePDF from './InvoicePDF';
import DynamicPDFViewer from '../../components/views/DynamicPDFViewer';
import './styles/Fact.css';
import { PDFDownloadLink } from '@react-pdf/renderer';
import LoadingState from '../../components/common/LoadingState';

// Fonctions utilitaires
const formatCurrency = (numStr) => {
  if (!numStr) return "0,00";
  const cleaned = numStr.toString().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? "0,00" : num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// FORMATAGE AVEC DÉCIMALES
const formatNumberWithSpaces = (numStr) => {
  if (!numStr) return "0";
  const cleaned = numStr.toString().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  // CHANGEMENT CRITIQUE: Math.round() au lieu de toFixed(2)
  const roundedNum = Math.round(num);
  return isNaN(roundedNum) ? "0" : roundedNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};


// Transformation des données pour InvoicePDF
const transformToLegacyFormat = (invoiceData) => {

  // Si c'est déjà au bon format (depuis l'ancien système)
  if (invoiceData.facture && invoiceData.items) {
    return invoiceData;
  }

  // Calculer les totaux à partir des items
  const calculateTotals = (items) => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    if (items && Array.isArray(items)) {
      items.forEach(item => {
        const montantHT = parseFloat(item.montantHT?.replace(',', '.') || 0);
        const montantTVA = parseFloat(item.montantTVA?.replace(',', '.') || 0);
        const montantTTC = parseFloat(item.montantTTC?.replace(',', '.') || 0);

        totalHT += montantHT;
        totalTVA += montantTVA;
        totalTTC += montantTTC;
      });
    }

    return {
      "Total HT": [totalHT.toFixed(2).replace('.', ',')],
      "Total TVA": [totalTVA.toFixed(2).replace('.', ',')],
      "Total TTC": [totalTTC.toFixed(2).replace('.', ',')]
    };
  };

  const totals = calculateTotals(invoiceData.items);

  return {
    facture: {
      Numéro: [invoiceData.number || ''],
      Date: [invoiceData.date || new Date().toISOString().split('T')[0]],
      DateEcheance: [invoiceData.dueDate || ''],
      Type: [invoiceData.type || 'facture']
    },
    client: invoiceData.client ? {
      Nom: [invoiceData.client.nom || ''],
      Adresse: [invoiceData.client.adresse || ''],
      Ville: [invoiceData.client.ville || ''],
      Email: [invoiceData.client.email || '']
    } : { Nom: [], Adresse: [], Ville: [], Email: [] },
    items: invoiceData.items ? {
      Designation: invoiceData.items.map(item => item.description || ''),
      Quantite: invoiceData.items.map(item => item.quantity?.toString() || '1'),
      "Prix Unitaire": invoiceData.items.map(item => item.unitPrice?.toString() || '0'),
      TVA: invoiceData.items.map(item => `${item.taxRate || 0}%`),
      "Montant HT": invoiceData.items.map(item => item.montantHT || '0'),
      "Montant TVA": invoiceData.items.map(item => item.montantTVA || '0'),
      "Prix Total": invoiceData.items.map(item => item.montantTTC || '0')
    } : {
      Designation: [],
      Quantite: [],
      "Prix Unitaire": [],
      TVA: [],
      "Montant HT": [],
      "Montant TVA": [],
      "Prix Total": []
    },
    totals: totals
  };
};

// EditorHeader 
const EditorHeader = ({
  invoice,
  onSave,
  saving,
  isSaved,
  showPreview,
  onTogglePreview,
  onBack,
  pdfData,
  companyInfo,
  isUpdate
}) => {
  return (
    <header className="ie-header">
      <div className="ie-header-left">
        <button className="ie-floating-back-button " onClick={onBack}>
          <FaArrowLeft className="button-icon" />
          <span className="button-text">Quitter</span>
        </button>
        <div className="ie-header-title">
          <h1>
            {isUpdate ? 'Modifier le document' : 'Nouveau document'} -
            {invoice?.type === 'avoir' ? ' Avoir' : invoice?.type === 'devis' ? ' Devis' : ' Facture'}
            {isUpdate && <span className="ie-edit-badge"> (Édition)</span>}
          </h1>
          {invoice?.number && <span className="ie-invoice-number">{invoice.number}</span>}
        </div>
      </div>

      <div className="ie-header-actions">
        {/* Bouton Aperçu */}
        <button
          className="ie-floating-show-button"
          onClick={() => onTogglePreview(!showPreview)}
        >
          {showPreview ? (
            <>
              <FaEyeSlash className="button-icon" />
              <span className="button-text">Masquer</span>
            </>
          ) : (
            <>
              <FaEye className="button-icon" />
              <span className="button-text">Aperçu</span>
            </>
          )}
        </button>

        {/* Bouton Enregistrer */}
        <button
          onClick={() => onSave()}
          disabled={saving || (isSaved && !isUpdate)} // ← Déjà présent
          className="ie-btn-save ie-button"
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              {isUpdate ? "Mise à jour..." : "Enregistrement..."} {/* ← Modification ici */}
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              {isUpdate ? "Modifier" : "Enregistrer"} {/* ← Modification ici */}
            </>
          )}
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
            className="ie-btn-download ie-button"
          >
            {({ loading, error }) => {
              if (error) {
                console.error("PDF Generation Error:", error);
                return <span>Erreur de génération</span>;
              }
              return loading ? (
                <span>
                  <i className="fas fa-spinner fa-spin"></i> Génération...
                </span>
              ) : (
                <span>
                  <i className="fas fa-file-download"></i> Télécharger
                </span>
              );
            }}
          </PDFDownloadLink>
        )}
      </div>
    </header>
  );
};

// Navigation horizontale
const HorizontalNavigation = ({ activeSection, onSectionChange, invoice }) => {
  const sections = [
    {
      id: 'client',
      label: '👤 Client',
      completed: !!invoice?.client,
      description: 'Sélection du client',
      quote: 'Toute relation commence par un nom.'

    },
    {
      id: 'items',
      label: '📦 Articles',
      completed: invoice?.items?.length > 0,
      description: 'Produits et services',
      quote: 'Chaque élément construit l’ensemble.'

    },
    {
      id: 'settings',
      label: '⚙️ Options',
      completed: true,
      description: 'Paramètres',
      quote: 'Ajuster, c’est perfectionner.'
    },
    {
      id: 'details',
      label: '📄 Détails',
      completed: !!invoice?.number && !!invoice?.date,
      description: 'Informations document',
      quote: 'Les détails donnent vie à l’œuvre.'

    },
  ];
  const currentSection = sections.find(s => s.id === activeSection);
  const [rippleKey, setRippleKey] = React.useState(0);

  const handleSectionChange = (id) => {
    onSectionChange(id);
    setRippleKey(prev => prev + 1); // uniquement pour le ripple
  };

  return (
    <nav className="ie-horizontal-nav">
      <div className="ie-nav-header">
        <h3>{currentSection?.quote}</h3>
        <p>Suivez les étapes</p>
      </div>

      <div className="ie-nav-tabs" style={{ position: 'relative' }}>

        {/* Point lumineux principal (se déplace avec transition) */}
        <div
          className="ie-progress-marker"
          style={{
            left: `calc(${sections.findIndex(s => s.id === activeSection)} * 25% + 12.5%)`
          }}
        >
          {/* Ripple séparé */}
          <span key={rippleKey} className="ie-ripple"></span>
        </div>

        {sections.map(section => (
          <button
            key={section.id}
            className={`ie-nav-tab ${activeSection === section.id ? 'active' : ''} ${section.completed ? 'completed' : ''}`}
            onClick={() => handleSectionChange(section.id)}
          >
            <span className="ie-tab-label">{section.label}</span>
            <span className="ie-tab-description">{section.description}</span>
            {section.completed && <div className="ie-tab-completed">✓</div>}
          </button>
        ))}
      </div>


    </nav>
  );
};

// Section Client
const ClientSection = ({ clients = [], selectedClient, onClientChange, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientInfo, setShowClientInfo] = useState(true); // NOUVEAU: état pour afficher/masquer

  const filteredClients = clients.filter(client =>
    client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.adresse?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ie-section">
      <div className="ie-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Informations du client</h2>
          <p>Sélectionnez le client pour ce document</p>
        </div>
        {/* NOUVEAU: Bouton afficher/masquer comme V1 */}
        <button
          className="first-btn"
          onClick={() => setShowClientInfo(!showClientInfo)}
          style={{ fontSize: '0.9rem' }}
        >
          {showClientInfo ? "Masquer" : "Afficher"}
        </button>
      </div>

      {showClientInfo && (
        <>
          {/* Client sélectionné */}
          {selectedClient && (
            <div className="ie-selected-client">
              <div className="ie-selected-client-header">
                <h4>✅ Client sélectionné</h4>
                <button
                  onClick={() => onClientChange(null)}
                  className="ie-btn-clear-client"
                >
                  <i className="fas fa-times"></i>
                  Changer
                </button>
              </div>
              <div className="ie-selected-client-info">
                <p><strong>Nom:</strong> {selectedClient.nom}</p>
                <p><strong>Email:</strong> {selectedClient.email || 'Non renseigné'}</p>
                <p><strong>Adresse:</strong> {selectedClient.adresse || 'Non renseignée'}</p>
                <p><strong>Ville:</strong> {selectedClient.ville || 'Non renseignée'}</p>
              </div>
            </div>
          )}

          {/* Recherche (seulement si pas de client sélectionné) */}
          {!selectedClient && (
            <>
              <div className="ie-client-search">
                <div className="ie-search-input-wrapper">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ie-search-input"
                  />
                </div>
              </div>

              {error && (
                <div className="ie-error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="ie-clients-grid">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    className={`ie-client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                    onClick={() => onClientChange(client)}
                  >
                    <div className="ie-client-avatar">
                      {(client.nom?.charAt(0) || 'C').toUpperCase()}
                    </div>
                    <div className="ie-client-info">
                      <h4>{client.nom || 'Client sans nom'}</h4>
                      <p className="ie-client-email">
                        <i className="fas fa-envelope"></i>
                        {client.email || 'Aucun email'}
                      </p>
                      <div className="ie-client-address">
                        <i className="fas fa-map-marker-alt"></i>
                        {client.adresse || 'Adresse non renseignée'}
                        {client.ville && `, ${client.ville}`}
                      </div>
                    </div>
                    <div className="ie-client-check">
                      <i className="fas fa-check"></i>
                    </div>
                  </div>
                ))}
              </div>

              {filteredClients.length === 0 && (
                <div className="ie-empty-state">
                  <i className="fas fa-users"></i>
                  <h3>Aucun client trouvé</h3>
                  <p>
                    {searchTerm
                      ? `Aucun résultat pour "${searchTerm}"`
                      : 'Créez d\'abord un client dans l\'espace clients'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// Section Détails
const InvoiceDetailsSection = ({
  data,
  setData,
  errors,
  generateInvoiceNumber,
  currentUser // ← AJOUTEZ CE PARAMETRE
}) => {
  const documentTypes = [
    { value: 'facture', label: 'Facture', icon: '📄' },
    { value: 'devis', label: 'Devis', icon: '📝' },
    { value: 'avoir', label: 'Avoir', icon: '🔄' }
  ];

  // Fonctions pour vérifier les permissions
  const canEditType = () => {
    // Admin, supadmin et superadmin peuvent modifier
    // return ['admin', 'supadmin', 'superadmin'].includes(currentUser?.role);
    return true;

  };

  const canEditNumber = () => {
    // Uniquement supadmin et superadmin peuvent modifier le numéro
    return ['supadmin', 'superadmin'].includes(currentUser?.role);
  };

  const canEditDates = () => {
    // Admin, supadmin et superadmin peuvent modifier
    return ['admin', 'supadmin', 'superadmin'].includes(currentUser?.role);
  };

  const handleDateChange = async (e) => {
    // Vérifier la permission avant de modifier
    if (!canEditDates()) {
      alert("Vous n'avez pas la permission de modifier la date");
      return;
    }

    const newDate = e.target.value;

    try {
      const newNumber = await generateInvoiceNumber(new Date(newDate), data.facture.Type[0]);

      setData({
        ...data,
        facture: {
          ...data.facture,
          Date: [newDate],
          Numéro: [newNumber]
        }
      });
    } catch (error) {
      console.error("Erreur génération numéro:", error);
      setData({
        ...data,
        facture: {
          ...data.facture,
          Date: [newDate]
        }
      });
    }
  };

  const handleTypeChange = async (newType) => {

    try {
      // 🔥 GÉNÉRER UN NOUVEAU NUMÉRO BASÉ SUR LE NOUVEAU TYPE
      const newNumber = await generateInvoiceNumber(new Date(data.facture.Date[0]), newType);

      setData({
        ...data,
        facture: {
          ...data.facture,
          Type: [newType],
          Numéro: [newNumber]
        }
      });

    } catch (error) {
      console.error("Erreur génération numéro:", error);
      setData({
        ...data,
        facture: {
          ...data.facture,
          Type: [newType]
        }
      });
    }
  };
  return (
    <div className="ie-section">
      <div className="ie-section-header">
        <h2>Détails du document</h2>
        <p>Configurez les informations principales</p>
        {/* Indicateur de permissions */}
        <div className="ie-permissions-info" style={{
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <i className="fas fa-lock" style={{ fontSize: '0.8rem' }}></i>
        </div>
      </div>

      <div className="ie-details-grid">
        {/* Type de document */}
        <div className="ie-form-group">
          <label>Type de document *</label>
          <div className="ie-type-selector">
            {documentTypes.map(type => (
              <button
                key={type.value}
                type="button"
                className={`ie-type-option ${data.facture.Type?.[0] === type.value ? 'active' : ''} ${!canEditType() ? 'disabled' : ''}`}
                onClick={() => handleTypeChange(type.value)}
              >
                <span className="ie-type-icon">{type.icon}</span>
                <span className="ie-type-label">{type.label}</span>
                {!canEditType() && (
                  <span className="ie-readonly-badge">Lecture seule</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Numéro de document */}
        <div className="ie-form-group">
          <label>Numéro de document *</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={data.facture.Numéro?.[0] || ''}
              onChange={(e) => {

                setData({
                  ...data,
                  facture: {
                    ...data.facture,
                    Numéro: [e.target.value]
                  }
                });
              }}
              className={`ie-input ${errors?.number ? 'error' : ''} ${!canEditNumber() ? 'disabled' : ''}`}
              placeholder="FACT-2024-001"
              disabled={!canEditNumber()}
              readOnly={!canEditNumber()}
              style={{
                backgroundColor: !canEditNumber() ? 'var(--background-light)' : 'white',
                cursor: !canEditNumber() ? 'not-allowed' : 'text'
              }}
            />
            {!canEditNumber() && (
              <div className="ie-input-lock" style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                fontSize: '0.9rem'
              }}>
                <i className="fas fa-lock"></i>
              </div>
            )}
          </div>
          {errors?.number && <span className="ie-field-error">{errors.number}</span>}
        </div>

        {/* Date d'émission */}
        <div className="ie-form-group">
          <label>Date d'émission *</label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              value={data.facture.Date?.[0] || ''}
              onChange={handleDateChange}
              className={`ie-input ${!canEditDates() ? 'disabled' : ''}`}
              disabled={!canEditDates()}
              readOnly={!canEditDates()}
              style={{
                backgroundColor: !canEditDates() ? 'var(--background-light)' : 'white',
                cursor: !canEditDates() ? 'not-allowed' : 'text'
              }}
            />
            {!canEditDates() && (
              <div className="ie-input-lock" style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                fontSize: '0.9rem'
              }}>
                <i className="fas fa-lock"></i>
              </div>
            )}
          </div>
          {!canEditDates() && (
            <p className="ie-field-hint" style={{
              fontSize: '0.85rem',
              color: 'var(--text-light)',
              marginTop: '0.25rem'
            }}>
              Contactez un administrateur pour modifier
            </p>
          )}
        </div>

        {/* Date d'échéance */}
        <div className="ie-form-group">
          <label>Date d'échéance</label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              value={data.facture.DateEcheance?.[0] || ''}
              onChange={(e) => {
                if (!canEditDates()) {
                  alert("Vous n'avez pas la permission de modifier la date d'échéance");
                  return;
                }
                setData({
                  ...data,
                  facture: {
                    ...data.facture,
                    DateEcheance: [e.target.value]
                  }
                });
              }}
              className={`ie-input ${!canEditDates() ? 'disabled' : ''}`}
              disabled={!canEditDates()}
              readOnly={!canEditDates()}
              style={{
                backgroundColor: !canEditDates() ? 'var(--background-light)' : 'white',
                cursor: !canEditDates() ? 'not-allowed' : 'text'
              }}
            />
            {!canEditDates() && (
              <div className="ie-input-lock" style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                fontSize: '0.9rem'
              }}>
                <i className="fas fa-lock"></i>
              </div>
            )}
          </div>
          {!canEditDates() && (
            <p className="ie-field-hint" style={{
              fontSize: '0.85rem',
              color: 'var(--text-light)',
              marginTop: '0.25rem'
            }}>
              Contactez un administrateur pour modifier
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Section Articles
const ItemsSection = ({ data, setData, error, objet, setObjet }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentItem, setCurrentItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: '',
    taxRate: '0'
  });

  const [duplicateModal, setDuplicateModal] = useState({
    show: false,
    index: null,
    count: 1
  });
  const editFormRef = useRef(null);

  const calculateItemTotals = (item) => {
    const quantite = parseFloat(item.quantity) || 1;
    const prixUnitaire = parseFloat(item.unitPrice.toString().replace(',', '.')) || 0;
    const montantHT = quantite * prixUnitaire;
    const taxRate = parseFloat(item.taxRate === 'custom' ? item.customTaxRate || 0 : item.taxRate);
    const montantTVA = montantHT * (taxRate / 100);
    const montantTTC = montantHT + montantTVA;

    return {
      montantHT: montantHT.toFixed(2).replace('.', ','),
      montantTVA: montantTVA.toFixed(2).replace('.', ','),
      montantTTC: montantTTC.toFixed(2).replace('.', ',')
    };
  };

  const addOrUpdateItem = () => {
    if (!currentItem.description || !currentItem.unitPrice) {
      return;
    }

    const totals = calculateItemTotals(currentItem);
    const newItem = {
      ...currentItem,
      quantity: parseFloat(currentItem.quantity) || 1,
      unitPrice: parseFloat(currentItem.unitPrice.toString().replace(',', '.')) || 0,
      taxRate: currentItem.taxRate === 'custom'
        ? parseFloat(currentItem.customTaxRate || 0)
        : parseFloat(currentItem.taxRate),
      ...totals
    };

    // Convertir au format data.items
    const currentItems = data.items;
    let newItems = { ...currentItems };

    if (editingIndex !== null) {
      // Modification
      Object.keys(newItems).forEach(key => {
        if (Array.isArray(newItems[key])) {
          const value = newItem[
            key === 'Designation' ? 'description' :
              key === 'Quantite' ? 'quantity' :
                key === 'Prix Unitaire' ? 'unitPrice' :
                  key === 'TVA' ? 'taxRate' :
                    key === 'Montant HT' ? 'montantHT' :
                      key === 'Montant TVA' ? 'montantTVA' :
                        key === 'Prix Total' ? 'montantTTC' : key
          ];
          newItems[key][editingIndex] = value !== undefined ? value.toString() : '';
        }
      });
      setEditingIndex(null);
    } else {
      // Ajout
      Object.keys(newItems).forEach(key => {
        if (Array.isArray(newItems[key])) {
          const value = newItem[
            key === 'Designation' ? 'description' :
              key === 'Quantite' ? 'quantity' :
                key === 'Prix Unitaire' ? 'unitPrice' :
                  key === 'TVA' ? 'taxRate' :
                    key === 'Montant HT' ? 'montantHT' :
                      key === 'Montant TVA' ? 'montantTVA' :
                        key === 'Prix Total' ? 'montantTTC' : key
          ];
          newItems[key].push(value !== undefined ? value.toString() : '');
        }
      });
    }

    setData({
      ...data,
      items: newItems
    });

    setCurrentItem({
      description: '',
      quantity: 1,
      unitPrice: '',
      taxRate: '0',
      customTaxRate: ''
    });
  };

  const removeItem = (index) => {
    const newItems = { ...data.items };
    Object.keys(newItems).forEach(key => {
      if (Array.isArray(newItems[key])) {
        newItems[key] = newItems[key].filter((_, i) => i !== index);
      }
    });

    setData({
      ...data,
      items: newItems
    });
  };


  const editItem = (index) => {
    const item = {
      description: data.items.Designation?.[index] || '',
      quantity: data.items.Quantite?.[index] || '1',
      unitPrice: data.items["Prix Unitaire"]?.[index] || '',
      taxRate: data.items.TVA?.[index]?.replace('%', '') || '0'
    };

    setCurrentItem({
      ...item,
      taxRate: ['0', '18', '20'].includes(item.taxRate) ? item.taxRate : 'custom',
      customTaxRate: ['0', '18', '20'].includes(item.taxRate) ? '' : item.taxRate
    });
    setEditingIndex(index);

    // AJOUT: Défilement vers le formulaire après un court délai
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setCurrentItem({
      description: '',
      quantity: 1,
      unitPrice: '',
      taxRate: '0',
      customTaxRate: ''
    });
    setEditingIndex(null);

    // Défilement vers le haut du formulaire
    setTimeout(() => {
      const formSection = document.querySelector('.ie-item-form');
      if (formSection) {
        formSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };


  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const newItems = { ...data.items };
    Object.keys(newItems).forEach(key => {
      if (Array.isArray(newItems[key])) {
        const [movedItem] = newItems[key].splice(fromIndex, 1);
        newItems[key].splice(toIndex, 0, movedItem);
      }
    });

    setData({
      ...data,
      items: newItems
    });
  };

  const openDuplicateModal = (index) => {
    setDuplicateModal({
      show: true,
      index: index,
      count: 1
    });
  };

  const closeDuplicateModal = () => {
    setDuplicateModal({
      show: false,
      index: null,
      count: 1
    });
  };

  const handleDuplicateCountChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    setDuplicateModal(prev => ({
      ...prev,
      count: Math.max(1, Math.min(20, count))
    }));
  };

  const confirmDuplicateItem = () => {
    if (duplicateModal.index === null) return;

    const itemIndex = duplicateModal.index;
    const newItems = { ...data.items };

    // Dupliquer l'article le nombre de fois spécifié
    for (let i = 0; i < duplicateModal.count; i++) {
      Object.keys(newItems).forEach(key => {
        if (Array.isArray(newItems[key]) && newItems[key][itemIndex] !== undefined) {
          newItems[key].push(newItems[key][itemIndex]);
        }
      });
    }

    setData({
      ...data,
      items: newItems
    });
    closeDuplicateModal();
  };

  const calculateTotals = () => {
    const items = data.items.Designation || [];
    const subtotal = items.reduce((sum, _, index) => {
      const montantHT = data.items["Montant HT"]?.[index] || "0";
      return sum + parseFloat(montantHT.toString().replace(',', '.') || 0);
    }, 0);

    const taxTotal = items.reduce((sum, _, index) => {
      const montantTVA = data.items["Montant TVA"]?.[index] || "0";
      return sum + parseFloat(montantTVA.toString().replace(',', '.') || 0);
    }, 0);

    const total = items.reduce((sum, _, index) => {
      const montantTTC = data.items["Prix Total"]?.[index] || "0";
      return sum + parseFloat(montantTTC.toString().replace(',', '.') || 0);
    }, 0);

    return { subtotal, taxTotal, total };
  };

  const totals = calculateTotals();
  const currentTotals = calculateItemTotals(currentItem);
  const itemsCount = data.items.Designation?.length || 0;

  return (
    <div className="ie-section">
      <div className="ie-section-header">
        <h2>Articles et services</h2>
        <p>Ajoutez les produits et services facturés</p>
      </div>

      <div className="ie-setting-group">
        <h3>Objet du document</h3>
        <div className="ie-form-group">
          <input
            type="text"
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            placeholder="Objet de la facture..."
            className="ie-input"
          />
        </div>
      </div>

      {error && <div className="ie-error-message">{error}</div>}
      {(currentItem.quantity && currentItem.unitPrice) && (
        <div className="ie-realtime-preview">
          <div className="ie-preview-card">
            <h4>📊 Aperçu du calcul:</h4>
            <div className="ie-preview-details">
              <span>Montant HT: <strong>{formatNumberWithSpaces(currentTotals.montantHT)} FCFA</strong></span>
              <span>TVA ({currentItem.taxRate === 'custom' ? currentItem.customTaxRate : currentItem.taxRate}%): <strong>{formatNumberWithSpaces(currentTotals.montantTVA)} FCFA</strong></span>
              <span>Total TTC: <strong>{formatNumberWithSpaces(currentTotals.montantTTC)} FCFA</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* AJOUT: Référence sur le formulaire */}
      <div
        ref={editFormRef}
        className={`ie-item-form ${editingIndex !== null ? 'editing' : ''}`}
      >        <div className="ie-form-row">
          <div className="ie-form-group">
            <label>Description *</label>
            <input
              type="text"
              value={currentItem.description}
              onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
              placeholder="Nom de l'article ou service"
            />
          </div>
          <div className="ie-form-row-child">
            <div className="ie-form-group">
              <label>Quantité</label>
              <input
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
              />
            </div>

            <div className="ie-form-group">
              <label>Prix unitaire (HT) *</label>
              <input
                type="text"
                value={currentItem.unitPrice}
                onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="ie-form-group">
              <label>TVA (%)</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={currentItem.taxRate === 'custom' ? 'custom' : currentItem.taxRate}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setCurrentItem({
                        ...currentItem,
                        taxRate: 'custom',
                        customTaxRate: ''
                      });
                    } else {
                      setCurrentItem({
                        ...currentItem,
                        taxRate: e.target.value,
                        customTaxRate: ''
                      });
                    }
                  }}
                  style={{
                    appearance: 'none',
                    paddingRight: '30px'
                  }}
                >
                  <option value="0">0%</option>
                  <option value="18">18%</option>
                  <option value="20">20%</option>
                  <option value="custom">Personnalisé...</option>
                </select>
                <i className="fas fa-chevron-down" style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-light)'
                }}></i>
              </div>

              {(currentItem.taxRate === 'custom') && (
                <input
                  type="number"
                  value={currentItem.customTaxRate}
                  onChange={(e) => setCurrentItem({ ...currentItem, customTaxRate: e.target.value })}
                  placeholder="Saisir un taux personnalisé"
                  step="0.1"
                  min="0"
                  max="100"
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={addOrUpdateItem}
          className="ie-btn-add-item"
          disabled={!currentItem.description || !currentItem.unitPrice}
          type="button"
        >
          <i className={`fas fa-${editingIndex !== null ? 'refresh' : 'plus'}`}></i>
          {editingIndex !== null ? 'Mettre à jour' : 'Ajouter l\'article'}
        </button>

        {editingIndex !== null && (
          <button
            onClick={handleCancelEdit}
            className="ie-btn-cancel"
            type="button"
          >
            <i className="fas fa-times"></i> Annuler
          </button>
        )}
      </div>

      {itemsCount > 0 ? (
        <>
          <div className="ie-items-table">
            <div className="ie-table-header">
              <div>Description</div>
              <div>Quantité</div>
              <div>P.U</div>
              <div>TVA</div>
              <div>M. HT</div>
              <div>M. TVA</div>
              <div>T. TTC</div>
              <div>Actions</div>
            </div>

            {data.items.Designation.map((_, index) => (
              <div key={index} className="ie-table-row">
                <div className="ie-item-description">{data.items.Designation[index]}</div>
                <div>{formatNumberWithSpaces(data.items.Quantite[index])}</div>
                <div>{formatNumberWithSpaces(data.items["Prix Unitaire"][index])} FCFA</div>
                <div>{data.items.TVA[index]}</div>
                <div>{formatNumberWithSpaces(data.items["Montant HT"][index])} FCFA</div>
                <div>{formatNumberWithSpaces(data.items["Montant TVA"][index])} FCFA</div>
                <div>{formatNumberWithSpaces(data.items["Prix Total"][index])} FCFA</div>
                <div className="ie-item-actions">
                  <div className="ie-item-actions-second">
                    {/* MODIF: Utiliser la nouvelle fonction editItem */}
                    <button onClick={() => editItem(index)} className="ie-btn-edit" type="button">
                      <FaEdit className="" />
                    </button>

                    <button onClick={() => openDuplicateModal(index)} className="ie-btn-duplicate" type="button">
                      <FaCopy className="" />
                    </button>

                    <button onClick={() => removeItem(index)} className="ie-btn-delete" type="button">
                      <FaTrash className="" />
                    </button>
                  </div>

                  <div className="ie-move-buttons">
                    <button
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                      className="ie-btn-move"
                      type="button"
                    >
                      <FaArrowUp className="" />
                    </button>
                    <button
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === itemsCount - 1}
                      className="ie-btn-move"
                      type="button"
                    >
                      <FaArrowDown className="" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ie-items-summary">
            <div className="ie-summary-row">
              <span>Total HT:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="ie-summary-row">
              <span>Total TVA:</span>
              <span>{formatCurrency(totals.taxTotal)}</span>
            </div>
            <div className="ie-summary-row ie-total">
              <span>Total TTC:</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="ie-empty-state">
          <i className="fas fa-receipt"></i>
          <h3>Aucun article ajouté</h3>
          <p>Commencez par ajouter votre premier article</p>
        </div>
      )}

      {duplicateModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Dupliquer l'article</h3>
            <p>Combien de fois voulez-vous dupliquer cet article ?</p>

            <div className="form-group">
              <label>Nombre de copies:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={duplicateModal.count}
                onChange={handleDuplicateCountChange}
                className="input"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={closeDuplicateModal}
                className="button danger-button"
              >
                Annuler
              </button>
              <button
                onClick={confirmDuplicateItem}
                className="button success-button"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Section Paramètres
const SettingsSection = ({ selectedRibs, setSelectedRibs, objet, setObjet, showSignature, setShowSignature }) => {
  return (
    <div className="ie-section">
      <div className="ie-section-header">
        <h2>Options et paramètres</h2>
        <p>Personnalisez les options de paiement et d'affichage</p>
      </div>

      <div className="ie-settings-grid">
        <div className="ie-setting-group">
          <h3>Coordonnées bancaires</h3>
          <div className="ie-rib-selector">
            <label className="ie-rib-option">
              <input
                type="checkbox"
                checked={selectedRibs.includes("CBAO")}
                onChange={(e) => {
                  const newRibs = e.target.checked
                    ? [...selectedRibs, "CBAO"]
                    : selectedRibs.filter(rib => rib !== "CBAO");
                  setSelectedRibs(newRibs);
                }}
              />
              <span className="ie-rib-checkmark"></span>
              <span className="ie-rib-label">CBAO</span>
            </label>

            <label className="ie-rib-option">
              <input
                type="checkbox"
                checked={selectedRibs.includes("BIS")}
                onChange={(e) => {
                  const newRibs = e.target.checked
                    ? [...selectedRibs, "BIS"]
                    : selectedRibs.filter(rib => rib !== "BIS");
                  setSelectedRibs(newRibs);
                }}
              />
              <span className="ie-rib-checkmark"></span>
              <span className="ie-rib-label">BIS</span>
            </label>
          </div>
        </div>

        <div className="ie-setting-group">
          <h3>Options d'affichage</h3>
          <label className="ie-checkbox-option">
            <input
              type="checkbox"
              checked={showSignature}
              onChange={(e) => setShowSignature(e.target.checked)}
            />
            <span className="ie-checkmark"></span>
            Inclure la signature
          </label>
        </div>
      </div>
    </div>
  );
};

// Aperçu avec InvoicePDF
const PreviewPanel = ({ invoice, companyInfo, selectedRibs }) => {
  if (!invoice?.client) {
    return (
      <div className="ie-preview-panel">
        <div className="ie-preview-placeholder">
          <i className="fas fa-file-invoice"></i>
          <h3>Aperçu du document</h3>
          <p>Complétez les informations pour voir l'aperçu</p>
        </div>
      </div>
    );
  }

  const pdfData = transformToLegacyFormat(invoice);

  return (
    <div className="ie-preview-panel">
      <div className="ie-preview-header">
        <h3>Aperçu du document</h3>
        <span className="ie-preview-badge">
          {invoice.type === 'avoir' ? 'AVOIR' : invoice.type === 'devis' ? 'DEVIS' : 'FACTURE'}
        </span>
      </div>

      <DynamicPDFViewer
        width="100%"
        height="800px"
        style={{
          marginTop: '1rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <InvoicePDF
          data={pdfData}
          ribType={selectedRibs} // ← Utilisez selectedRibs passé en paramètre
          objet={invoice.objet || ''}
          showSignature={invoice.showSignature !== false}
          companyInfo={companyInfo}
        />
      </DynamicPDFViewer>
    </div>
  );
};
// Composant principal
const InvoiceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();

  // UTILISEZ LE FORMAT ANCIEN pour data
  const [data, setData] = useState({
    facture: {
      Numéro: [""],
      Date: [new Date().toISOString().split('T')[0]],
      DateEcheance: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
      Type: ["facture"]
    },
    client: {
      Nom: [],
      Adresse: [],
      Ville: [],
      Email: []
    },
    items: {
      Designation: [],
      Quantite: [],
      "Prix Unitaire": [],
      TVA: [],
      "Montant HT": [],
      "Montant TVA": [],
      "Prix Total": []
    },
    totals: {
      "Total HT": ["0,00"],
      "Total TVA": ["0,00"],
      "Total TTC": ["0,00"]
    }
  });

  const [clients, setClients] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({ // ← AJOUTE ICI
    name: '',
    logo: '',
    rcNumber: '',
    ninea: '',
    address: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('client');
  const [showPreview, setShowPreview] = useState(false);

  // Ajoutez ces états comme dans l'ancienne version
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedRibs, setSelectedRibs] = useState([]);
  const [objet, setObjet] = useState("");
  const [showSignature, setShowSignature] = useState(true);

  const [isUpdate, setIsUpdate] = useState(false);

  // Chargement initial des données
  useEffect(() => {
    const loadClients = async () => {
      try {
        if (!currentUser?.companyId) {
          return [];
        }

        const { collection, query, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../firebase');

        const clientsRef = collection(db, `companies/${currentUser.companyId}/clients`);
        const q = query(clientsRef);
        const querySnapshot = await getDocs(q);

        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null
        }));

        return clientsData;

      } catch (error) {
        console.error('❌ Erreur chargement clients:', error);
        return [];
      }
    };

    const loadCompanyInfo = async () => {
      try {
        if (!currentUser?.companyId) return;

        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase');

        const companyRef = doc(db, 'companies', currentUser.companyId);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) {
          const companyData = companySnap.data();
          setCompanyInfo({
            name: companyData.name || 'Nom de l\'entreprise',
            logo: companyData.logo || '',
            logoFileName: companyData.logoFileName || '',
            signatureFileName: companyData.signatureFileName || '',
            rcNumber: companyData.rcNumber || '',
            ninea: companyData.ninea || '',
            address: companyData.address || '',
            region: companyData.region || '',
            country: companyData.country || '',
            phone: companyData.phone || '',
            email: companyData.email || '',
            website: companyData.website || '',
            ribCBAO: companyData.ribCBAO || '',
            ribBIS: companyData.ribBIS || '',
            ribOther1: companyData.ribOther1 || '',
            ribOther1Label: companyData.ribOther1Label || '',
            ribOther2: companyData.ribOther2 || '',
            ribOther2Label: companyData.ribOther2Label || '',
            invoiceColor: companyData.invoiceColor || '#218838',
            invoiceFont: companyData.invoiceFont || 'Helvetica',
            invoiceTemplate: companyData.invoiceTemplate || 'classic',
            pdfQuality: companyData.pdfQuality || 'high'
          });
        }
      } catch (error) {
        console.error('Erreur chargement entreprise:', error);
      }
    };

    const initializeData = async () => {
      try {
        setLoading(true);

        // Chargez les clients et les données de l'entreprise en parallèle
        const [clientsData] = await Promise.all([
          loadClients(),
        ]);

        // Mettre à jour l'état immédiatement et utiliser la variable locale
        setClients(clientsData);

        // Chargez les données de l'entreprise
        await loadCompanyInfo();

        let invoiceData;
        let isUpdateMode = false;

        // 🔥 DÉTECTER LE TYPE DE DOCUMENT PASSÉ VIA LOCATION.STATE
        const documentType = location.state?.type || 'facture';

        // MODE MODIFICATION/DUPLICATION depuis location.state
        if (location.state?.facture) {
          invoiceData = invoiceService.transformFactureData(location.state.facture);
          setIsSaved(!!location.state.facture.id);

          // CORRECTION : Utiliser clientsData (la variable locale) au lieu de clients (l'état)
          if (location.state.facture.clientId) {
            const currentClient = clientsData.find(c => c.id === location.state.facture.clientId);
            if (currentClient) {
              invoiceData.client = {
                Nom: [currentClient.nom],
                Adresse: [currentClient.adresse || ""],
                Ville: [currentClient.ville || ""],
                Email: [currentClient.email || ""]
              };
              setSelectedClientId(currentClient.id);
            } else {
              // Si le client n'est pas trouvé dans la liste locale, garder les données originales
              invoiceData.client = invoiceData.client || {
                Nom: [location.state.facture.client?.nom || ""],
                Adresse: [location.state.facture.client?.adresse || ""],
                Ville: [location.state.facture.client?.ville || ""],
                Email: [location.state.facture.client?.email || ""]
              };
              setSelectedClientId(location.state.facture.clientId);
            }
          }

          isUpdateMode = !!location.state.facture.id && !location.state.isDuplicate;

          if (location.state.isDuplicate) {
            // Pour une duplication, générer un nouveau numéro en utilisant le type du document
            const newNumber = await invoiceService.generateInvoiceNumber(
              currentUser.companyId,
              new Date(invoiceData.facture.Date[0] || new Date()),
              documentType // 🔥 Utiliser documentType
            );
            invoiceData.facture.Numéro = [newNumber];
            isUpdateMode = false;
          }

          setSelectedRibs(location.state.facture.ribs || []);
          setObjet(location.state.facture.objet || "");
          setShowSignature(location.state.facture.showSignature !== false);

        } else if (id) {
          // MODE ÉDITION depuis Firestore (via ID)
          const result = await invoiceService.getInvoiceById(currentUser.companyId, id);
          if (result.success) {
            invoiceData = invoiceService.transformFactureData(result.data);
            setIsSaved(true);
            isUpdateMode = true;

            // CORRECTION : Chercher aussi le client dans clientsData pour l'édition
            if (result.data.clientId) {
              const currentClient = clientsData.find(c => c.id === result.data.clientId);
              if (currentClient) {
                invoiceData.client = {
                  Nom: [currentClient.nom],
                  Adresse: [currentClient.adresse || ""],
                  Ville: [currentClient.ville || ""],
                  Email: [currentClient.email || ""]
                };
              }
            }

            setSelectedClientId(result.data.clientId || "");
            setSelectedRibs(result.data.ribs || []);
            setObjet(result.data.objet || "");
            setShowSignature(result.data.showSignature !== false);
          } else {
            throw new Error("Facture introuvable");
          }
        } else {
          // MODE CRÉATION - Nouveau document
          // 🔥 GÉNÉRER LE NUMÉRO EN FONCTION DU TYPE PASSÉ VIA LOCATION.STATE
          const invoiceNumber = await invoiceService.generateInvoiceNumber(
            currentUser.companyId,
            new Date(),
            documentType // 🔥 Utiliser documentType au lieu de 'facture'
          );

          invoiceData = {
            facture: {
              Numéro: [invoiceNumber],
              Date: [new Date().toISOString().split('T')[0]],
              DateEcheance: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
              Type: [documentType] // 🔥 Utiliser documentType
            },
            client: { Nom: [], Adresse: [], Ville: [], Email: [] },
            items: {
              Designation: [], Quantite: [], "Prix Unitaire": [], TVA: [],
              "Montant HT": [], "Montant TVA": [], "Prix Total": []
            },
            totals: {
              "Total HT": ["0,00"], "Total TVA": ["0,00"], "Total TTC": ["0,00"]
            }
          };
          setIsSaved(false);
          isUpdateMode = false;

          // Si un client est passé via location.state
          if (location.state?.client) {
            const clientFromState = location.state.client;
            invoiceData.client = {
              Nom: [clientFromState.nom],
              Adresse: [clientFromState.adresse],
              Ville: [clientFromState.ville || ""],
              Email: [clientFromState.email || ""]
            };
            setSelectedClientId(clientFromState.id);
          }
        }

        setData(invoiceData);
        setIsUpdate(isUpdateMode);

      } catch (error) {
        console.error('❌ Erreur initialisation:', error);

        // 🔥 CRÉER UN NUMÉRO TEMPORAIRE BASÉ SUR LE TYPE
        const documentType = location.state?.type || 'facture';
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        // Créer un préfixe basé sur le type
        let prefix = 'F';
        if (documentType === 'devis') prefix = 'DEV';
        if (documentType === 'avoir') prefix = 'AV';

        setData({
          facture: {
            Numéro: [`${prefix}-${year}${month}-TEMP`],
            Date: [new Date().toISOString().split('T')[0]],
            DateEcheance: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
            Type: [documentType] // 🔥 Utiliser documentType
          },
          client: { Nom: [], Adresse: [], Ville: [], Email: [] },
          items: {
            Designation: [], Quantite: [], "Prix Unitaire": [], TVA: [],
            "Montant HT": [], "Montant TVA": [], "Prix Total": []
          },
          totals: {
            "Total HT": ["0,00"], "Total TVA": ["0,00"], "Total TTC": ["0,00"]
          }
        });
        setIsSaved(false);
        setIsUpdate(false);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.companyId) {
      initializeData(); // ← APPELEZ LA FONCTION
    } else {
      setLoading(false);
    }
  }, [id, currentUser?.companyId, location.state]);

  const saveInvoice = async () => {
    if (isSaved && !isUpdate) {
      alert("Cette facture est déjà enregistrée. Créez une nouvelle facture si nécessaire.");
      return;
    }

    if (!validateInvoice()) return;

    setSaving(true);
    try {
      // 1. Recalculer les totaux avant l'enregistrement
      const calculateFinalTotals = () => {
        let totalHT = 0;
        let totalTVA = 0;
        let totalTTC = 0;

        const items = data.items;

        if (items.Designation && items.Designation.length > 0) {
          for (let i = 0; i < items.Designation.length; i++) {
            const montantHT = parseFloat(items["Montant HT"]?.[i]?.replace(',', '.') || 0);
            const montantTVA = parseFloat(items["Montant TVA"]?.[i]?.replace(',', '.') || 0);
            const montantTTC = parseFloat(items["Prix Total"]?.[i]?.replace(',', '.') || 0);

            totalHT += montantHT;
            totalTVA += montantTVA;
            totalTTC += montantTTC;
          }
        }

        return {
          "Total HT": [totalHT.toFixed(2).replace('.', ',')],
          "Total TVA": [totalTVA.toFixed(2).replace('.', ',')],
          "Total TTC": [totalTTC.toFixed(2).replace('.', ',')]
        };
      };

      const finalTotals = calculateFinalTotals();

      // 2. Mettre à jour les données avec les totaux calculés
      const updatedData = {
        ...data,
        totals: finalTotals
      };

      // Préparer les données complètes
      const completeData = {
        ...updatedData,
        clientId: selectedClientId,
        ribs: selectedRibs,
        objet: objet,
        showSignature: showSignature
      };

      const invoiceData = invoiceService.prepareInvoiceData(completeData);

      if (id || (location.state?.facture?.id)) {
        const invoiceId = id || location.state.facture.id;
        await invoiceService.updateInvoice(currentUser.companyId, invoiceId, invoiceData);
      } else {
        await invoiceService.addInvoice(currentUser.companyId, currentUser.uid, invoiceData);
      }

      // 3. Mettre à jour l'état local
      setData(updatedData);
      setIsSaved(true);

      const action = id || (location.state?.facture?.id) ? "modifiée" : "enregistrée";

      alert(
        `${data.facture.Type[0] === 'avoir' ? 'Avoir' : data.facture.Type[0] === 'devis' ? 'Devis' : 'Facture'} ` +
        `${action} avec succès !` // ← Modification ici
      );

    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert(`Erreur lors de la ${isUpdate ? 'modification' : 'création'}`); // ← Modification ici
    } finally {
      setSaving(false);
    }
  };
  // Fonction pour calculer les totaux
  const calculateTotals = useCallback(() => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    const items = data.items;

    if (items.Designation && items.Designation.length > 0) {
      for (let i = 0; i < items.Designation.length; i++) {
        const montantHT = parseFloat(items["Montant HT"]?.[i]?.replace(',', '.') || 0);
        const montantTVA = parseFloat(items["Montant TVA"]?.[i]?.replace(',', '.') || 0);
        const montantTTC = parseFloat(items["Prix Total"]?.[i]?.replace(',', '.') || 0);

        totalHT += montantHT;
        totalTVA += montantTVA;
        totalTTC += montantTTC;
      }
    }

    setData(prevData => ({
      ...prevData,
      totals: {
        "Total HT": [totalHT.toFixed(2).replace('.', ',')],
        "Total TVA": [totalTVA.toFixed(2).replace('.', ',')],
        "Total TTC": [totalTTC.toFixed(2).replace('.', ',')]
      }
    }));
  }, [data.items, setData]);

  // Recalculer les totaux quand les items changent
  useEffect(() => {
    calculateTotals();
  }, [data.items, calculateTotals]);

  const validateInvoice = () => {
    const newErrors = {};

    if (!data.client?.Nom?.[0]) {
      newErrors.client = 'Client requis';
    }

    if (!data.items.Designation || data.items.Designation.length === 0) {
      newErrors.items = 'Au moins un article requis';
    }

    if (!data.facture.Numéro?.[0]) {
      newErrors.number = 'Numéro de document requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const getPdfData = () => {
    // Si pas de données, retourner un objet avec des valeurs par défaut sécurisées
    if (!data || Object.keys(data).length === 0) {
      return {
        facture: {
          Numéro: ["TEMP"],
          Date: [new Date().toISOString().split('T')[0]],
          DateEcheance: [""],
          Type: ["facture"]
        },
        client: {
          Nom: ["Client"],
          Adresse: [""],
          Ville: [""],
          Email: [""]
        },
        items: {
          Designation: [],
          Quantite: [],
          "Prix Unitaire": [],
          TVA: [],
          "Montant HT": [],
          "Montant TVA": [],
          "Prix Total": []
        },
        totals: {
          "Total HT": ["0,00"],
          "Total TVA": ["0,00"],
          "Total TTC": ["0,00"]
        }
      };
    }

    // Transformez et nettoyez les données
    const transformed = transformToLegacyFormat(data);

    // S'assurer que toutes les valeurs sont définies
    return {
      facture: {
        Numéro: transformed.facture.Numéro || [""],
        Date: transformed.facture.Date || [new Date().toISOString().split('T')[0]],
        DateEcheance: transformed.facture.DateEcheance || [""],
        Type: transformed.facture.Type || ["facture"]
      },
      client: {
        Nom: transformed.client?.Nom || [""],
        Adresse: transformed.client?.Adresse || [""],
        Ville: transformed.client?.Ville || [""],
        Email: transformed.client?.Email || [""]
      },
      items: transformed.items || {
        Designation: [],
        Quantite: [],
        "Prix Unitaire": [],
        TVA: [],
        "Montant HT": [],
        "Montant TVA": [],
        "Prix Total": []
      },
      totals: transformed.totals || {
        "Total HT": ["0,00"],
        "Total TVA": ["0,00"],
        "Total TTC": ["0,00"]
      }
    };
  };

  const invoiceCompatible = {
    id: id || location.state?.facture?.id,
    type: data.facture.Type?.[0] || 'facture',
    number: data.facture.Numéro?.[0] || '',
    date: data.facture.Date?.[0] || '',
    dueDate: data.facture.DateEcheance?.[0] || '',
    objet: objet,
    ribs: selectedRibs,
    showSignature: showSignature,
    client: data.client?.Nom?.[0] ? {
      id: selectedClientId,
      nom: data.client.Nom[0],
      email: data.client.Email[0],
      adresse: data.client.Adresse[0],
      ville: data.client.Ville[0]
    } : null,
    items: data.items.Designation?.map((_, index) => ({
      description: data.items.Designation[index],
      quantity: data.items.Quantite[index],
      unitPrice: data.items["Prix Unitaire"][index],
      taxRate: data.items.TVA[index],
      montantHT: data.items["Montant HT"][index],
      montantTVA: data.items["Montant TVA"][index],
      montantTTC: data.items["Prix Total"][index]
    })) || []
  };

  if (loading) {
    return (
      <LoadingState message="Chargement de l'éditeur de factures..." />
    );
  }

  return (
    <div className="ie-invoice-editor">
      <EditorHeader
        invoice={invoiceCompatible} // Utilisez l'objet compatible
        onSave={saveInvoice}
        saving={saving}
        isSaved={isSaved}
        showPreview={showPreview}
        onTogglePreview={setShowPreview}
        onBack={() => navigate('/')}
        pdfData={getPdfData()}
        companyInfo={companyInfo} // ← Ajoutez cette ligne
        isUpdate={isUpdate} // ← AJOUTEZ CETTE LIGNE

      />

      <div className="ie-main-layout">
        <HorizontalNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          invoice={invoiceCompatible} // Utilisez l'objet compatible
        />

        <div className="ie-content-area">
          <div className="ie-editor-content">
            {activeSection === 'client' && (
              <ClientSection
                clients={clients}
                selectedClient={data.client?.Nom?.[0] ? {
                  id: selectedClientId,
                  nom: data.client.Nom[0],
                  email: data.client.Email[0],
                  adresse: data.client.Adresse[0],
                  ville: data.client.Ville[0]
                } : null}
                onClientChange={(client) => {
                  if (client) {
                    setData({
                      ...data,
                      client: {
                        Nom: [client.nom],
                        Adresse: [client.adresse],
                        Ville: [client.ville || ""],
                        Email: [client.email || ""]
                      }
                    });
                    setSelectedClientId(client.id);
                  } else {
                    setData({
                      ...data,
                      client: { Nom: [], Adresse: [], Ville: [], Email: [] }
                    });
                    setSelectedClientId("");
                  }
                }}
                error={errors.client}
              />
            )}

            {activeSection === 'details' && (
              <InvoiceDetailsSection
                data={data}
                setData={setData}
                errors={errors}
                generateInvoiceNumber={(date, type) =>
                  invoiceService.generateInvoiceNumber(currentUser.companyId, date, type)
                }
                currentUser={currentUser}

              />
            )}

            {activeSection === 'items' && (
              <ItemsSection
                data={data}
                setData={setData}
                error={errors.items}
                objet={objet}
                setObjet={setObjet}
              />
            )}

            {activeSection === 'settings' && (
              <SettingsSection
                selectedRibs={selectedRibs}
                setSelectedRibs={setSelectedRibs}
                objet={objet}
                setObjet={setObjet}
                showSignature={showSignature}
                setShowSignature={setShowSignature}
              />
            )}
          </div>

          {showPreview && (
            <PreviewPanel
              invoice={invoiceCompatible}
              companyInfo={companyInfo}
              selectedRibs={selectedRibs} // ← AJOUTEZ CETTE LIGNE
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import '../css/Fact.css';
import Sidebar from "../Sidebar";
import { useAuth } from '../auth/AuthContext';
import InvoicePDF from './InvoicePDF';
import DynamicPDFViewer from '../components/DynamicPDFViewer';
import empty from '../assets/empty_article.png';
import { invoiceService } from '../services/invoiceService';
import { FaArrowLeft, FaArrowDown, FaArrowUp, FaEye } from "react-icons/fa";



// Composant InvoiceForm (inchangé)
const InvoiceForm = ({ data, setData, clients, handleSave, isSaving, isSaved, showPreview, setShowPreview, generateInvoiceNumber, location }) => {
  const [currentItem, setCurrentItem] = useState({
    Designation: "",
    Quantite: "1",
    "Prix Unitaire": "",
    TVA: "0"
  });
  const [selectedClientId, setSelectedClientId] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [showClientInfo, setShowClientInfo] = useState(true);
  const { currentUser } = useAuth();
  const [selectedRibs, setSelectedRibs] = useState(data.ribs || []);
  const [objet, setObjet] = useState(data.objet || "");
  const [showSignature, setShowSignature] = useState(data.showSignature || false);
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);

    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setData({
        ...data,
        client: {
          Nom: [selectedClient.nom],
          Adresse: [selectedClient.adresse],
          Ville: [selectedClient.ville || ""],
          // Ajoutez d'autres champs si nécessaire
        }
      });
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({ ...currentItem, [name]: value });
  };

  const addItem = () => {
    if (!currentItem.Designation || !currentItem.Quantite || !currentItem["Prix Unitaire"]) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const quantite = parseFloat(currentItem.Quantite.replace(",", "."));
    const prixUnitaire = parseFloat(currentItem["Prix Unitaire"].replace(",", "."));
    const montantHT = quantite * prixUnitaire;
    const tva = parseFloat(currentItem.TVA.replace(",", ".")) || 0;
    const montantTVA = montantHT * (tva / 100);
    const montantTTC = montantHT + montantTVA;

    const newItem = {
      Designation: currentItem.Designation,
      Quantite: currentItem.Quantite,
      "Prix Unitaire": currentItem["Prix Unitaire"],
      TVA: `${tva}%`,
      "Montant HT": montantHT.toFixed(2).replace(".", ","),
      "Montant TVA": montantTVA.toFixed(2).replace(".", ","),
      "Prix Total": montantTTC.toFixed(2).replace(".", ",")
    };

    const updatedItems = { ...data.items };

    if (editingIndex !== null) {
      // Modification d'un article existant
      Object.keys(newItem).forEach(key => {
        updatedItems[key][editingIndex] = newItem[key];
      });
      setEditingIndex(null);
    } else {
      // Ajout d'un nouvel article
      Object.keys(newItem).forEach(key => {
        if (!updatedItems[key]) updatedItems[key] = [];
        updatedItems[key].push(newItem[key]);
      });
    }

    setData({
      ...data,
      items: updatedItems
    });

    setCurrentItem({
      Designation: "",
      Quantite: "1",
      "Prix Unitaire": "",
      TVA: "0"
    });
  };

  const editItem = (index) => {
    setCurrentItem({
      Designation: data.items.Designation[index],
      Quantite: data.items.Quantite[index],
      "Prix Unitaire": data.items["Prix Unitaire"][index],
      TVA: data.items.TVA[index].replace("%", "")
    });
    setEditingIndex(index);
  };

  const removeItem = (index) => {
    const updatedItems = { ...data.items };
    Object.keys(updatedItems).forEach(key => {
      updatedItems[key] = updatedItems[key].filter((_, i) => i !== index);
    });

    setData({
      ...data,
      items: updatedItems
    });
  };

  const calculateTotals = useCallback(() => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    if (data.items["Montant HT"] && data.items["Montant HT"].length > 0) {
      totalHT = data.items["Montant HT"].reduce((sum, val) => {
        return sum + parseFloat(val.replace(",", "."));
      }, 0);
    }

    if (data.items["Montant TVA"] && data.items["Montant TVA"].length > 0) {
      totalTVA = data.items["Montant TVA"].reduce((sum, val) => {
        return sum + parseFloat(val.replace(",", "."));
      }, 0);
    }

    if (data.items["Prix Total"] && data.items["Prix Total"].length > 0) {
      totalTTC = data.items["Prix Total"].reduce((sum, val) => {
        return sum + parseFloat(val.replace(",", "."));
      }, 0);
    }

    setData(prevData => ({
      ...prevData,
      totals: {
        "Total HT": [totalHT.toFixed(2).replace(".", ",")],
        "Total TVA": [totalTVA.toFixed(2).replace(".", ",")],
        "Total TTC": [totalTTC.toFixed(2).replace(".", ",")]
      }
    }));
  }, [data.items, setData]);

  useEffect(() => {
    calculateTotals();
  }, [data.items, calculateTotals]);
  const [duplicateItem, setDuplicateItem] = useState({
    index: null,
    count: 1,
    showModal: false
  });
  const openDuplicateModal = (index) => {
    setDuplicateItem({
      index,
      count: 1,
      showModal: true
    });
  };

  const closeDuplicateModal = () => {
    setDuplicateItem({
      index: null,
      count: 1,
      showModal: false
    });
  };

  const handleDuplicateCountChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    setDuplicateItem(prev => ({
      ...prev,
      count: Math.max(1, count) // Minimum 1
    }));
  };

  const confirmDuplicateItem = () => {
    if (duplicateItem.index === null) return;

    const itemIndex = duplicateItem.index;
    const updatedItems = { ...data.items };

    // Dupliquer l'article le nombre de fois spécifié
    for (let i = 0; i < duplicateItem.count; i++) {
      Object.keys(updatedItems).forEach(key => {
        if (Array.isArray(updatedItems[key])) {
          updatedItems[key].push(updatedItems[key][itemIndex]);
        }
      });
    }

    setData({
      ...data,
      items: updatedItems
    });

    closeDuplicateModal();
  };
  // Fonction pour formater les nombres avec séparateurs de milliers (espaces) sans décimales
  const formatNumberWithSpaces = (numStr) => {
    if (!numStr) return "0";
    // Supprimer les espaces existants et remplacer les virgules par des points
    const cleaned = numStr.toString().replace(/\s/g, '').replace(',', '.');
    // Convertir en nombre et arrondir à l'entier
    const num = Math.round(parseFloat(cleaned));
    // Formater avec séparateurs de milliers sans décimales
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  // Fonction pour afficher/masquer l'aperçu et faire défiler la page si besoin
  const togglePreview = () => {
    const newState = !showPreview;
    setShowPreview(newState);

    // Défilement vers le bas seulement quand on affiche l'aperçu
    if (newState) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const moveItemUp = (index) => {
    if (index > 0) reorderItems(index, index - 1);
  };

  const moveItemDown = (index) => {
    if (index < data.items.Designation.length - 1) reorderItems(index, index + 1);
  };

  const reorderItems = (startIndex, endIndex) => {
    const updatedItems = { ...data.items };
    Object.keys(updatedItems).forEach(key => {
      if (Array.isArray(updatedItems[key])) {
        const [removed] = updatedItems[key].splice(startIndex, 1);
        updatedItems[key].splice(endIndex, 0, removed);
      }
    });

    setData({
      ...data,
      items: updatedItems
    });
  };

  return (
    <div className="dashboard-layoute">
      <div className="floating-buttons">
        <button
          className="floating-show-button"
          onClick={() => togglePreview()}
        >
          <FaEye className="button-icon" />
          <span className="button-text">Aperçu</span>
        </button>
        <button
          className="floating-back-button"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft className="button-icon" />
          <span className="button-text">Quitter</span>
        </button>
      </div>
      <Sidebar
        sidebarOpen={true}
        activeTab="factures"
        setActiveTab={() => { }}
        setSidebarOpen={() => { }}
      />

      <div className="container">
        <div className='pre-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="header">Création de {data.facture.Type?.[0] === "avoir" ? "Avoir" : data.facture.Type?.[0] === "devis" ? "Devis" : "Facture"}</h1>
          <h2>{currentUser?.name}</h2>
          <button
            className="button primary-button"
            onClick={togglePreview}  // Utilise la nouvelle fonction
          >
            <i className="fas fa-eye"></i> {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
          </button>
        </div>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Informations du client</h2>
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
              <div className="form-group">
                <label className="label">Client:</label>
                <select
                  className="select"
                  onChange={handleClientChange}
                  value={selectedClientId || (data.client?.Nom?.[0] ?
                    clients.find(c => c.nom === data.client.Nom[0])?.id || ""
                    : "")
                  }
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.nom} - {client.adresse} - {client.ville}
                    </option>
                  ))}
                </select>
              </div>

              {data.client?.Nom?.[0] && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--light-color)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '4px solid var(--primary-color)'
                }}>
                  <p><strong>Nom:</strong> {data.client.Nom[0]}</p>
                  <p><strong>Adresse:</strong> {data.client.Adresse?.[0] || 'N/A'}</p>
                  <p><strong>Ville:</strong> {data.client.Ville?.[0] || 'N/A'}</p>
                </div>
              )}


              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem'
              }}>
                <div className="form-group">
                  <label className="label">Numéro de facture:</label>
                  <input
                    className="input"
                    type="text"
                    value={data.facture.Numéro[0]}
                    onChange={(e) => setData({
                      ...data,
                      facture: {
                        ...data.facture,
                        Numéro: [e.target.value]
                      }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Date:</label>
                  <input
                    className="input"
                    type="date"
                    value={data.facture.Date[0]}
                    onChange={(e) => setData({
                      ...data,
                      facture: {
                        ...data.facture,
                        Date: [e.target.value]
                      }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Date d'échéance:</label>
                  <input
                    className="input"
                    type="date"
                    value={data.facture.DateEcheance[0]}
                    onChange={(e) => setData({
                      ...data,
                      facture: {
                        ...data.facture,
                        DateEcheance: [e.target.value]
                      }
                    })}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="section">
          <h2>Type de document</h2>

          {showClientInfo && (
            <>
              <div className="form-group">
                <select
                  className="select"
                  value={data.facture.Type?.[0] || "facture"}
                  onChange={async (e) => {
                    const newType = e.target.value;
                    try {
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
                  }}
                >
                  <option value="facture">Facture</option>
                  <option value="avoir">Avoir</option>
                  <option value="devis">Devis</option>
                </select>
              </div>
              <div className="section" style={{ marginTop: '2rem' }}>
                <h2>Objet de la facture</h2>
                <div className="form-group">
                  <input
                    type="text"
                    value={objet}
                    onChange={(e) => setObjet(e.target.value)}
                    placeholder="Objet de la facture"
                    className="input"
                  />

                </div>
                <div className="section" style={{ marginTop: '2rem' }}>
                  <h2>Banque(s) pour le paiement:</h2>
                  <div className="form-group">
                    <div className="rib-selector">
                      <label className="rib-option">
                        <input
                          type="checkbox"
                          className="rib-checkbox"
                          checked={selectedRibs.includes("CBAO")}
                          onChange={(e) => setSelectedRibs(
                            e.target.checked
                              ? [...selectedRibs, "CBAO"]
                              : selectedRibs.filter(rib => rib !== "CBAO")
                          )}
                        />
                        <span className="rib-checkmark"></span>
                        <span className="rib-label">CBAO</span>
                      </label>

                      <label className="rib-option">
                        <input
                          type="checkbox"
                          className="rib-checkbox"
                          checked={selectedRibs.includes("BIS")}
                          onChange={(e) => setSelectedRibs(
                            e.target.checked
                              ? [...selectedRibs, "BIS"]
                              : selectedRibs.filter(rib => rib !== "BIS")
                          )}
                        />
                        <span className="rib-checkmark"></span>
                        <span className="rib-label">BIS</span>
                      </label>
                    </div>
                  </div>
                  <div className="section" style={{ marginTop: '2rem' }}>
                    <h2>Options</h2>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <span className="checkbox-text-label">Inclure la signature</span>
                        <input
                          className="checkbox-label-input"
                          type="checkbox"
                          checked={showSignature}
                          onChange={(e) => setShowSignature(e.target.checked)}
                        />

                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="section">
          <h2>Ajouter un article</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            <div className="form-group">
              <label className="label">Désignation:</label>
              <input
                className="input"
                type="text"
                name="Designation"
                value={currentItem.Designation}
                onChange={handleItemChange}
                placeholder="Nom de l'article"
              />
            </div>
            <div className="form-group">
              <label className="label">Quantité:</label>
              <input
                className="input"
                type="number"
                name="Quantite"
                value={currentItem.Quantite}
                onChange={handleItemChange}
                placeholder="1"
                min="1"
                step="1"
              />
            </div>
            <div className="form-group">
              <label className="label">Prix Unitaire (HT):</label>
              <input
                className="input"
                type="text"
                name="Prix Unitaire"
                value={currentItem["Prix Unitaire"]}
                onChange={handleItemChange}
                placeholder="0 "
              />
            </div>

            <div className="form-group">
              <label className="label">TVA (%):</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="select"
                  name="TVA"
                  value={currentItem.TVA === 'custom' ? '' : currentItem.TVA}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setCurrentItem({
                        ...currentItem,
                        TVA: '' // Réinitialise la valeur pour l'input
                      });
                    } else {
                      handleItemChange(e);
                    }
                  }}
                  style={{
                    appearance: 'none',
                    paddingRight: '30px' // Espace pour l'icône
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

              {(currentItem.TVA === '' || !['0', '18', '20'].includes(currentItem.TVA)) && (
                <input
                  className="input"
                  type="number"
                  name="TVA"
                  value={currentItem.TVA}
                  onChange={handleItemChange}
                  placeholder="Saisir un taux personnalisé"
                  step="0.1"
                  min="0"
                  max="100"
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>
          </div>

          <button
            className="button success-button"
            onClick={addItem}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              maxWidth: '300px',
              marginLeft: '35%',
            }}
          >
            <i className="fas fa-plus"></i> {editingIndex !== null ? "Modifier l'article" : "Ajouter l'article"}
          </button>
          {editingIndex !== null && (
            <button
              className="button danger-button"
              onClick={() => {
                setCurrentItem({
                  Designation: "",
                  Quantite: "1",
                  "Prix Unitaire": "",
                  TVA: "0"
                });
                setEditingIndex(null);
              }}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                maxWidth: '300px',
                marginLeft: '1rem',
              }}
            >
              <i className="fas fa-times"></i> Annuler
            </button>
          )}
        </div>
        <div className="section">
          <h2>Articles ajoutés</h2>
          {data.items.Designation && data.items.Designation.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead className="thead-article">
                  <tr>
                    <th>Désignation</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th>TVA</th>
                    <th>Montant HT</th>
                    <th>Montant TVA</th>
                    <th>Prix Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.Designation.map((_, index) => (
                    <tr key={index}>
                      <td>{data.items.Designation[index]}</td>
                      <td>{formatNumberWithSpaces(data.items.Quantite[index])}</td>
                      <td>{formatNumberWithSpaces(data.items["Prix Unitaire"][index])} FCFA</td>
                      <td>{data.items.TVA[index]}</td>
                      <td>{formatNumberWithSpaces(data.items["Montant HT"][index])} FCFA</td>
                      <td>{formatNumberWithSpaces(data.items["Montant TVA"][index])} FCFA</td>
                      <td>{formatNumberWithSpaces(data.items["Prix Total"][index])} FCFA</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="button warning-button"
                            onClick={() => editItem(index)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            <i className="fas fa-edit"></i> Modifier
                          </button>

                          <button
                            className="button info-button"
                            onClick={() => openDuplicateModal(index)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            <i className="fas fa-copy"></i> Dupliquer
                          </button>

                          <button
                            className="button danger-button"
                            onClick={() => removeItem(index)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            <i className="fas fa-trash"></i> Supprimer
                          </button>

                          {/* Boutons de déplacement */}
                          <div className="move-buttons-group">
                            <button
                              className="move-button move-up"
                              onClick={() => moveItemUp(index)}
                              disabled={index === 0}
                              aria-label="Déplacer vers le haut"
                            >
                              <FaArrowUp />
                            </button>
                            <button
                              className="move-button move-down"
                              onClick={() => moveItemDown(index)}
                              disabled={index === data.items.Designation.length - 1}
                              aria-label="Déplacer vers le bas"
                            >
                              <FaArrowDown />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <img src={empty} alt="Aucun document" className="empty-image" />
            </div>
          )}
        </div>

        <div className="preview-container">
          <div className="button-group">
            <button
              className="button primary-button"
              onClick={togglePreview}  // Utilise la nouvelle fonction
            >
              <i className="fas fa-eye"></i> {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
            </button>

            <button
              className="button success-button"
              onClick={() => handleSave(
                {
                  ...data,
                  clientId: selectedClientId,
                  ribs: selectedRibs,
                  objet: objet,
                  showSignature: showSignature
                },
                location && location.state && location.state.facture && location.state.facture.id ? true : false
              )}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Enregistrement...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Enregistrer
                </>
              )}
            </button>


            {/* Bouton TÉLÉCHARGER */}
            {isSaved ? (
              <PDFDownloadLink
                document={<InvoicePDF data={data} ribType={selectedRibs} objet={objet} showSignature={showSignature} />}
                fileName={`facture_${data.facture.Numéro[0]}.pdf`}
                className="button success-button"
              >
                {({ loading: pdfLoading }) =>
                  pdfLoading
                    ? <><i className="fas fa-spinner fa-spin"></i> Génération...</>
                    : <><i className="fas fa-file-download"></i> Télécharger</>
                }
              </PDFDownloadLink>

            ) : (
              <button className="button info-button " disabled>
                <i className="fas fa-download"></i> Télécharger
              </button>
            )}
          </div>

          {showPreview && (
            <DynamicPDFViewer
              width="100%"
              height="800px"
              style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
            >
              <InvoicePDF data={data} ribType={selectedRibs} objet={objet} showSignature={showSignature} />
            </DynamicPDFViewer>
          )}
        </div>
      </div>
      {/* Modal de duplication */}
      {duplicateItem.showModal && (
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
                value={duplicateItem.count}
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
const Fact = () => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const location = useLocation();
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedRibs, setSelectedRibs] = useState([]);
  const [objet, setObjet] = useState("");
  const [showSignature, setShowSignature] = useState(true);
  // Initialisation des données
  const [data, setData] = useState({
    facture: {
      Numéro: ["Chargement..."],
      Date: [new Date().toISOString().split('T')[0]],
      DateEcheance: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
      Type: ["facture"]
    },
    client: {
      Nom: [],
      Adresse: []
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

  // Chargement initial des données
  useEffect(() => {
    const initializeData = async () => {
      const documentType = location.state?.type || "facture";

      if (location.state && location.state.facture) {
        const transformedData = invoiceService.transformFactureData(location.state.facture);
        setData(transformedData);
        setSelectedClientId(location.state.facture.clientId || "");
        setSelectedRibs(location.state.facture.ribs || []);
        setObjet(location.state.facture.objet || "");
        setShowSignature(location.state.facture.showSignature !== false);
        setLoadingData(false);
        return;
      }

      const initialClient = location.state?.client
        ? {
          Nom: [location.state.client.nom || ""],
          Adresse: [location.state.client.adresse || ""],
          Ville: [location.state.client.ville || ""] // Ajout de la ville
        }
        : { Nom: [], Adresse: [], Ville: [] };

      try {
        const invoiceNumber = await invoiceService.generateInvoiceNumber(
          currentUser.companyId,
          new Date(),
          documentType
        );

        setData(prev => ({
          ...prev,
          facture: {
            ...prev.facture,
            Numéro: [invoiceNumber],
            Type: [documentType]
          },
          client: initialClient
        }));
      } catch (error) {
        console.error("Erreur initialisation:", error);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        setData(prev => ({
          ...prev,
          facture: {
            ...prev.facture,
            Numéro: [`F-${year}${month}-TEMP`]
          }
        }));
      } finally {
        setLoadingData(false);
      }
    };

    initializeData();
  }, [location.state, currentUser?.companyId]);

  // Chargement des clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!currentUser?.companyId) return;

      try {
        const clientsRef = collection(db, `companies/${currentUser.companyId}/clients`);
        const q = query(clientsRef);
        const querySnapshot = await getDocs(q);

        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setClients(clientsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching clients: ", error);
        setLoading(false);
      }
    };

    fetchClients();
  }, [currentUser]);

  // Sauvegarde de la facture
  const saveInvoiceToFirestore = async (completeData) => {
    if (!currentUser?.companyId) {
      throw new Error("Company ID not available");
    }

    const invoiceData = invoiceService.prepareInvoiceData(completeData);

    if (location.state && location.state.facture && location.state.facture.id) {
      return invoiceService.updateInvoice(
        currentUser.companyId,
        location.state.facture.id,
        invoiceData
      );
    } else {
      return invoiceService.addInvoice(
        currentUser.companyId,
        currentUser.uid,
        invoiceData
      );
    }
  };
  const handleSave = async (completeData, isUpdate = false) => {
    if (isSaved && !isUpdate) {
      alert("Cette facture est déjà enregistrée. Créez une nouvelle facture si nécessaire.");
      return;
    }

    if (!completeData.client.Nom[0] || completeData.items.Designation.length === 0) {
      alert("Veuillez sélectionner un client et ajouter au moins un article");
      return;
    }

    try {
      setIsSaving(true);
      await saveInvoiceToFirestore(completeData, isUpdate);
      setIsSaved(true);

      alert(
        `${completeData.facture.Type[0] === "avoir" ? "Avoir" : completeData.facture.Type?.[0] === "devis" ? "Devis" : "Facture"} ` +
        `${isUpdate ? 'modifié(e)' : 'enregistré(e)'} avec succès !`
      );
    } catch (error) {
      console.error("Erreur d'enregistrement :", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };


  // Gestion du changement de date
  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    try {
      const newNumber = await invoiceService.generateInvoiceNumber(
        currentUser.companyId,
        new Date(newDate),
        data.facture.Type[0]
      );

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

  if (!currentUser) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Veuillez vous connecter pour accéder à cette page</p>
      </div>
    );
  }

  if (loading || loadingData) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#2c3e50',
          fontSize: '18px',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif',
          backgroundColor: '#ecf0f1',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          margin: '40px auto',
          marginTop: '15%',
          maxWidth: '400px'
        }}
      >
        <div
          style={{
            fontSize: '30px',
            marginBottom: '10px',
            animation: 'spin 1.5s linear infinite',
            display: 'inline-block'
          }}
        >
          ⏳
        </div>
        <div>Chargement...</div>

        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--light-color)', minHeight: '100vh' }}>
      <InvoiceForm
        data={data}
        setData={setData}
        clients={clients}
        handleSave={handleSave}
        isSaving={isSaving}
        isSaved={isSaved}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        handleDateChange={handleDateChange}
        generateInvoiceNumber={(date, type) =>
          invoiceService.generateInvoiceNumber(currentUser.companyId, date, type)
        }
        // Ajoutez ces nouvelles props :
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        selectedRibs={selectedRibs}
        setSelectedRibs={setSelectedRibs}
        objet={objet}
        setObjet={setObjet}
        showSignature={showSignature}
        setShowSignature={setShowSignature}
        location={location}
      />
    </div>
  );
};

export default Fact;
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Page, Text, View, Document, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { pdfStyles } from './styles/pdfStyles';
import './css/Fact.css';
import Sidebar from "./Sidebar";
import { useAuth } from './auth/AuthContext';
import { Image } from '@react-pdf/renderer';
import n2words from 'n2words';


// Composant InvoicePDF (inchangé)
const InvoicePDF = ({ data, ribType = "CBAO", objet }) => {
  const ribData = {
    CBAO: {
      banque: "CBAO",
      rib: "SN08 00801 023010100001 23",
    },
    BIS: {
      banque: "BIS",
      rib: "SN08 01010 023010100002 34",
    }
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.companyInfo}>
            {/* Logo de l'entreprise */}
            <Image
              style={pdfStyles.logo}
              src="./Logo_LIS.png" // ou une URL si le logo est accessible en ligne
            />
            {/* <Text style={pdfStyles.companyName}>VOTRE ENTREPRISE</Text> */}
          </View>


          <View style={pdfStyles.invoiceTitleContainer}>
            <Text style={pdfStyles.invoiceTitle}>
              {data.facture.Type?.[0]?.toUpperCase() || "FACTURE"}
            </Text>
          </View>
        </View>


        <View style={{ marginTop: -20, alignItems: 'flex-end' }}>
          {/*<Text style={pdfStyles.sectionTitle}>Informations facture</Text> */}
          <View style={{ padding: 10, marginTop: -70 }}>
            <Text style={{ marginBottom: 5, fontSize: 25, color: '#2c3e50', fontWeight: 'bold' }}>
              {data.facture.Numéro[0]}
            </Text>
            <Text>
              <Text style={{ fontWeight: 'bold' }}>Date:</Text> {new Date(data.facture.Date[0]).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
            <View>
              <Text style={{ marginBottom: 5 }}>{data.client?.Nom?.[0] || "Non spécifié"}</Text>
              <Text>{data.client?.Adresse?.[0] || "Non spécifié"}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={pdfStyles.sectionTitle}>Total TTC</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
                {data.totals?.["Total TTC"]?.[0] || "0,00"} XOF
              </Text>
            </View>
          </View>
        </View>


        <View style={{ marginTop: 20 }}>
          <Text style={pdfStyles.sectionTitle}>Objet : {objet || "Non spécifié"}</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={pdfStyles.sectionTitle}>Cher client </Text>
          <View style={{ marginTop: 10 }}>
            {/* En-tête du tableau */}
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableHeader, { width: '40%' }]}>Désignation</Text>
              <Text style={[pdfStyles.tableHeader, { width: '10%', textAlign: 'right' }]}>QTE</Text>
              <Text style={[pdfStyles.tableHeader, { width: '19%', textAlign: 'right' }]}>PU HT</Text>
              <Text style={[pdfStyles.tableHeader, { width: '8%', textAlign: 'right' }]}>TVA </Text>
              <Text style={[pdfStyles.tableHeader, { width: '23%', textAlign: 'right' }]}>PT HT</Text>
            </View>


            {/* Lignes des articles */}
            {data.items.Designation?.map((designation, index) => (
              <View key={index} style={pdfStyles.tableRow_1}>
                <Text style={{ width: '40%' }}>{designation}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>{data.items.Quantite[index]}</Text>
                <Text style={{ width: '19%', textAlign: 'right' }}>{data.items["Prix Unitaire"][index]} </Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{data.items.TVA[index]}</Text>
                <Text style={{ width: '23%', textAlign: 'right' }}>{data.items["Prix Total"][index]} </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totaux alignés à droite */}
        <View style={[pdfStyles.totalsContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>

          {/* Bloc Notes à gauche */}
          <View style={{ maxWidth: '60%', marginTop: '30%' }}>
            <Text style={{ fontSize: 12, marginBottom: 4, color: 'green' }}>Arrêtée la présente facture à la somme de </Text>
            <Text style={{ fontSize: 10 }}>
              {n2words(Number(data.totals?.["Total TTC"]?.[0]?.replace(',', '.')) || 0, { lang: 'fr' })} francs cfa
            </Text>

            <Text style={{ fontSize: 12, marginTop: '5%', color: 'green' }}>Notes</Text>
            <Text style={{ fontSize: 10 }}>Nous vous remercions de votre confiance</Text>
          </View>

          {/* Bloc Totaux à droite */}
          <View style={{ width: '50%', backgroundColor: '#f0f8ff', borderRadius: 4, padding: 10 }}>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Total HT</Text>
              <Text style={pdfStyles.totalValue}>{data.totals?.["Total HT"]?.[0] || "0,00"} </Text>
            </View>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>TVA (EXO)</Text>
              <Text style={pdfStyles.totalValue}>{data.totals?.["Total TVA"]?.[0] || "0,00"} </Text>
            </View>
            <View style={[pdfStyles.totalRow, { paddingTop: 5 }]}>
              <Text style={[pdfStyles.totalLabel, { fontWeight: 'bold' }]}>Montant NET TTC (XOF)</Text>
              <Text style={[pdfStyles.totalValue_1, { fontWeight: 'bold' }]}>
                {data.totals?.["Total TTC"]?.[0] || "0,00"}
              </Text>
            </View>
          </View>

        </View>


        <View style={pdfStyles.footer}>
          <Text>LEADER INTERIM ET SERVICES</Text>
          <Text>Ouest Foire rte de l'aéroport</Text>
          <Text>RC:SN 2015 B24288; NINEA: 0057262212 A2</Text>
          <View style={{ marginTop: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>RIB {ribData[ribType].banque}: {ribData[ribType].rib}</Text>
          </View>
          <Text>Téléphone: 338208846 - Email: infos@leaderinterime.com</Text>
        </View>
      </Page>
    </Document>
  );
};

// Composant InvoiceForm (inchangé)
const InvoiceForm = ({ data, setData, clients, saveInvoiceToFirestore, handleSave, isSaving, isSaved, showPreview, setShowPreview, generateInvoiceNumber }) => {
  const [currentItem, setCurrentItem] = useState({
    Designation: "",
    Quantite: "",
    "Prix Unitaire": "",
    TVA: "20"
  });
  const [selectedRib, setSelectedRib] = useState("CBAO");
  const [objet, setObjet] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");


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
    Object.keys(newItem).forEach(key => {
      if (!updatedItems[key]) updatedItems[key] = [];
      updatedItems[key].push(newItem[key]);
    });

    setData({
      ...data,
      items: updatedItems
    });

    setCurrentItem({
      Designation: "",
      Quantite: "",
      "Prix Unitaire": "",
      TVA: "20"
    });
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

  return (
    <div className="dashboard-layoute">
      <Sidebar
        sidebarOpen={true}
        activeTab="factures"
        setActiveTab={() => { }}
        setSidebarOpen={() => { }}
      />

      <div className="container">
        <h1 className="header">Création de {data.facture.Type?.[0] === "avoir" ? "Avoir" : data.facture.Type?.[0] === "devis" ? "Devis" : "Facture"}</h1>

        <div className="section">
          <h2>Informations du client</h2>


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
                  {client.nom} - {client.adresse}
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
              <p><strong>Adresse:</strong> {data.client.Adresse[0]}</p>
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
          </div>
        </div>
        <div className="section">

          <h2>Type de document</h2>
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
              <h2>Coordonnées Bancaires</h2>
              <div className="form-group">
                <label className="label">Banque pour le paiement:</label>
                <select
                  value={selectedRib}
                  onChange={(e) => setSelectedRib(e.target.value)}
                  className="select"
                >
                  <option value="CBAO">CBAO</option>
                  <option value="BIS">BIS</option>
                </select>
              </div>
            </div>
          </div>

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
                placeholder="0,00"
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
                  <option value="5.5">5.5%</option>
                  <option value="10">10%</option>
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

              {(currentItem.TVA === '' || !['0', '5.5', '10', '20'].includes(currentItem.TVA)) && (
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
            <i className="fas fa-plus"></i> Ajouter l'article
          </button>
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
                      <td>{data.items.Quantite[index]}</td>
                      <td>{data.items["Prix Unitaire"][index]}FCFA</td>
                      <td>{data.items.TVA[index]}</td>
                      <td>{data.items["Montant HT"]?.[index] || "0,00"}FCFA</td>
                      <td>{data.items["Montant TVA"]?.[index] || "0,00"}FCFA</td>
                      <td>{data.items["Prix Total"][index]}FCFA</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="button danger-button"
                            onClick={() => removeItem(index)}
                          >
                            <i className="fas fa-trash"></i> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="totals-table">
                <tbody>
                  <tr>
                    <td>Total HT:</td>
                    <td>{data.totals?.["Total HT"]?.[0] || "0,00"}FCFA</td>
                  </tr>
                  <tr>
                    <td>Total TVA:</td>
                    <td>{data.totals?.["Total TVA"]?.[0] || "0,00"}FCFA</td>
                  </tr>
                  <tr>
                    <td>Total TTC:</td>
                    <td>{data.totals?.["Total TTC"]?.[0] || "0,00"}FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              Aucun article ajouté à la facture
            </div>
          )}
        </div>

        <div className="preview-container">
          <div className="button-group">
            <button
              className="button primary-button"
              onClick={() => setShowPreview(!showPreview)}
            >
              <i className="fas fa-eye"></i> {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
            </button>

            <button
              className="button success-button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
              ) : (
                <><i className="fas fa-save"></i> Enregistrer</>
              )}
            </button>

            {/* Bouton TÉLÉCHARGER */}
            {isSaved ? (
              <PDFDownloadLink
                document={<InvoicePDF data={data} />}
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
            <PDFViewer
              width="100%"
              height="800px"
              style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
            >
              <InvoicePDF data={data} ribType={selectedRib} objet={objet} />
            </PDFViewer>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant principal Fact
const Fact = () => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const location = useLocation();

  // Fonction pour générer le numéro de facture séquentiel
  const generateInvoiceNumber = useCallback(
    async (date = new Date(), type = "facture") => {
      if (!currentUser?.companyId) return `${type}-TEMP`;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      let typePrefix;
      switch (type) {
        case "avoir": typePrefix = "AV"; break;
        case "devis": typePrefix = "D"; break;
        default: typePrefix = "F";
      }

      const prefix = `${typePrefix}-${year}${month}`;

      try {
        const facturesRef = collection(db, `companies/${currentUser.companyId}/factures`);
        const q = query(facturesRef, orderBy("numero", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        let maxNumber = 0;
        querySnapshot.forEach(doc => {
          const numero = doc.data().numero;
          const match = numero.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        });

        return `${prefix}-${maxNumber + 1}`;
      } catch (error) {
        console.error("Erreur génération numéro:", error);
        return `${prefix}-1`;
      }
    },
    [currentUser?.companyId]
  );

  // Fonction pour transformer les données de Firebase
  const transformFactureData = (facture) => {
    if (!facture) return null;

    const items = {
      Designation: [],
      Quantite: [],
      "Prix Unitaire": [],
      TVA: [],
      "Montant HT": [],
      "Montant TVA": [],
      "Prix Total": []
    };

    if (facture.items && facture.items.length > 0) {
      facture.items.forEach(item => {
        items.Designation.push(item.designation);
        items.Quantite.push(item.quantite);
        items["Prix Unitaire"].push(item.prixUnitaire);
        items.TVA.push(item.tva);
        items["Montant HT"].push(item.montantHT);
        items["Montant TVA"].push(item.montantTVA);
        items["Prix Total"].push(item.prixTotal);
      });
    }

    return {
      facture: {
        Numéro: [facture.numero || ""],
        Date: [facture.date || new Date().toISOString().split('T')[0]],
        Type: [facture.type || "facture"]
      },
      client: {
        Nom: [facture.clientNom || ""],
        Adresse: [facture.clientAdresse || ""]
      },
      items: items,
      totals: {
        "Total HT": [facture.totalHT || "0,00"],
        "Total TVA": [facture.totalTVA || "0,00"],
        "Total TTC": [facture.totalTTC || "0,00"]
      }
    };
  };

  // Initialisation des données
  const [data, setData] = useState({
    facture: {
      Numéro: ["Chargement..."],
      Date: [new Date().toISOString().split('T')[0]],
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
        setData(transformFactureData(location.state.facture));
        setLoadingData(false);
        return;
      }

      const initialClient = location.state?.client
        ? {
          Nom: [location.state.client.nom || ""],
          Adresse: [location.state.client.adresse || ""]
        }
        : { Nom: [], Adresse: [] };

      try {
        const invoiceNumber = await generateInvoiceNumber(new Date(), documentType);
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
  }, [location.state, currentUser?.companyId, generateInvoiceNumber]);

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
  const saveInvoiceToFirestore = async () => {
    if (!currentUser?.companyId) {
      throw new Error("Company ID not available");
    }

    try {
      const invoiceData = {
        numero: data.facture.Numéro[0],
        date: data.facture.Date[0],
        type: data.facture.Type[0],
        clientId: clients.find(c => c.nom === data.client.Nom[0])?.id || null,
        clientNom: data.client.Nom[0],
        clientAdresse: data.client.Adresse[0],
        items: data.items.Designation.map((_, index) => ({
          designation: data.items.Designation[index],
          quantite: data.items.Quantite[index],
          prixUnitaire: data.items["Prix Unitaire"][index],
          tva: data.items.TVA[index],
          montantHT: data.items["Montant HT"]?.[index] || "0,00",
          montantTVA: data.items["Montant TVA"]?.[index] || "0,00",
          prixTotal: data.items["Prix Total"][index]
        })),
        totalHT: data.totals["Total HT"][0],
        totalTVA: data.totals["Total TVA"][0],
        totalTTC: data.totals["Total TTC"][0],
        createdAt: new Date().toISOString(),
        statut: "en attente",
        userId: currentUser.uid,
        companyId: currentUser.companyId
      };

      let docId;
      if (location.state && location.state.facture && location.state.facture.id) {
        const factureRef = doc(db, `companies/${currentUser.companyId}/factures`, location.state.facture.id);
        await updateDoc(factureRef, invoiceData);
        docId = location.state.facture.id;
      } else {
        const facturesRef = collection(db, `companies/${currentUser.companyId}/factures`);
        const docRef = await addDoc(facturesRef, invoiceData);
        docId = docRef.id;
      }

      return docId;
    } catch (error) {
      throw error;
    }
  };
  const handleSave = async () => {
    if (!data.client.Nom[0] || data.items.Designation.length === 0) {
      alert("Veuillez sélectionner un client et ajouter au moins un article");
      return;
    }

    try {
      setIsSaving(true);
      await saveInvoiceToFirestore();
      setIsSaved(true);
      alert(`${data.facture.Type[0] === "avoir" ? "Avoir" : data.facture.Type?.[0] === "devis" ? "Devis" : "Facture"} ${location.state && location.state.facture ? 'modifié(e)' : 'enregistré(e)'} avec succès !`);
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
      const newNumber = await generateInvoiceNumber(new Date(newDate));
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
        saveInvoiceToFirestore={saveInvoiceToFirestore}
        handleSave={handleSave}
        isSaving={isSaving}
        isSaved={isSaved}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        handleDateChange={handleDateChange}
        generateInvoiceNumber={generateInvoiceNumber}
      />
    </div>
  );
};

export default Fact;
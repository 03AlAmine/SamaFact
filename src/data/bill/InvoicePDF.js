import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import n2words from 'n2words';
import sign from '../../assets/sign.png';
import { createPdfStyles } from './styles/pdfStyles';
import defaultLogo from '../../assets/LIS.png'; // Logo par défaut

const InvoicePDF = ({
  data,
  ribType = ["CBAO"],
  objet,
  showSignature = true,
  companyInfo = {
    name: "Mon Entreprise",
    rcNumber: "",
    ninea: "",
    address: "",
    region: "",
    country: "",
    phone: "",
    email: "",
    ribCBAO: "",
    ribBIS: "",
    ribOther1: "",
    ribOther1Label: "",
    ribOther2: "",
    ribOther2Label: "",
    invoiceColor: "#218838",
    logoFileName: ""
  }
}) => {
  // VÉRIFICATION DE SÉCURITÉ - Si data est null ou undefined
  if (!data) {
    return (
      <Document>
        <Page size="A4">
          <Text>Document non disponible</Text>
        </Page>
      </Document>
    );
  }

  // Fonction pour charger le logo de l'entreprise
  const getCompanyLogo = () => {
    if (!companyInfo.logoFileName) {
      return defaultLogo;
    }

    try {
      // Essayer de charger le logo spécifique
      const logo = require(`../../assets/logos/${companyInfo.logoFileName}`);
      return logo;
    } catch (error) {
      console.warn(`Logo ${companyInfo.logoFileName} non trouvé, utilisation du logo par défaut`);
      return defaultLogo;
    }
  };

  // Logo de l'entreprise
  const companyLogo = getCompanyLogo();

  // Créez les styles dynamiques AVEC la couleur de l'entreprise
  const pdfStyles = createPdfStyles(companyInfo.invoiceColor || "#218838");

  // Créez dynamiquement ribData à partir de companyInfo
  const ribData = {
    CBAO: companyInfo.ribCBAO ? {
      banque: "CBAO",
      rib: companyInfo.ribCBAO
    } : null,
    BIS: companyInfo.ribBIS ? {
      banque: "BIS",
      rib: companyInfo.ribBIS
    } : null,
    OTHER1: (companyInfo.ribOther1 && companyInfo.ribOther1Label) ? {
      banque: companyInfo.ribOther1Label,
      rib: companyInfo.ribOther1
    } : null,
    OTHER2: (companyInfo.ribOther2 && companyInfo.ribOther2Label) ? {
      banque: companyInfo.ribOther2Label,
      rib: companyInfo.ribOther2
    } : null
  };

  const formatNumber = (numStr) => {
    if (!numStr) return "0";
    const cleaned = numStr.toString().replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const splitItemsIntoPages = (items) => {
    // Vérification de sécurité améliorée
    if (!items || typeof items !== 'object') {
      console.warn("Items data is missing or invalid:", items);
      return [{
        Designation: [],
        Quantite: [],
        "Prix Unitaire": [],
        TVA: [],
        "Prix Total": []
      }];
    }
    const safeItems = {
      Designation: items.Designation || [],
      Quantite: items.Quantite || [],
      "Prix Unitaire": items["Prix Unitaire"] || [],
      TVA: items.TVA || [],
      "Prix Total": items["Prix Total"] || []
    };

    const itemsPerPage = 12;
    const totalItems = safeItems.Designation.length;

    if (totalItems <= itemsPerPage) {
      return [safeItems];
    }

    const pages = [];
    const fullPagesCount = Math.floor(totalItems / itemsPerPage);

    for (let i = 0; i < fullPagesCount * itemsPerPage; i += itemsPerPage) {
      const pageItems = {
        Designation: safeItems.Designation.slice(i, i + itemsPerPage),
        Quantite: safeItems.Quantite?.slice(i, i + itemsPerPage) || [],
        "Prix Unitaire": safeItems["Prix Unitaire"]?.slice(i, i + itemsPerPage) || [],
        TVA: safeItems.TVA?.slice(i, i + itemsPerPage) || [],
        "Prix Total": safeItems["Prix Total"]?.slice(i, i + itemsPerPage) || [],
      };
      pages.push(pageItems);
    }

    const remaining = totalItems % itemsPerPage;
    if (remaining > 0) {
      const start = fullPagesCount * itemsPerPage;
      const pageItems = {
        Designation: safeItems.Designation.slice(start),
        Quantite: safeItems.Quantite?.slice(start) || [],
        "Prix Unitaire": safeItems["Prix Unitaire"]?.slice(start) || [],
        TVA: safeItems.TVA?.slice(start) || [],
        "Prix Total": safeItems["Prix Total"]?.slice(start) || [],
      };
      pages.push(pageItems);
    }

    return pages;
  };

  const itemPages = splitItemsIntoPages(data.items);
  const isMultiPage = itemPages.length > 1;
  const lastPageItems = itemPages[itemPages.length - 1];
  const showTotalsOnSeparatePage = lastPageItems.Designation.length > 9;

  const formatDesignation = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Puis utilisez-la dans le rendu :
  const renderMainPage = (pageItems, pageIndex) => (
    <Page key={pageIndex} size="A4" style={pdfStyles.page}>
      {/* Filigrane/background */}
      <Image
        style={pdfStyles.watermark}
        src={companyLogo}
      />

      {/* En-tête */}
      <View style={pdfStyles.header}>
        <View style={pdfStyles.head}>
          <Image style={pdfStyles.logo} src={companyLogo} />

          {/* Nom de l'entreprise avec couleur du thème */}
          <Text style={pdfStyles.companyName}>
            {companyInfo.name || "Nom de l'entreprise"}
          </Text>
          {/* Ligne 1: Adresse */}
          {companyInfo.address && (
            <Text style={pdfStyles.address}>{companyInfo.address}</Text>
          )}

          {/* Ligne 2: Région, Pays */}
          <Text style={pdfStyles.address}>
            {companyInfo.region || "Dakar"}, {companyInfo.country || "Sénégal"}
          </Text>
        </View>

        <View style={pdfStyles.invoiceTitleContainer}>
          <Text style={pdfStyles.invoiceTitle}>
            {data.facture.Type?.[0]?.toUpperCase() || "FACTURE"}
          </Text>
        </View>
      </View>
      {/* Infos facture */}
      <View style={pdfStyles.invoiceInfo}>
        <Text style={pdfStyles.invoiceNumber}>{data.facture.Numéro[0]}</Text>
        <Text>Date: {new Date(data.facture.Date[0]).toLocaleDateString('fr-FR')}</Text>
        <Text>Échéance: {new Date(data.facture.DateEcheance[0]).toLocaleDateString('fr-FR')}</Text>
      </View>
      {/* Client et total */}
      <View style={pdfStyles.clientInfo}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '60%' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{data.client?.Nom?.[0] || "Non spécifié"}</Text>
            <Text style={{ marginBottom: 3 }}>{data.client?.Adresse?.[0] || "Non spécifié"}</Text>
            <Text >{data.client?.Ville?.[0] || "Non spécifié"}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...pdfStyles.sectionTitle, marginBottom: 5 }}>Total TTC</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#4a6da7' }}>
              {formatNumber(data.totals?.["Total TTC"]?.[0])} XOF
            </Text>
          </View>
        </View>
      </View>
      {/* Objet */}
      <View style={{ marginBottom: 10 }}>
        <Text style={pdfStyles.sectionTitle}>Objet: <Text style={pdfStyles.subject}>{objet || "Non spécifié"}</Text>
        </Text>
      </View>
      {/* Objet */}
      <View >
        {pageIndex === 0 && (
          <Text style={pdfStyles.clientGreeting}>Cher client,</Text>
        )}
      </View>
      {/* Tableau des articles */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={{ width: '40%' }}>Désignation</Text>
          <Text style={{ width: '10%', textAlign: 'right' }}>Qté</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>PU HT</Text>
          <Text style={{ width: '10%', textAlign: 'right' }}>TVA</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>PT HT</Text>
        </View>

        {pageItems.Designation?.map((designation, index) => (
          <View
            key={`${pageIndex}-${index}`}
            style={[
              pdfStyles.tableRow,
              index % 2 === 1 && pdfStyles.tableRowAlt // Utilisez tableRowAlt pour les lignes paires
            ]}
          >
            <Text style={{ width: '40%' }}>{formatDesignation(designation)}</Text>
            <Text style={{ width: '10%', textAlign: 'right' }}>{formatNumber(pageItems.Quantite[index])}</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>{formatNumber(pageItems["Prix Unitaire"][index])}</Text>
            <Text style={{ width: '10%', textAlign: 'right' }}>{formatNumber(pageItems.TVA[index])}%</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>{formatNumber(pageItems["Prix Total"][index])}</Text>
          </View>
        ))}
      </View>
      {/* Totaux sur la même page si peu d'articles */}
      {pageIndex === itemPages.length - 1 && !showTotalsOnSeparatePage && (
        <>
          <View style={pdfStyles.totalsContainer}>
            <View style={pdfStyles.legalText}>
              <Text style={pdfStyles.amountInWords}>
                Arrêtée la présente facture à la somme de : {'\n'}
                <Text style={{ color: 'black', fontSize: 11 }}>
                  {n2words(Math.round(Number(data.totals?.["Total TTC"]?.[0]?.replace(/\s/g, '').replace(',', '.')) || 0), { lang: 'fr' })} francs CFA
                </Text>
              </Text>
              <Text style={pdfStyles.notes}>
                Notes:{'\n'}
                <Text style={{ color: 'black', fontSize: 11 }}>
                  Nous vous remercions de votre confiance.
                </Text>
              </Text>
            </View>

            <View style={pdfStyles.totalsBox}>
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Total HT:</Text>
                <Text style={pdfStyles.totalValue}>{formatNumber(data.totals?.["Total HT"]?.[0])} XOF</Text>
              </View>
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>TVA:</Text>
                <Text style={pdfStyles.totalValue}>{formatNumber(data.totals?.["Total TVA"]?.[0])} XOF</Text>
              </View>
              <View style={[pdfStyles.totalRow, pdfStyles.grandTotal]}>
                <Text style={[pdfStyles.totalLabel, { color: '#4a6da7', fontSize: 12 }]}>Total TTC:</Text>
                <Text style={[pdfStyles.totalValue, { color: '#4a6da7', fontWeight: 'bold', fontSize: 14 }]}>
                  {formatNumber(data.totals?.["Total TTC"]?.[0])} XOF
                </Text>
              </View>
            </View>
          </View>
          {showSignature && (
            <View style={pdfStyles.signatureContainer}>
              <Image
                style={pdfStyles.signatureImage}
                src={sign} alt="Aucune signature"
              />
            </View>
          )}
        </>

      )}


      {/* Pied de page */}
      <View style={pdfStyles.footer}>
        <View style={pdfStyles.footerLine} />

        {/* Ligne 1: Nom de l'entreprise */}
        <Text style={pdfStyles.footerBold}>{companyInfo.name || "Nom de l'entreprise"}</Text>

        {/* Ligne 2: RC et NINEA sur la même ligne */}
        {(companyInfo.rcNumber || companyInfo.ninea) && (
          <Text>
            {companyInfo.rcNumber && `RC: ${companyInfo.rcNumber}`}
            {companyInfo.rcNumber && companyInfo.ninea && " | "}
            {companyInfo.ninea && `NINEA: ${companyInfo.ninea}`}
          </Text>
        )}

        {/* Ligne 3: RIB CBAO (seulement si sélectionné et configuré) */}
        {ribType.includes("CBAO") && ribData.CBAO && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.CBAO.banque}:</Text> {ribData.CBAO.rib}
          </Text>
        )}

        {/* Ligne 4: RIB BIS (seulement si sélectionné et configuré) */}
        {ribType.includes("BIS") && ribData.BIS && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.BIS.banque}:</Text> {ribData.BIS.rib}
          </Text>
        )}

        {/* Autres RIBs - sur des lignes séparées */}
        {ribData.OTHER1 && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.OTHER1.banque}:</Text> {ribData.OTHER1.rib}
          </Text>
        )}

        {ribData.OTHER2 && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.OTHER2.banque}:</Text> {ribData.OTHER2.rib}
          </Text>
        )}

        {/* Dernière ligne: Téléphone et Email */}
        {(companyInfo.phone || companyInfo.email) && (
          <Text>
            {companyInfo.phone && `Téléphone: ${companyInfo.phone}`}
            {companyInfo.phone && companyInfo.email && " | "}
            {companyInfo.email && `Email: ${companyInfo.email}`}
          </Text>
        )}
      </View>
      {/* Numéro de page */}
      {isMultiPage && (
        <Text style={pdfStyles.pageNumber}>
          Page {pageIndex + 1} sur {itemPages.length + (showTotalsOnSeparatePage ? 1 : 0)}
        </Text>
      )}
    </Page>
  );

  const renderTotalsPage = () => (
    <Page size="A4" style={pdfStyles.page}>
      {/* Filigrane/background */}
      <Image
        style={pdfStyles.watermark}
        src={companyLogo}
      />
      {/* En-tête */}
      <View style={pdfStyles.header}>
        <View>
          <Image style={pdfStyles.logo} src="./NCS.png" />
          <Text style={pdfStyles.address}>
            {companyInfo.address || "Ouest Foire, Route de l'Aéroport"} {'\n'}
            <Text>Dakar, Sénégal</Text>
          </Text>
        </View>
        <View style={pdfStyles.invoiceTitleContainer}>
          <Text style={pdfStyles.invoiceTitle}>
            {data.facture.Type?.[0]?.toUpperCase() || "FACTURE"}
          </Text>
        </View>
      </View>

      {/* Infos facture */}
      <View style={pdfStyles.invoiceInfo}>
        <Text style={pdfStyles.invoiceNumber}>{data.facture.Numéro[0]}</Text>
        <Text>Date: {new Date(data.facture.Date[0]).toLocaleDateString('fr-FR')}</Text>
        <Text>Échéance: {new Date(data.facture.DateEcheance[0]).toLocaleDateString('fr-FR')}</Text>
      </View>

      {/* Client et total */}
      <View style={pdfStyles.clientInfo}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '60%' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{data.client?.Nom?.[0] || "Non spécifié"}</Text>
            <Text >{data.client?.Adresse?.[0] || "Non spécifié"}</Text>
            <Text >{data.client?.Ville?.[0] || "Non spécifié"}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...pdfStyles.sectionTitle, marginBottom: 5 }}>Total TTC</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#4a6da7' }}>
              {formatNumber(data.totals?.["Total TTC"]?.[0])} XOF
            </Text>
          </View>
        </View>
      </View>

      {/* Objet */}
      <View style={{ marginBottom: 15 }}>
        <Text style={pdfStyles.sectionTitle}>Objet</Text>
        <Text style={pdfStyles.subject}>{objet || "Non spécifié"}</Text>
      </View>

      {/* Section Totaux */}
      <View style={pdfStyles.totalsContainer}>
        <View style={pdfStyles.legalText}>
          <Text style={pdfStyles.amountInWords}>
            Arrêtée la présente facture à la somme de : {'\n'}
            <Text style={{ color: 'black', fontSize: 11 }}>
              {n2words(Math.round(Number(data.totals?.["Total TTC"]?.[0]?.replace(/\s/g, '').replace(',', '.')) || 0), { lang: 'fr' })} francs CFA
            </Text>
          </Text>
          <Text style={pdfStyles.notes}>
            Notes:{'\n'}
            <Text style={{ color: 'black', fontSize: 11 }}>
              Nous vous remercions de votre confiance.
            </Text>
          </Text>
        </View>

        <View style={pdfStyles.totalsBox}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Total HT:</Text>
            <Text style={pdfStyles.totalValue}>{formatNumber(data.totals?.["Total HT"]?.[0])} XOF</Text>
          </View>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>TVA:</Text>
            <Text style={pdfStyles.totalValue}>{formatNumber(data.totals?.["Total TVA"]?.[0])} XOF</Text>
          </View>
          <View style={[pdfStyles.totalRow, pdfStyles.grandTotal]}>
            <Text style={[pdfStyles.totalLabel, { color: '#4a6da7', fontSize: 12 }]}>Total TTC:</Text>
            <Text style={[pdfStyles.totalValue, { color: '#4a6da7', fontWeight: 'bold', fontSize: 14 }]}>
              {formatNumber(data.totals?.["Total TTC"]?.[0])} XOF
            </Text>
          </View>
        </View>
      </View>

      {showSignature && (
        <View style={pdfStyles.signatureContainer}>
          <Image
            style={pdfStyles.signatureImage}
            src={sign} alt="Aucune signature"
          />
        </View>
      )}

      {/* Pied de page */}
      <View style={pdfStyles.footer}>
        {/* Ligne 1: Nom de l'entreprise */}
        <Text style={pdfStyles.footerBold}>{companyInfo.name || "Nom de l'entreprise"}</Text>

        {/* Ligne 2: RC et NINEA sur la même ligne */}
        {(companyInfo.rcNumber || companyInfo.ninea) && (
          <Text>
            {companyInfo.rcNumber && `RC: ${companyInfo.rcNumber}`}
            {companyInfo.rcNumber && companyInfo.ninea && " | "}
            {companyInfo.ninea && `NINEA: ${companyInfo.ninea}`}
          </Text>
        )}

        {/* Ligne 3: RIB CBAO (seulement si sélectionné et configuré) */}
        {ribType.includes("CBAO") && ribData.CBAO && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.CBAO.banque}:</Text> {ribData.CBAO.rib}
          </Text>
        )}

        {/* Ligne 4: RIB BIS (seulement si sélectionné et configuré) */}
        {ribType.includes("BIS") && ribData.BIS && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.BIS.banque}:</Text> {ribData.BIS.rib}
          </Text>
        )}

        {/* Autres RIBs - sur des lignes séparées */}
        {ribData.OTHER1 && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.OTHER1.banque}:</Text> {ribData.OTHER1.rib}
          </Text>
        )}

        {ribData.OTHER2 && (
          <Text>
            <Text style={pdfStyles.footerBold}>RIB {ribData.OTHER2.banque}:</Text> {ribData.OTHER2.rib}
          </Text>
        )}

        {/* Dernière ligne: Téléphone et Email */}
        {(companyInfo.phone || companyInfo.email) && (
          <Text>
            {companyInfo.phone && `Téléphone: ${companyInfo.phone}`}
            {companyInfo.phone && companyInfo.email && " | "}
            {companyInfo.email && `Email: ${companyInfo.email}`}
          </Text>
        )}
      </View>

      {/* Numéro de page */}
      <Text style={pdfStyles.pageNumber}>
        Page {itemPages.length + 1} sur {itemPages.length + 1}
      </Text>
    </Page>
  );

  return (
    <Document>
      {/* Pages principales */}
      {itemPages.map((pageItems, pageIndex) => renderMainPage(pageItems, pageIndex))}

      {/* Page des totaux si nécessaire */}
      {showTotalsOnSeparatePage && renderTotalsPage()}
    </Document>
  );
};

export default InvoicePDF;
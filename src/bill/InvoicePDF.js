import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { pdfStyles } from './styles/pdfStyles';
import n2words from 'n2words';
import sign from '../assets/sign.png'


const InvoicePDF = ({ data, ribType = ["CBAO"], objet, showSignature = true }) => {
  const ribData = {
    CBAO: {
      banque: "CBAO",
      rib: "SN012 01201 036182616901 96",
    },
    BIS: {
      banque: "BIS",
      rib: "SN079 01101 2254061204001 77",
    }
  };

  const formatNumber = (numStr) => {
    if (!numStr) return "0";
    const cleaned = numStr.toString().replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const splitItemsIntoPages = (items) => {
    const itemsPerPage = 12; // Garder 12 comme dans la première version pour la logique
    const totalItems = items.Designation.length;

    if (totalItems <= itemsPerPage) {
      return [items];
    }

    const pages = [];
    const fullPagesCount = Math.floor(totalItems / itemsPerPage);

    for (let i = 0; i < fullPagesCount * itemsPerPage; i += itemsPerPage) {
      const pageItems = {
        Designation: items.Designation.slice(i, i + itemsPerPage),
        Quantite: items.Quantite.slice(i, i + itemsPerPage),
        "Prix Unitaire": items["Prix Unitaire"].slice(i, i + itemsPerPage),
        TVA: items.TVA.slice(i, i + itemsPerPage),
        "Prix Total": items["Prix Total"].slice(i, i + itemsPerPage),
      };
      pages.push(pageItems);
    }

    const remaining = totalItems % itemsPerPage;
    if (remaining > 0) {
      const start = fullPagesCount * itemsPerPage;
      const pageItems = {
        Designation: items.Designation.slice(start),
        Quantite: items.Quantite.slice(start),
        "Prix Unitaire": items["Prix Unitaire"].slice(start),
        TVA: items.TVA.slice(start),
        "Prix Total": items["Prix Total"].slice(start),
      };
      pages.push(pageItems);
    }

    return pages;
  };

  const itemPages = splitItemsIntoPages(data.items);
  const isMultiPage = itemPages.length > 1;
  const lastPageItems = itemPages[itemPages.length - 1];
  const showTotalsOnSeparatePage = lastPageItems.Designation.length > 9;
  // Ajoutez cette fonction de formatage
  const formatDesignation = (text) => {
    if (!text) return '';
    // Convertit en minuscules puis met la première lettre en majuscule
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Puis utilisez-la dans le rendu :
  const renderMainPage = (pageItems, pageIndex) => (
    <Page key={pageIndex} size="A4" style={pdfStyles.page}>
      {/* Filigrane/background */}
      <Image
        style={pdfStyles.watermark}
        src="./Logo_LIS.png"
      />
      {/* En-tête */}
      <View style={pdfStyles.header}>
        <View>
          <Image style={pdfStyles.logo} src="./Logo_LIS.png" />
          <Text style={pdfStyles.address}>Ouest Foire, Route de l'Aéroport {'\n'} <Text>Dakar, Sénégal</Text></Text>
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
              index % 2 === 1 && { backgroundColor: 'rgba(170, 238, 184, 0.08)' } // ou utilise pdfStyles.tableRowAlt
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
        <Text style={pdfStyles.footerBold}>LEADER INTERIM ET SERVICES</Text>
        <Text>RC: SN 2015 B24288 | NINEA: 0057262212 A2</Text>
        {Array.isArray(ribType) && ribType.map(rib => {
          const ribInfo = ribData[rib];
          return ribInfo ? (
            <Text key={rib}>
              <Text style={pdfStyles.footerBold}>RIB {ribInfo.banque}:</Text> {ribInfo.rib}
            </Text>
          ) : null;
        })}
        <Text>Téléphone: 338208846 | Email: infos@leaderinterime.com</Text>
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
        src="./Logo_LIS.png"
      />
      {/* En-tête */}
      <View style={pdfStyles.header}>
        <View>
          <Image style={pdfStyles.logo} src="./Logo_LIS.png" />
          <Text style={pdfStyles.address}>Ouest Foire, Route de l'Aéroport {'\n'} <Text>Dakar, Sénégal</Text></Text>
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
        <Text style={pdfStyles.footerBold}>LEADER INTERIM ET SERVICES</Text>
        <Text>RC: SN 2015 B24288 | NINEA: 0057262212 A2</Text>
        {Array.isArray(ribType) && ribType.map(rib => {
          const ribInfo = ribData[rib];
          return ribInfo ? (
            <Text key={rib}>
              <Text style={pdfStyles.footerBold}>RIB {ribInfo.banque}:</Text> {ribInfo.rib}
            </Text>
          ) : null;
        })}
        <Text>Téléphone: 338208846 | Email: infos@leaderinterime.com</Text>
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
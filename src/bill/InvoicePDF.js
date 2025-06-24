import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { pdfStyles } from './styles/pdfStyles';
import n2words from 'n2words';

const InvoicePDF = ({ data, ribType = ["CBAO"], objet }) => {
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

  // Fonction pour diviser les articles en groupes qui tiennent sur une page
  const splitItemsIntoPages = (items) => {
    const itemsPerPage = 12;
    const totalItems = items.Designation.length;

    // Cas simple : 13 éléments ou moins → une seule page
    if (totalItems <= itemsPerPage) {
      return [items];
    }

    const pages = [];

    // Nombre de pages complètes
    const fullPagesCount = Math.floor(totalItems / itemsPerPage);

    // Ajouter les pages complètes
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

    // Ajouter la dernière page si des éléments restent
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
  const lastPageHasTooManyItems = lastPageItems.Designation.length > 10;
  const showTotalsOnSeparatePage = lastPageHasTooManyItems;

  return (
    <Document>
      {itemPages.map((pageItems, pageIndex) => (
        <Page key={pageIndex} size="A4" style={pdfStyles.page} wrap>
          {/* En-tête de la facture (toujours présent sur chaque page) */}
          <View style={pdfStyles.header}>
            <View style={pdfStyles.companyInfo}>
              <Image
                style={pdfStyles.logo}
                src="./Logo_LIS.png"
              />
            </View>
            <View style={pdfStyles.invoiceTitleContainer}>
              <Text style={pdfStyles.invoiceTitle}>
                {data.facture.Type?.[0]?.toUpperCase() || "FACTURE"}
              </Text>
            </View>
          </View>

          {/* Informations de la facture (uniquement sur la première page) */}
          <View style={{ marginTop: -20, alignItems: 'flex-end' }}>
            <View style={{ padding: 10, marginTop: -70 }}>
              <Text style={{ marginBottom: 5, fontSize: 25, color: '#2c3e50', fontWeight: 'bold' }}>
                {data.facture.Numéro[0]}
              </Text>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Date:</Text> {new Date(data.facture.Date[0]).toLocaleDateString('fr-FR')}
              </Text>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Echéance:</Text> {new Date(data.facture.DateEcheance[0]).toLocaleDateString('fr-FR')}
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


          {/* Tableau des articles */}
          <View style={{ marginTop: 20 }}>
            {pageIndex === 0 && (
              <Text style={pdfStyles.sectionTitle}>Cher client </Text>
            )}

            <View style={{ marginTop: 10 }}>
              {/* En-tête du tableau (toujours présent) */}
              <View style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableHeader, { width: '40%' }]}>Désignation</Text>
                <Text style={[pdfStyles.tableHeader, { width: '10%', textAlign: 'right' }]}>QTE</Text>
                <Text style={[pdfStyles.tableHeader, { width: '19%', textAlign: 'right' }]}>PU HT</Text>
                <Text style={[pdfStyles.tableHeader, { width: '8%', textAlign: 'right' }]}>TVA </Text>
                <Text style={[pdfStyles.tableHeader, { width: '23%', textAlign: 'right' }]}>PT HT</Text>
              </View>

              {/* Lignes des articles pour cette page */}
              {pageItems.Designation?.map((designation, index) => (
                <View key={`${pageIndex}-${index}`} style={pdfStyles.tableRow_1}>
                  <Text style={{ width: '40%' }}>{designation}</Text>
                  <Text style={{ width: '10%', textAlign: 'right' }}>{pageItems.Quantite[index]}</Text>
                  <Text style={{ width: '19%', textAlign: 'right' }}>{pageItems["Prix Unitaire"][index]} </Text>
                  <Text style={{ width: '8%', textAlign: 'right' }}>{pageItems.TVA[index]}</Text>
                  <Text style={{ width: '23%', textAlign: 'right' }}>{pageItems["Prix Total"][index]} </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Totaux (uniquement sur la dernière page) */}
          {pageIndex === itemPages.length - 1 && !showTotalsOnSeparatePage && (
            <View style={[pdfStyles.totalsContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View style={{ maxWidth: '50%', marginTop: '15' }}>
                <Text style={{ fontSize: 12, marginBottom: 4, color: 'green' }}>Arrêtée la présente facture à la somme de </Text>
                <Text style={{ fontSize: 10 }}>
                  {n2words(Number(data.totals?.["Total TTC"]?.[0]?.replace(',', '.')) || 0, { lang: 'fr' })} francs cfa
                </Text>
                <Text style={{ fontSize: 12, marginTop: '5%', color: 'green' }}>Notes</Text>
                <Text style={{ fontSize: 10 }}>Nous vous remercions de votre confiance</Text>
              </View>

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
          )}

          {/* Pied de page (toujours présent) */}
          <View style={pdfStyles.footer}>
            <Text>LEADER INTERIM ET SERVICES</Text>
            <Text>Ouest Foire rte de l'aéroport</Text>
            <Text>RC:SN 2015 B24288; NINEA: 0057262212 A2</Text>
            <View style={{ marginTop: 5 }}>
              {Array.isArray(ribType) && ribType.map(rib => {
                const ribInfo = ribData[rib];
                return ribInfo ? (
                  <Text key={rib} style={{ fontWeight: 'bold' }}>
                    RIB {ribInfo.banque}: {ribInfo.rib}
                  </Text>
                ) : null;
              })}
            </View>
            <Text>Téléphone: 338208846 - Email: infos@leaderinterime.com</Text>
          </View>

          {/* Numéro de page (si document multi-page) */}
          {isMultiPage && (
            <Text style={{ position: 'absolute', bottom: 30, right: 30, fontSize: 10 }}>
              {pageIndex + 1} / {itemPages.length}
            </Text>
          )}
        </Page>
      ))}
      {showTotalsOnSeparatePage && (
        <Page size="A4" style={pdfStyles.page}>
          {/* En-tête */}
          <View style={pdfStyles.header}>
            <View style={pdfStyles.companyInfo}>
              <Image
                style={pdfStyles.logo}
                src="./Logo_LIS.png"
              />
            </View>
            <View style={pdfStyles.invoiceTitleContainer}>
              <Text style={pdfStyles.invoiceTitle}>
                {data.facture.Type?.[0]?.toUpperCase() || "FACTURE"}
              </Text>
            </View>
          </View>

          {/* Infos facture */}
          <View style={{ marginTop: -20, alignItems: 'flex-end' }}>
            <View style={{ padding: 10, marginTop: -70 }}>
              <Text style={{ marginBottom: 5, fontSize: 25, color: '#2c3e50', fontWeight: 'bold' }}>
                {data.facture.Numéro[0]}
              </Text>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Date:</Text> {new Date(data.facture.Date[0]).toLocaleDateString('fr-FR')}
              </Text>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Échéance:</Text> {new Date(data.facture.DateEcheance[0]).toLocaleDateString('fr-FR')}
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

          {/* Objet */}
          <View style={{ marginTop: 20 }}>
            <Text style={pdfStyles.sectionTitle}>Objet : {objet || "Non spécifié"}</Text>
          </View>

          {/* Totaux */}
          <View style={[pdfStyles.totalsContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 50 }]}>
            <View style={{ maxWidth: '50%' }}>
              <Text style={{ fontSize: 12, marginBottom: 4, color: 'green' }}>Arrêtée la présente facture à la somme de </Text>
              <Text style={{ fontSize: 10 }}>
                {n2words(Number(data.totals?.["Total TTC"]?.[0]?.replace(',', '.')) || 0, { lang: 'fr' })} francs CFA
              </Text>
              <Text style={{ fontSize: 12, marginTop: '5%', color: 'green' }}>Notes</Text>
              <Text style={{ fontSize: 10 }}>Nous vous remercions de votre confiance</Text>
            </View>

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

          {/* Footer */}
          <View style={pdfStyles.footer}>
            <Text>LEADER INTERIM ET SERVICES</Text>
            <Text>Ouest Foire rte de l'aéroport</Text>
            <Text>RC:SN 2015 B24288; NINEA: 0057262212 A2</Text>
            <View style={{ marginTop: 5 }}>
              {Array.isArray(ribType) && ribType.map(rib => {
                const ribInfo = ribData[rib];
                return ribInfo ? (
                  <Text key={rib} style={{ fontWeight: 'bold' }}>
                    RIB {ribInfo.banque}: {ribInfo.rib}
                  </Text>
                ) : null;
              })}
            </View>
            <Text>Téléphone: 338208846 - Email: infos@leaderinterime.com</Text>
          </View>

          {/* Numéro de page */}
          <Text style={{ position: 'absolute', bottom: 30, right: 30, fontSize: 10 }}>
            {itemPages.length + 1} / {itemPages.length + 1}
          </Text>
        </Page>
      )}

    </Document>
  );
};

export default InvoicePDF;
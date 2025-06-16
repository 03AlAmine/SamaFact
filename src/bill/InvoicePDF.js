import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { pdfStyles } from './styles/pdfStyles';
import n2words from 'n2words';

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

export default InvoicePDF;

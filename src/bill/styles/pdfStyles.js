import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  companyInfo: {
    width: '40%'
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  companyAddress: {
    fontSize: 10,
    color: '#7f8c8d',
    lineHeight: 1.5
  },
  invoiceTitleContainer: {
    position: 'absolute',
    top: 10, // ajuste selon la hauteur que tu veux
    right: 40, // ou 'left' selon le côté souhaité
    backgroundColor: '#66BB6A', // Vert élégant
    padding: 10,
    borderRadius: 4,
    width: 120,
    display: "flex",
    alignItems: "center",
  },

  invoiceTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold'
  },
  clientInfo: {
    marginTop: 30,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderLeft: '4px solid #3498db'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    //borderBottom: '1px solid #eee',
    paddingBottom: 5
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    //backgroundColor: '#f0f8ff',
    width: '100%', /* AliceBlue, un bleu très clair */

  }, totalsBox: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    right: 0,

  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#7f8c8d',
    borderTop: '2px solid rgb(121, 220, 143)',
    paddingTop: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: '#218838',
    color: 'white',
  },
  tableRow_1: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 5,
    paddingHorizontal: 5,
    //backgroundColor: '#218838',
    color: 'black',
    fontSize: 10,
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 10,
    // borderBottom: '1px solid #000',
    paddingBottom: 3,
    paddingTop: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    width: '50%',
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 10,
  },
  totalValue: {
    width: '50%',
    textAlign: 'right',
    fontSize: 10,
  },
  totalValue_1: {
    width: '50%',
    textAlign: 'right',
    fontSize: 10,
    color: '#218838',
  }
});


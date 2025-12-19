import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    position: 'relative',
    fontSize: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  logo: {
    width: 140,
    height: 'auto',
    marginBottom: 10
  },  
  signatureContainer: {
    marginTop: -20,
    alignItems: 'flex-end',
    width: '100%',
  },
  signatureImage: {
    width: 140,
    height: 80,
  },
  address: {
    fontSize: 7,
    lineHeight: 1.2,
    color: '#555',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    paddingLeft: 15,
  },
  invoiceTitleContainer: {
    backgroundColor: '#218838', // Bleu élégant
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    alignSelf: 'flex-end',
    top: -62,
  },
  invoiceTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  invoiceInfo: {
    position: 'absolute',
    top: 100,
    right: 40,
    textAlign: 'right',
    lineHeight: 1,

  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a6da7',
    marginBottom: 5
  },
  clientInfo: {
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    backgroundColor: 'rgba(121, 220, 143, 0.1)',
    borderRadius: 4,
    borderLeft: '3px solid #218838'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(121, 220, 143)',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  subject: {
    fontSize: 11,
    color: '#555',
    marginBottom: 15,
    fontStyle: 'italic'
  },
  clientGreeting: {
    fontSize: 11,
    color: '#4a6da7',
    marginBottom: 10,
    fontStyle: 'italic',
    paddingLeft: 5,
    borderLeft: '3px solid #4a6da7'
  },
  table: {
    width: '100%',
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#218838', // Bleu élégant)',
    color: 'white',
    paddingVertical: 6,
    paddingHorizontal: 5,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontSize: 10
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  legalText: {
    width: '50%',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#555'
  },
  totalsBox: {
    width: '45%',
    backgroundColor: 'rgba(185, 235, 196, 0.21)',
    borderRadius: 4,
    padding: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#555'
  },
  totalValue: {
    fontWeight: 'normal'
  },
  grandTotal: {
    borderTop: '1px solid #ddd',
    paddingTop: 5,
    marginTop: 5,
    fontWeight: 'bold',
    color: 'rgba(121, 220, 143)',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#7f8c8d',
    borderTop: '1.5px solid rgba(169, 121, 220, 0.5)',
    paddingTop: 10,
    lineHeight: 1.2
  },
  footerBold: {
    fontWeight: 'bold',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    fontSize: 8,
    color: '#7f8c8d'
  },
  amountInWords: {
    fontSize: 9,
    marginBottom: 5,
    color: '#555',
    fontStyle: 'italic'
  },
  notes: {
    fontSize: 9,
    color: '#555',
    marginTop: 15
  },
  watermark: {
    position: 'absolute',
    width: '60%',
    height: '60%',
    opacity: 0.1,
    left: '15%',
    top: '15%',
    zIndex: -1
  }
});
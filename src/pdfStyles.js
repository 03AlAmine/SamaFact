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
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 4,
    alignSelf: 'flex-end'
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
    borderBottom: '1px solid #eee',
    paddingBottom: 5
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  totalsBox: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#7f8c8d',
    borderTop: '1px solid #eee',
    paddingTop: 10
  }
});

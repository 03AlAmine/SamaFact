import { StyleSheet } from '@react-pdf/renderer';


export const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        position: 'relative',
        fontSize: 10,
        paddingBottom: 80
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        alignItems: 'flex-start'
    },
    companyLogo: {
        width: 120,
        height: 'auto',
        marginBottom: 10
    },
    companyInfo: {
        fontSize: 9,
        lineHeight: 1.4,
        color: '#555'
    },
    titleContainer: {
        backgroundColor: '#218838',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 4,
        alignSelf: 'flex-end'
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    subtitle: {
        fontSize: 10,
        color: 'white',
        marginTop: 5
    },
    employeeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        padding: 15,
        backgroundColor: 'rgba(121, 220, 143, 0.1)',
        borderRadius: 4,
        borderLeft: '3px solid #218838'
    },
    section: {
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'solid',
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 0,
        backgroundColor: '#218838',
        padding: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    table: {
        width: '100%'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        borderBottomStyle: 'solid',
        padding: 8,
        fontSize: 10
    },
    tableHeader: {
        backgroundColor: 'rgba(121, 220, 143, 0.2)',
        fontWeight: 'bold'
    },
    tableCol: {
        width: '70%',
        padding: 8
    },
    tableColAmount: {
        width: '30%',
        padding: 8,
        textAlign: 'right'
    },
    totalSection: {
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'solid',
        borderRadius: 4,
        padding: 15,
        backgroundColor: 'rgba(185, 235, 196, 0.21)'
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
    netPay: {
        fontWeight: 'bold',
        color: '#218838',
        fontSize: 14
    },
    signatureContainer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 10
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#7f8c8d',
        borderTopStyle: 'solid',
        width: 150,
        paddingTop: 5,
        textAlign: 'center'
    },
    signatureImage: {
        width: 120,
        height: 60
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        fontSize: 8,
        textAlign: 'center',
        color: '#7f8c8d',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        borderTopStyle: 'solid',
        paddingTop: 10,
        lineHeight: 1.4
    },
    footerBold: {
        fontWeight: 'bold'
    },
    watermark: {
        position: 'absolute',
        width: '60%',
        height: '60%',
        opacity: 0.1,
        left: '15%',
        top: '15%',
        zIndex: -1
    },
    amountInWords: {
        fontSize: 10,
        marginTop: 10,
        fontStyle: 'italic',
        color: '#555'
    }
});

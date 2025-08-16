import { StyleSheet } from '@react-pdf/renderer';


export const styles = StyleSheet.create({
    page: {
        padding: 30,  // Réduit de 40 à 30
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        position: 'relative',
        fontSize: 9,  // Réduit de 10 à 9
        paddingTop: 10,
        paddingBottom: 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,  // Réduit de 10
        paddingBottom: 4,  // Réduit de 5
        borderBottom: '1px solid #e8e8e8',
        position: 'relative'
    },
    companyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,  // Réduit de 15
        width: '75%'  // Réduit de 80%
    },
    logoWrapper: {
        backgroundColor: 'white',
        padding: 8,  // Réduit de 10
        borderRadius: 6,  // Réduit de 8
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,  // Réduit de 90
        height: 80  // Réduit de 90
    },
    companyLogo: {
        width: '100%',
        height: 'auto',
        maxHeight: 60,  // Réduit de 70
        objectFit: 'contain'
    },
    companyTextContainer: {
        flex: 1
    },
    companyName: {
        fontSize: 11,  // Réduit de 10
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,  // Réduit de 6
        letterSpacing: 0.7,  // Réduit de 0.8
        textTransform: 'uppercase'
    },
    companyDetails: {
        fontSize: 8,  // Réduit de 9
        lineHeight: 1.5,  // Réduit de 1.6
        color: '#555',
        fontFamily: 'Helvetica'
    },
    detailLabel: {
        fontWeight: '600',
        color: '#333',
        fontFamily: 'Helvetica-Bold'
    },
    documentHeader: {
        backgroundColor: '#218838',
        paddingVertical: 8,  // Réduit de 10
        paddingHorizontal: 15,  // Réduit de 20
        borderRadius: 5,  // Réduit de 6
        textAlign: 'center',
        minWidth: 110,  // Réduit de 100
        alignSelf: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    documentTitle: {
        fontSize: 9,  // Réduit de 10
        fontWeight: 'extrabold',
        color: 'white',
        textTransform: 'uppercase',
        letterSpacing: 0.8,  // Réduit de 1
        marginBottom: 1,  // Réduit de 2
        fontFamily: 'Helvetica-Bold'
    },
    documentPeriod: {
        fontSize: 7,  // Inchangé
        color: 'rgba(255,255,255,0.92)',
        letterSpacing: 0.4,  // Réduit de 0.5
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Oblique'
    },
    employeeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,  // Réduit de 20
        padding: 10,  // Réduit de 15
        backgroundColor: 'rgba(101, 220, 143, 0.1)',
        borderRadius: 4,
        borderLeft: '3px solid #218838'
    },
    employeeInfoLine: {
        marginBottom: 4
    },
    employeeInfoPre: {
        fontWeight: 'bold'
    },
    remunerationSection: {
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#f9fdf9'
    },
    splitContainer: {
        flexDirection: 'row',
        position: 'relative',
        paddingVertical: 6 // Ajoute un peu d'espace pour le séparateur
    },
    leftColumn: {
        width: '49%',
        paddingRight: 10
    },
    rightColumn: {
        width: '49%',
        paddingLeft: 10
    },
    verticalDivider: {
        position: 'absolute',
        left: '49.2%',
        top: '10%', // Ne commence pas tout en haut
        bottom: '10%', // Ne va pas tout en bas
        width: 2,
        backgroundColor: 'rgba(101, 220, 143, 0.6)',
    },
    remunerationTitle: {
        fontSize: 10,  // Réduit de 13
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#28a745',
        paddingVertical: 5,  // Réduit de 6
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.4  // Réduit de 0.5
    },
    remunerationRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingVertical: 5,  // Réduit de 6
        paddingHorizontal: 6,  // Réduit de 8
        alignItems: 'center'
    },
    remunerationLabel: {
        flex: 1,
        fontSize: 7,  // Réduit de 10
        color: '#333'
    },
    remunerationValue: {
        width: '30%',
        fontSize: 7,  // Réduit de 10
        textAlign: 'right',
        color: '#1e4620',
        fontWeight: '500'
    },
    remunerationValueEmpty: {
        color: '#bbb',
        fontStyle: 'italic'
    },
    remunerationTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#d4edda',
        paddingVertical: 6,  // Réduit de 8
        paddingHorizontal: 6  // Réduit de 8
    },
    remunerationTotalLabel: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 8,  // Réduit de 11
        color: '#155724'
    },
    remunerationTotalValue: {
        width: '30%',
        fontWeight: 'bold',
        fontSize: 8,  // Réduit de 11
        color: '#155724',
        textAlign: 'right'
    },
    doubleTotalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'relative',
        marginTop: 1
    },
    halfWidth: {
        width: '48%' // Laisse 4% pour le séparateur
    },
    primesSection: {
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#fdfdf9'
    },
    primesTitle: {
        fontSize: 8,  // Réduit de 13
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#28a745',
        paddingVertical: 5,  // Réduit de 6
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.4  // Réduit de 0.5
    },
    primesRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingVertical: 5,  // Réduit de 6
        paddingHorizontal: 6,  // Réduit de 8
        alignItems: 'center'
    },
    primesLabel: {
        flex: 1,
        fontSize: 7,  // Réduit de 10
        color: '#333'
    },
    primesValue: {
        width: '30%',
        fontSize: 7,  // Réduit de 10
        textAlign: 'right',
        color: '#155724',
        fontWeight: '500'
    },
    primesValueEmpty: {
        color: '#bbb',
        fontStyle: 'italic'
    },
    primesTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#d4edda',
        paddingVertical: 6,  // Réduit de 8
        paddingHorizontal: 6  // Réduit de 8
    },
    primesTotalLabel: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 8,  // Réduit de 11
        color: '#155724'
    },
    primesTotalValue: {
        width: '30%',
        fontWeight: 'bold',
        fontSize: 8,  // Réduit de 11
        color: '#155724',
        textAlign: 'right'
    },
    section: {
        marginBottom: 6,  // Réduit de 15
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 8,  // Réduit de 10
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: '#28a745',
        padding: 5,  // Réduit de 6
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    table: {
        width: '100%'
    },
    tableRow: {
        flexDirection: 'row'
    },
    tableCell: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#000',
        padding: 3,  // Réduit de 4
        fontSize: 7,  // Réduit de 10
        textAlign: 'center'
    },
    emptyCell: {
        backgroundColor: '#f2f2f2',
        color: '#999'
    },
    headerRow: {
        backgroundColor: '#e0e0e0'
    },
    headerCell: {
        fontWeight: 'bold',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center'
    },
    totalRow: {
        backgroundColor: '#d4edda'
    },
    bold: {
        fontWeight: 'bold'
    },
    tableHeader: {
        backgroundColor: 'rgba(101, 220, 143, 0.2)',
        fontWeight: 'bold'
    },
    tableCol: {
        width: '70%',
        padding: 6  // Réduit de 8
    },
    tableColAmount: {
        width: '30%',
        padding: 6,  // Réduit de 8
        textAlign: 'right'
    },
    socialContributionsSection: {
        marginBottom: 8,  // Réduit de 15
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 5,  // Réduit de 6
        overflow: 'hidden',
        backgroundColor: '#f9f9fc'
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
    totalSection: {
        borderWidth: 1,
        borderColor: '#28a745',
        borderRadius: 5,  // Réduit de 6
        padding: 10,  // Réduit de 10
        backgroundColor: '#f8f9fa'
    },
    totalRowtotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,  // Réduit de 6
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    totalLabel: {
        fontSize: 10,  // Réduit de 11
        color: '#495057',
        fontWeight: '500'
    },
    totalValue: {
        fontSize: 10,  // Réduit de 11
        color: '#210529',
        fontWeight: '500'
    },
    doubleTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'relative',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    halfTotalContainer: {
        width: '48%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    netPay: {
        fontSize: 11,  // Réduit de 10
        fontWeight: 'bold',
        color: '#155724'
    },
    amountInWords: {
        marginTop: 8,  // Réduit de 10
        fontSize: 9,  // Réduit de 10
        fontStyle: 'italic',
        color: '#6c757d',
        textAlign: 'center',
        padding: 6,  // Réduit de 8
        backgroundColor: '#f1f8ff',
        borderRadius: 3  // Réduit de 4
    },
    splitRow: {
        backgroundColor: '#f8f9fa',
        justifyContent: 'space-between',
        paddingVertical: 2,
        borderBottomWidth: 0,
        borderTopWidth: 'none'
    },
    splitColumn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 1
    },
    splitHeader: {
        fontWeight: 'bold',
        fontSize: 8,
        color: '#218838'
    },
    splitValue: {
        fontSize: 9,
        fontWeight: '600',
        color: '#333'
    },
    grandTotalRow: {
        backgroundColor: '#d4edda',
        justifyContent: 'center',
        paddingVertical: 8,
        marginTop: 1
    },
    grandTotalLabel: {
        fontWeight: 'bold',
        fontSize: 9,
        color: '#155724',
        textAlign: 'center',
        marginRight: 10
    },
    grandTotalValue: {
        fontWeight: 'bold',
        fontSize: 10,
        color: '#155724'
    },
});

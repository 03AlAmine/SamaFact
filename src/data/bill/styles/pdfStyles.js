import { StyleSheet } from '@react-pdf/renderer';

// Fonction pour déterminer le thème basé sur la couleur
export const getThemeFromColor = (primaryColor) => {
  // Mappage direct des couleurs prédéfinies
  const colorMap = {
    '#218838': 'green',
    '#2c6fbb': 'blue',
    '#8a2be2': 'purple',
    '#e67e22': 'orange',
    '#5bc0de': 'cyan',
    '#d9534f': 'orange',
  };

  // Normaliser la couleur (s'assurer qu'elle a #)
  const normalizedColor = primaryColor.startsWith('#')
    ? primaryColor.toLowerCase()
    : `#${primaryColor.toLowerCase()}`;

  // Retourne le thème si la couleur est exactement dans la liste
  if (colorMap[normalizedColor]) {
    return colorMap[normalizedColor];
  }

  // Sinon, utiliser la logique par distance EUCLIDIENNE (plus précise)
  const hex = normalizedColor.replace('#', '');
  // S'assurer que c'est un hex valide (6 caractères)
  const validHex = hex.length === 6 ? hex :
    hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] : '000000';

  const r = parseInt(validHex.substring(0, 2), 16);
  const g = parseInt(validHex.substring(2, 4), 16);
  const b = parseInt(validHex.substring(4, 6), 16);

  // Définir les couleurs de référence pour chaque thème
  const themeColors = {
    green: { r: 33, g: 136, b: 56 },
    blue: { r: 44, g: 111, b: 187 },
    purple: { r: 138, g: 43, b: 226 },
    orange: { r: 230, g: 126, b: 34 },
    cyan: { r: 91, g: 192, b: 222 }
  };

  let closestTheme = 'green'; // Par défaut
  let minDistance = Infinity;

  for (const [theme, refColor] of Object.entries(themeColors)) {
    // Distance euclidienne au carré (plus rapide, pas besoin de Math.sqrt)
    const distance =
      Math.pow(r - refColor.r, 2) +
      Math.pow(g - refColor.g, 2) +
      Math.pow(b - refColor.b, 2);

    if (distance < minDistance) {
      minDistance = distance;
      closestTheme = theme;
    }
  }

  return closestTheme;
};

// Thème VERT (par défaut)
const greenTheme = {
  primaryColor: '#218838',
  secondaryColor: '#4a6da7',
  accentColor: 'rgba(121, 220, 143, 0.1)',
  tableHeaderBg: '#218838',
  clientInfoBg: 'rgba(121, 220, 143, 0.1)',
  clientInfoBorder: '#218838',
  sectionTitleColor: '#218838',
  greetingColor: '#4a6da7',
  greetingBorder: '#4a6da7',
  totalsBoxBg: 'rgba(185, 235, 196, 0.21)',
  grandTotalColor: '#218838',
  footerBorder: '#79dc8f', // <- opaque
};

// Thème BLEU
const blueTheme = {
  primaryColor: '#2c6fbb',
  secondaryColor: '#4a6da7',
  accentColor: 'rgba(108, 171, 221, 0.1)',
  tableHeaderBg: '#2c6fbb',
  clientInfoBg: 'rgba(108, 171, 221, 0.1)',
  clientInfoBorder: '#2c6fbb',
  sectionTitleColor: '#2c6fbb',
  greetingColor: '#4a6da7',
  greetingBorder: '#4a6da7',
  totalsBoxBg: 'rgba(185, 215, 235, 0.21)',
  grandTotalColor: '#2c6fbb',
  footerBorder: '#6cabdd', // <- couleur opaque

};

// Thème POURPRE
const purpleTheme = {
  primaryColor: '#8a2be2',
  secondaryColor: '#6a5acd',
  accentColor: 'rgba(186, 85, 211, 0.1)',
  tableHeaderBg: '#8a2be2',
  clientInfoBg: 'rgba(186, 85, 211, 0.1)',
  clientInfoBorder: '#8a2be2',
  sectionTitleColor: '#8a2be2',
  greetingColor: '#6a5acd',
  greetingBorder: '#6a5acd',
  totalsBoxBg: 'rgba(221, 160, 221, 0.21)',
  grandTotalColor: '#8a2be2',
  footerBorder: '#ba55d3',
};

// Thème ORANGE/ROUGE
const orangeTheme = {
  primaryColor: '#e67e22',
  secondaryColor: '#d35400',
  accentColor: 'rgba(230, 126, 34, 0.1)',
  tableHeaderBg: '#e67e22',
  clientInfoBg: 'rgba(230, 126, 34, 0.1)',
  clientInfoBorder: '#e67e22',
  sectionTitleColor: '#e67e22',
  greetingColor: '#d35400',
  greetingBorder: '#d35400',
  totalsBoxBg: 'rgba(253, 203, 110, 0.21)',
  grandTotalColor: '#e67e22',
  footerBorder: '#e67e22',
};

const cyanTheme = {
  primaryColor: '#5bc0de',
  secondaryColor: '#31b0d5',
  accentColor: 'rgba(91, 192, 222, 0.1)',
  tableHeaderBg: '#5bc0de',
  clientInfoBg: 'rgba(91, 192, 222, 0.1)',
  clientInfoBorder: '#5bc0de',
  sectionTitleColor: '#5bc0de',
  greetingColor: '#31b0d5',
  greetingBorder: '#31b0d5',
  totalsBoxBg: 'rgba(185, 235, 235, 0.21)',
  grandTotalColor: '#5bc0de',
  footerBorder: '#5bc0de',
};


// Fonction pour obtenir le thème
const getTheme = (primaryColor = '#218838') => {
  const themeName = getThemeFromColor(primaryColor);

  switch (themeName) {
    case 'green':
      return greenTheme;
    case 'blue':
      return blueTheme;
    case 'purple':
      return purpleTheme;
    case 'orange':
      return orangeTheme;
    case 'cyan':
      return cyanTheme;
    default:
      return greenTheme;
  }
};

// Créez les styles dynamiquement
export const createPdfStyles = (primaryColor = '#218838') => {
  const theme = getTheme(primaryColor);

  return StyleSheet.create({
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
      alignItems: 'flex-start',
    },
    logo: {
      width: 120,
      height: 100,
      marginBottom: 5,
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
    head: {
      alignItems: 'center',
      textAlign: 'center',
    },
    companyName: {
      fontSize: 8,
      fontWeight: 'bold',
      color: theme.primaryColor,
      marginBottom: 5,
      letterSpacing: 0.5,
      fontFamily: 'Helvetica-BoldOblique',
    },
    address: {
      fontSize: 7,
      lineHeight: 1.2,
      color: '#555',
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'center',
    },
    invoiceTitleContainer: {
      backgroundColor: theme.primaryColor,
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
      top: 130,
      right: 40,
      textAlign: 'right',
      lineHeight: 1,
    },
    invoiceNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.secondaryColor,
      marginBottom: 5
    },
    clientInfo: {
      marginTop: 20,
      marginBottom: 30,
      padding: 15,
      backgroundColor: theme.accentColor,
      borderRadius: 4,
      borderLeft: `3px solid ${theme.primaryColor}`
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.sectionTitleColor,
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
      color: theme.greetingColor,
      marginBottom: 10,
      fontStyle: 'italic',
      paddingLeft: 5,
      borderLeft: `3px solid ${theme.greetingBorder}`
    },
    table: {
      width: '100%',
      marginBottom: 20
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: theme.tableHeaderBg,
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
    tableRowAlt: {
      backgroundColor: theme.accentColor,
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
      backgroundColor: theme.totalsBoxBg,
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
      color: theme.grandTotalColor,
    },
    footer: {
      position: 'absolute',
      bottom: 32,
      left: 40,
      right: 40,
      textAlign: 'center',
      fontSize: 8,
      color: '#7f8c8d',
      borderTopWidth: 2,
      borderTopColor: theme.footerBorder,
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
      opacity: 0.08,
      left: '15%',
      top: '15%',
      zIndex: -1
    }
  });
};


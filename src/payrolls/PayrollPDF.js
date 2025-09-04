import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
//import sign from '../assets/sign.png'; // Assurez-vous d'avoir cette image
import n2words from 'n2words';
import { styles } from './styles'; // Import des styles depuis le fichier styles.js 

const PayrollPDF = ({ employee = {}, formData = {}, calculations = {}, companyInfo = {} }) => {
    // Formatage des dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };
    const formatCurrency = (value) => {
        const numericValue = parseFloat(value) || 0;
        // Solution 1: simple replace
        return `${numericValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
    };
    // Conversion du montant en lettres
    const amountInWords = (amount) => {
        const numericAmount = parseFloat(amount) || 0;
        const roundedAmount = Math.round(numericAmount);
        try {
            return n2words(roundedAmount, { lang: 'fr' }) + ' francs CFA';
        } catch (error) {
            console.error("Erreur conversion montant en lettres:", error);
            return "Montant non convertible";
        }
    };
    //Ajoutez cette fonction de formatage
    const formatDateShort = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year} ${month} ${day}`;
    };
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark */}
                <Image
                    style={styles.watermark}
                    src="./Logo_LIS.png" // Remplacez par le chemin correct
                />

                {/* Header */}
                <View style={styles.header}>
                    {/* Partie Gauche - Logo + Infos Entreprise */}
                    <View style={styles.companyContainer}>
                        <View style={styles.logoWrapper}>
                            <Image
                                src="./Logo_LIS.png"
                                style={styles.companyLogo}
                                alt={`Logo ${companyInfo.name}`}
                            />
                        </View>

                        <View style={styles.companyTextContainer}>
                            <Text style={styles.companyName}>LEADER INTERIM ET SERVICES</Text>
                            <Text style={styles.companyDetails}>
                                <Text style={styles.detailLabel}>Adresse: </Text>Dakar, Senegal{'\n'}
                                <Text style={styles.detailLabel}>Tél: </Text>+221 33 820 88 46 •
                                <Text style={styles.detailLabel}> Email: </Text>infos@leaderinterime.com{'\n'}
                                <Text style={styles.detailLabel}>RC: </Text>SN 2015 B24288 •
                                <Text style={styles.detailLabel}>NINEA: </Text>0057262212 A2
                            </Text>
                        </View>
                    </View>

                    {/* Partie Droite - Titre Document */}
                    <View style={styles.documentHeader}>
                        <Text style={styles.documentTitle}>BULLETIN DE PAIE</Text>
                        <Text style={styles.documentPeriod}>
                            {formatDateShort(formData.periode.du)} - {formatDateShort(formData.periode.au)}
                        </Text>
                    </View>
                </View>

                {/* Employee Info */}
                <View style={styles.employeeInfo}>
                    <View>
                        <Text style={styles.employeeInfoLine}>
                            <Text style={styles.employeeInfoPre}>Prénom & Nom: </Text>
                            {employee.prenom} {employee.nom}
                        </Text>
                        <Text style={styles.employeeInfoLine}>
                            <Text style={styles.employeeInfoPre}>Adresse: </Text>
                            {employee.adresse}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.employeeInfoLine}>
                            <Text style={styles.employeeInfoPre}>Date embauche: </Text>
                            {formatDate(employee.dateEmbauche)}
                        </Text>
                        <Text style={styles.employeeInfoLine}>
                            <Text style={styles.employeeInfoPre}>Poste: </Text>
                            {employee.poste}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.employeeInfoLine}>
                            <Text style={styles.employeeInfoPre}>Matricule: </Text>
                            {employee.matricule}
                        </Text>
                        <Text style={styles.employeeInfoLine}>
                            <Text style={styles.employeeInfoPre}>Catégorie: </Text>
                            {employee.categorie}
                        </Text>
                    </View>
                </View>


                {/* Gains */}
                <View style={styles.remunerationSection}>
                    <Text style={styles.remunerationTitle}>Rémunération</Text>

                    <View style={styles.splitContainer}>
                        {/* Colonne de gauche */}
                        <View style={styles.leftColumn}>
                            {[
                                { label: "Salaire de base", value: formData.remuneration.salaireBase },
                                { label: "Sursalaire", value: formData.remuneration.sursalaire },
                            ].map((item, index) => (
                                <View key={`left-${index}`} style={styles.remunerationRow}>
                                    <Text style={styles.remunerationLabel}>{item.label}</Text>
                                    <Text style={[
                                        styles.remunerationValue,
                                        (!item.value || parseFloat(item.value) === 0) && styles.remunerationValueEmpty
                                    ]}>
                                        {item.value && parseFloat(item.value) > 0 ? formatCurrency(parseFloat(item.value)) : "-"}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Trait séparateur */}
                        <View style={styles.verticalDivider}></View>

                        {/* Colonne de droite */}
                        <View style={styles.rightColumn}>
                            {[
                                { label: "Autres indemnités", value: formData.remuneration.autresIndemnites },
                                { label: "Avantages en nature", value: formData.remuneration.avantagesNature }
                            ].map((item, index) => (
                                <View key={`right-${index}`} style={styles.remunerationRow}>
                                    <Text style={styles.remunerationLabel}>{item.label}</Text>
                                    <Text style={[
                                        styles.remunerationValue,
                                        (!item.value || parseFloat(item.value) === 0) && styles.remunerationValueEmpty
                                    ]}>
                                        {item.value && parseFloat(item.value) > 0 ? formatCurrency(parseFloat(item.value)) : "-"}
                                    </Text>
                                </View>
                            ))}
                        </View>

                    </View>

                    {/* Totaux (sur toute la largeur) */}
                    <View style={styles.doubleTotalContainer}>
                        <View style={[styles.remunerationTotalRow, styles.halfWidth]}>
                            <Text style={styles.remunerationTotalLabel}>Salaire brut social</Text>
                            <Text style={styles.remunerationTotalValue}>{formatCurrency(calculations.brutSocial)}</Text>
                        </View>

                        <View style={styles.verticalDivider}></View>

                        <View style={[styles.remunerationTotalRow, styles.halfWidth]}>
                            <Text style={styles.remunerationTotalLabel}>Salaire brut fiscal</Text>
                            <Text style={styles.remunerationTotalValue}>{formatCurrency(calculations.brutFiscal)}</Text>
                        </View>
                    </View>
                </View>

                {/* Retenues */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        RETENUES LÉGALES - Cotisations sociales & impôts sur salaires
                    </Text>

                    <View style={styles.table}>
                        {/* En-tête principal avec 7 colonnes (comme les données) */}
                        <View style={[styles.tableRow, styles.headerRow]}>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>
                                IPRES{"\n"}Régime Général
                            </Text>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>
                                IPRES{"\n"}Régime Cadre
                            </Text>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>T.R.I.M.F</Text>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>I.R</Text>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Retenue salaire</Text>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Avances</Text>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Qpart IPM</Text>
                            <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Arrondi</Text>
                        </View>

                        {/* Valeurs */}
                        <View style={styles.tableRow}>
                            {["432 000", "1 296 000", formData.retenues.trimf || "0", formData.retenues.ir || "0", "", "", "", ""].map((val, i) => (
                                <Text key={i} style={[styles.tableCell, val === "" && styles.emptyCell]}>{val}</Text>
                            ))}
                        </View>


                        {/* Pourcentages */}
                        <View style={styles.tableRow}>
                            {["5,6", "2,4", "", "", "", "", "", ""].map((val, i) => (
                                <Text key={i} style={[styles.tableCell, val === "" && styles.emptyCell]}>{val}</Text>
                            ))}
                        </View>

                        {/* Montants */}
                        <View style={styles.tableRow}>
                            {["4 220", "-", "-", "-", formData.retenues.salaire || "0", formData.retenues.avances || "0", formData.retenues.qpartipm || "0", "-"].map((val, i) => (
                                <Text key={i} style={[styles.tableCell, val === "" && styles.emptyCell]}>{val}</Text>
                            ))}
                        </View>

                        {/* Total - fusionner les colonnes */}
                        <View style={styles.sectionTotalRow}>
                            <Text style={styles.sectionTotalLabel}>Total Retenues</Text>
                            <Text style={styles.sectionTotalValue}>{formatCurrency(calculations.totalRetenuesPris)}</Text>
                        </View>
                    </View>
                </View>

                {/* Primes */}
                <View style={styles.primesSection}>
                    <Text style={styles.primesTitle}>Primes et Indemnités</Text>

                    <View style={styles.splitContainer}>
                        {/* Colonne de gauche */}
                        <View style={styles.leftColumn}>
                            {[
                                { label: "Indemnité de transport", value: formData.primes.transport },
                                { label: "Indemnité de responsabilité", value: formData.primes.responsabilite }
                            ].map((item, index) => (
                                <View key={`left-${index}`} style={styles.primesRow}>
                                    <Text style={styles.primesLabel}>{item.label}</Text>
                                    <Text style={[
                                        styles.primesValue,
                                        (!item.value || parseFloat(item.value) === 0) && styles.primesValueEmpty
                                    ]}>
                                        {item.value && parseFloat(item.value) > 0 ? formatCurrency(parseFloat(item.value)) : "-"}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Trait séparateur */}
                        <View style={styles.verticalDivider}></View>

                        {/* Colonne de droite */}
                        <View style={styles.rightColumn}>
                            {[
                                { label: "Indemnité de déplacement", value: formData.primes.deplacement },
                                { label: "Autres primes", value: formData.primes.autresPrimes }
                            ].map((item, index) => (
                                <View key={`right-${index}`} style={styles.primesRow}>
                                    <Text style={styles.primesLabel}>{item.label}</Text>
                                    <Text style={[
                                        styles.primesValue,
                                        (!item.value || parseFloat(item.value) === 0) && styles.primesValueEmpty
                                    ]}>
                                        {item.value && parseFloat(item.value) > 0 ? formatCurrency(parseFloat(item.value)) : "-"}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Total primes (pleine largeur) */}
                    <View style={styles.sectionTotalRow}>
                        <Text style={styles.sectionTotalLabel}>Total Primes</Text>
                        <Text style={styles.sectionTotalValue}>{formatCurrency(calculations.totalPrimes)}</Text>
                    </View>
                </View>

                {/* Retenues & Cotisations */}
                <View style={styles.socialContributionsSection}>
                    <Text style={styles.sectionTitle}> COTISATIONS SALARIALES | PATRONALES  </Text>

                    {/* Header simplifié */}
                    <View style={[styles.tableRow, styles.headerRow]}>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Organisme</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Salarial</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Patronal</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Total</Text>
                    </View>

                    {/* IPRES - Version compacte */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>IPRES</Text>
                        <Text style={styles.tableCell}>4 220 (5,6%)</Text>
                        <Text style={styles.tableCell}>6 330 (8,4%)</Text>
                        <Text style={styles.tableCell}>10 551</Text>
                    </View>

                    {/* CSS - Version compacte */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>CSS</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>5 040 (7% + 1%)</Text>
                        <Text style={styles.tableCell}>5 040</Text>
                    </View>

                    {/* IPM - Version compacte */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>IPM</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.qpartipm)}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.qpartipm)}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(calculations.tooqpartipm)}</Text>

                    </View>

                    {/* Retenues fiscales - Version compacte */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Fiscales</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.trimf)} (TRIMF)</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.ir)} (IR)</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.cfce)} (C.F.C.E)</Text>
                        <Text style={styles.tableCell}>{formatCurrency(calculations.totalfiscales)}</Text>
                    </View>

                    {/* Séparateur visuel */}

                    {/* Section employé/employeur optimisée */}
                    <View style={[styles.tableRow, styles.splitRow]}>
                        <View style={styles.splitColumn}>
                            <Text style={styles.splitHeader}>Cotisations salariales</Text>
                            <Text style={styles.splitValue}>{formatCurrency(calculations.cotisatisationsEmp)}</Text>
                        </View>
                        <View style={styles.verticalDivider}></View>

                        <View style={styles.splitColumn}>
                            <Text style={styles.splitHeader}>Cotisations patronales</Text>
                            <Text style={styles.splitValue}>{formatCurrency(calculations.cotisatisationsEmployeur)}</Text>
                        </View>

                    </View>

                    {/* Total - Version mise en valeur */}
                    <View style={[styles.tableRow, styles.grandTotalRow]}>
                        <Text style={styles.grandTotalLabel}>TOTAL COTISATIONS</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(calculations.cotisationsTotales)} </Text>
                    </View>
                </View>

                {/* Totaux */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRowtotal}>
                        <Text style={styles.totalLabel}>Salaire Brut:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(calculations.brutFiscal)}</Text>
                    </View>

                    <View style={styles.totalRowtotal}>
                        <Text style={styles.totalLabel}>Retenues:</Text>
                        <Text style={styles.totalValue}> {formatCurrency(calculations.totalRetenuesPris)}</Text>
                    </View>

                    <View style={styles.totalRowtotal}>
                        <Text style={styles.totalLabel}>Rémunération nette:</Text>
                        <Text style={styles.totalValue}> {formatCurrency(calculations.salaireNet)}</Text>
                    </View>

                    <View style={styles.totalRowtotal}>
                        <Text style={styles.totalLabel}>Primes et Indemnités:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(calculations.totalPrimes)}</Text>
                    </View>


                    <View style={[styles.totalRowtotal, { marginTop: 10, borderBottomWidth: 0 }]}>
                        <Text style={[styles.totalLabel, styles.netPay]}>NET À PAYER:</Text>
                        <Text style={[styles.totalValue, styles.netPay]}>{formatCurrency(calculations.salaireNetAPayer)}</Text>
                    </View>
                    <Text style={styles.amountInWords}>
                        Arrêté le présent bulletin à la somme de: {amountInWords(calculations.salaireNetAPayer)} francs CFA
                    </Text>
                </View>


                {/* Signature
                <View style={styles.signatureContainer}>
                    <View>
                        <Image
                            style={styles.signatureImage}
                            src={sign}
                        />
                        <Text style={styles.signatureLine}>Signature employeur</Text>
                    </View>
                    <View>
                        <Text style={styles.signatureLine}>Signature employé</Text>
                    </View>
                </View> */}

                {/* Footer 
                <View style={styles.footer}>
                    <Text style={styles.footerBold}>LEADER INTERIM ET SERVICES</Text>
                    <Text>RC: SN 2015 B24288 | NINEA: 0057262212 A2</Text>
                    <Text>Téléphone: 33 820 88 46 | Email: infos@leaderinterime.com</Text>
                    <Text>Bulletin généré le {formatDate(new Date().toISOString())}</Text>
                </View>*/}
            </Page>
        </Document>
    );
};

export default PayrollPDF;
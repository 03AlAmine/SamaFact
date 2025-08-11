import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import sign from '../assets/sign.png'; // Assurez-vous d'avoir cette image
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
                    <View>
                        {companyInfo.logo && (
                            <Image src={companyInfo.logo} style={styles.companyLogo} />
                        )}
                        <Text style={styles.companyInfo}>
                            {companyInfo.name}{'\n'}
                            {companyInfo.address}{'\n'}
                            Tél: {companyInfo.phone}{'\n'}
                            Email: {companyInfo.email}{'\n'}
                            RC: {companyInfo.rc} - NINEA: {companyInfo.ninea}
                        </Text>
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>BULLETIN DE PAIE</Text>
                        <Text style={styles.subtitle}>
                            Période du {formatDate(formData.periode.du)} au {formatDate(formData.periode.au)}
                        </Text>
                        <Text style={styles.subtitle}>Matricule: {employee.matricule}</Text>
                    </View>
                </View>

                {/* Employee Info */}
                <View style={styles.employeeInfo}>
                    <View>
                        <Text style={{ fontWeight: 'bold' }}>Nom: {employee.nom} {employee.prenom}</Text>
                        <Text>Poste: {employee.poste}</Text>
                    </View>
                    <View>
                        <Text>Date embauche: {formatDate(employee.dateEmbauche)}</Text>
                        <Text>Contrat: {employee.typeContrat}</Text>
                    </View>
                </View>

                {/* Gains */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GAINS</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.tableCol}>Libellé</Text>
                            <Text style={styles.tableColAmount}>Montant (XOF)</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Salaire de base</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.remuneration.salaireBase))}</Text>
                        </View>
                        {parseFloat(formData.remuneration.sursalaire) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Sursalaire</Text>
                                <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.remuneration.sursalaire))}</Text>
                            </View>
                        )}
                        {parseFloat(formData.remuneration.indemniteDeplacement) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Indemnité de déplacement</Text>
                                <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.remuneration.indemniteDeplacement))}</Text>
                            </View>
                        )}
                        {parseFloat(formData.remuneration.autresIndemnites) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Autres indemnités</Text>
                                <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.remuneration.autresIndemnites))}</Text>
                            </View>
                        )}
                        {parseFloat(formData.remuneration.avantagesNature) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Avantages en nature</Text>
                                <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.remuneration.avantagesNature))}</Text>
                            </View>
                        )}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.tableCol}>Total Gains</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(calculations.brutSocial)}</Text>
                        </View>
                    </View>
                </View>

                {/* Primes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PRIMES ET INDEMNITES</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Indemnité de transport</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.primes.transport))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Prime de panier</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.primes.panier))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Indemnité de responsabilité</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.primes.responsabilite))}</Text>
                        </View>
                        {parseFloat(formData.primes.autresPrimes) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Autres primes</Text>
                                <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.primes.autresPrimes))}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Retenues */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RETENUES</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Cotisations sociales (IPM)</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.retenues.ipm))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>TRIMF</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.retenues.trimf))}</Text>
                        </View>
                        {parseFloat(formData.retenues.avances) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Avances</Text>
                                <Text style={styles.tableColAmount}>{formatCurrency(parseFloat(formData.retenues.avances))}</Text>
                            </View>
                        )}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.tableCol}>Total Retenues</Text>
                            <Text style={styles.tableColAmount}>{formatCurrency(calculations.cotisationsSalariales)}</Text>
                        </View>
                    </View>
                </View>

                {/* Totaux */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Salaire Brut:</Text>
                        <Text>{formatCurrency(calculations.brutFiscal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Cotisations salariales:</Text>
                        <Text>- {formatCurrency(calculations.cotisationsSalariales)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Cotisations patronales:</Text>
                        <Text>- {formatCurrency(calculations.cotisationsPatronales)}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginTop: 10 }]}>
                        <Text style={[styles.totalLabel, styles.netPay]}>NET A PAYER:</Text>
                        <Text style={styles.netPay}>{formatCurrency(calculations.salaireNetAPayer)}</Text>
                    </View>
                    <Text style={styles.amountInWords}>
                        Arrêté le présent bulletin à la somme de: {amountInWords(calculations.salaireNetAPayer)} francs CFA
                    </Text>
                </View>

                {/* Signature */}
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
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerBold}>LEADER INTERIM ET SERVICES</Text>
                    <Text>RC: SN 2015 B24288 | NINEA: 0057262212 A2</Text>
                    <Text>Téléphone: 33 820 88 46 | Email: infos@leaderinterime.com</Text>
                    <Text>Bulletin généré le {formatDate(new Date().toISOString())}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default PayrollPDF;
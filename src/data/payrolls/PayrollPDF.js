import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
//import sign from '../assets/sign.png'; // Assurez-vous d'avoir cette image
import n2words from 'n2words';
import { styles } from './styles'; // Import des styles depuis le fichier styles.js 

const PayrollPDF = ({ employee = {}, formData = {}, calculations = {}, companyInfo = {} }) => {
    // Formatage des dates
    const formatDate = (dateInput) => {
        if (!dateInput) return 'Non spécifié';

        try {
            let date;

            // 1. Si c'est un Timestamp Firebase (objet avec toDate())
            if (dateInput && typeof dateInput === 'object' && dateInput.toDate && typeof dateInput.toDate === 'function') {
                date = dateInput.toDate();
            }
            // 2. Si c'est déjà un objet Date
            else if (dateInput instanceof Date) {
                date = dateInput;
            }
            // 3. Si c'est une string (format ISO ou autre)
            else if (typeof dateInput === 'string') {
                date = new Date(dateInput);

                // Si la date est invalide, essayer de parser autrement
                if (isNaN(date.getTime())) {
                    // Essayer le format "YYYY-MM-DD"
                    const isoMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (isoMatch) {
                        date = new Date(isoMatch[1], isoMatch[2] - 1, isoMatch[3]);
                    } else {
                        return dateInput; // Retourner la string telle quelle
                    }
                }
            }
            // 4. Si c'est un timestamp numérique
            else if (typeof dateInput === 'number') {
                date = new Date(dateInput);
            } else {
                return 'Format invalide';
            }

            // Vérifier si la date est valide
            if (isNaN(date.getTime())) {
                return 'Date invalide';
            }

            // Formater en français
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('fr-FR', options);

        } catch (error) {
            console.error("Erreur formatage date:", error);
            return 'Erreur date';
        }
    };

    const formatCurrency = (value) => {
        const numericValue = parseFloat(value) || 0;
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

    /*/ Dans PayrollPDF.js, remplacez la fonction calculateJoursConges par celle-ci :
    const calculateJoursConges = () => {
        try {
            if (!employee?.dateEmbauche) return employee?.joursConges || 0;

            // Convertir la date d'embauche en objet Date de manière sécurisée
            let dateEmbauche;

            // Si c'est un Timestamp Firebase
            if (employee.dateEmbauche && typeof employee.dateEmbauche === 'object' && employee.dateEmbauche.toDate) {
                dateEmbauche = employee.dateEmbauche.toDate();
            }
            // Si c'est une string
            else if (typeof employee.dateEmbauche === 'string') {
                dateEmbauche = new Date(employee.dateEmbauche);
            }
            // Si c'est déjà un objet Date
            else if (employee.dateEmbauche instanceof Date) {
                dateEmbauche = employee.dateEmbauche;
            }
            else {
                return employee?.joursConges || 0;
            }

            // Vérifier si la date est valide
            if (isNaN(dateEmbauche.getTime())) {
                return employee?.joursConges || 0;
            }

            const aujourdHui = new Date();
            const moisEcoules = (aujourdHui.getFullYear() - dateEmbauche.getFullYear()) * 12
                + (aujourdHui.getMonth() - dateEmbauche.getMonth());

            const joursAccumules = moisEcoules * 2;
            const joursUtilises = parseInt(employee.joursCongesUtilises) || 0;

            const solde = Math.max(0, joursAccumules - joursUtilises);

            // Vérifier que le résultat est un nombre valide
            return isNaN(solde) ? (employee?.joursConges || 0) : solde;

        } catch (error) {
            console.error("Erreur calcul congés:", error);
            return employee?.joursConges || 0;
        }
    };*/

    // Calcul des congés basé sur la période du bulletin (pas la date d'aujourd'hui)
    const calculateSoldeConges = () => {
        try {
            if (!employee?.dateEmbauche) return 0;

            // Convertir la date d'embauche
            let dateEmbauche;
            if (employee.dateEmbauche && typeof employee.dateEmbauche === 'object' && employee.dateEmbauche.toDate) {
                dateEmbauche = employee.dateEmbauche.toDate();
            } else if (typeof employee.dateEmbauche === 'string') {
                dateEmbauche = new Date(employee.dateEmbauche);
            } else if (employee.dateEmbauche instanceof Date) {
                dateEmbauche = employee.dateEmbauche;
            } else {
                return 0;
            }

            if (isNaN(dateEmbauche.getTime())) return 0;

            // ✅ Utiliser la date de fin de période du bulletin, pas aujourd'hui
            // Ainsi un bulletin de janvier calculera les congés de janvier
            const dateBulletin = formData?.periode?.au
                ? new Date(formData.periode.au)
                : new Date();

            const anneeBulletin = dateBulletin.getFullYear();

            // Début de l'année du bulletin OU date d'embauche si plus récente
            const debutAnnee = new Date(anneeBulletin, 0, 1);
            const dateDebut = dateEmbauche > debutAnnee ? dateEmbauche : debutAnnee;

            // Mois écoulés dans l'année du bulletin jusqu'à la période du bulletin
            // +1 pour inclure le mois de début (janvier = 1 mois, pas 0)
            const moisEcoules = Math.max(0,
                (dateBulletin.getFullYear() - dateDebut.getFullYear()) * 12 +
                (dateBulletin.getMonth() - dateDebut.getMonth()) + 1
            );

            // 2 jours de congés par mois écoulé
            const congesAccumulesAnnee = moisEcoules * 2;

            // Congés utilisés
            const congesUtilises = parseInt(employee.joursCongesUtilisesAnnee || employee.joursCongesUtilises || 0);

            return Math.max(0, congesAccumulesAnnee - congesUtilises);

        } catch (error) {
            console.error("Erreur calcul solde congés:", error);
            return 0;
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
                            {formatDateShort(formData.periode.du)} | {formatDateShort(formData.periode.au)}
                        </Text>
                    </View>
                </View>

                {/* Employee Info - 2 lignes alignées : labels / valeurs */}
                <View style={styles.employeeInfo}>
                    {/* Ligne 1 : Labels */}
                    <View style={styles.employeeInfoRow}>
                        <Text style={[styles.employeeInfoPre, { flex: 1.2 }]}>Prénom & Nom</Text>
                        <Text style={[styles.employeeInfoPre, { flex: 1 }]}>Matricule</Text>
                        <Text style={[styles.employeeInfoPre, { flex: 1 }]}>Poste</Text>
                        <Text style={[styles.employeeInfoPre, { flex: 0.7 }]}>Catégorie</Text>
                    </View>
                    {/* Ligne 2 : Valeurs */}
                    <View style={styles.employeeInfoRow}>
                        <Text style={[styles.employeeInfoValue, { flex: 1.2 }]} numberOfLines={1}>{employee.prenom} {employee.nom}</Text>
                        <Text style={[styles.employeeInfoValue, { flex: 1 }]}>{employee.matricule}</Text>
                        <Text style={[styles.employeeInfoValue, { flex: 1 }]} numberOfLines={2}>{employee.poste}</Text>
                        <Text style={[styles.employeeInfoValue, { flex: 0.7 }]}>{employee.categorie}</Text>
                    </View>
                    {/* Ligne 3 : Labels */}
                    <View style={[styles.employeeInfoRow, { marginTop: 6 }]}>
                        <Text style={[styles.employeeInfoPre, { flex: 1.2 }]}>Date embauche</Text>
                        <Text style={[styles.employeeInfoPre, { flex: 1 }]}>Nbres Parts</Text>
                        <Text style={[styles.employeeInfoPre, { flex: 1 }]}>J_Congés/Mois</Text>
                        <Text style={[styles.employeeInfoPre, { flex: 0.7 }]}>Adresse</Text>
                    </View>
                    {/* Ligne 4 : Valeurs */}
                    <View style={styles.employeeInfoRow}>
                        <Text style={[styles.employeeInfoValue, { flex: 1.2 }]}>{formatDate(employee.dateEmbauche)}</Text>
                        <Text style={[styles.employeeInfoValue, { flex: 1 }]}>{employee.nbreofParts || 1}</Text>
                        <Text style={[styles.employeeInfoValue, { flex: 1 }]}>{calculateSoldeConges()} jours</Text>
                        <Text style={[styles.employeeInfoValue, { flex: 0.7 }]} numberOfLines={2}>{employee.adresse}</Text>
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

                        {/* Valeurs (Montants en FCFA) */}
                        <View style={styles.tableRow}>
                            {[
                                formatCurrency(calculations.detailsCotisations?.ipresRG || 0).replace(' FCFA', ''),
                                formatCurrency(calculations.detailsCotisations?.ipresRC || 0).replace(' FCFA', ''),
                                formData.retenues.trimf || "0",
                                formData.retenues.ir || "0",
                                formData.retenues.retenueSalaire || "0",
                                formData.retenues.avances || "0",
                                formData.retenues.qpartipm || "0",
                                "-"
                            ].map((val, i) => (
                                <Text key={i} style={[styles.tableCell, val === "" && styles.emptyCell]}>{val}</Text>
                            ))}
                        </View>

                        {/* Pourcentages */}
                        <View style={styles.tableRow}>
                            {["5,6%", "2,4%", "", "", "", "", "", ""].map((val, i) => (
                                <Text key={i} style={[styles.tableCell, val === "" && styles.emptyCell]}>{val}</Text>
                            ))}
                        </View>

                        {/* Total */}
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

                    <View style={[styles.tableRow, styles.headerRow]}>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Organisme</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Salarial</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Patronal</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>Total</Text>
                    </View>

                    {/* IPRES */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>IPRES</Text>
                        <Text style={styles.tableCell}>
                            {formatCurrency(calculations.detailsCotisations?.ipresRG || 0)} (5,6%)
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatCurrency(calculations.detailsCotisations?.ipresRGP || 0)} (8,4%)
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatCurrency((calculations.detailsCotisations?.ipresRG || 0) + (calculations.detailsCotisations?.ipresRGP || 0))}
                        </Text>
                    </View>

                    {/* CSS (Allocations familiales + Accident travail) */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>CSS</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>
                            {formatCurrency((calculations.detailsCotisations?.allocationFamiliale || 0) + (calculations.detailsCotisations?.accidentTravail || 0))} (7% + 1%)
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatCurrency((calculations.detailsCotisations?.allocationFamiliale || 0) + (calculations.detailsCotisations?.accidentTravail || 0))}
                        </Text>
                    </View>

                    {/* IPM */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>IPM</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.qpartipm)}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.qpartipm)}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(calculations.tooqpartipm)}</Text>
                    </View>

                    {/* Retenues fiscales */}
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Fiscales</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.trimf)} (TRIMF)</Text>
                        <Text style={styles.tableCell}>{formatCurrency(formData.retenues.ir)} (IR)</Text>
                        <Text style={styles.tableCell}>{formatCurrency(calculations.detailsCotisations?.cfce || 0)} (C.F.C.E)</Text>
                    </View>

                    {/* Total Fiscales */}
                    <View style={[styles.tableRow, { marginTop: 2 }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Total Fiscales</Text>
                        <Text style={styles.tableCell}></Text>
                        <Text style={styles.tableCell}></Text>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatCurrency(calculations.totalfiscales)}</Text>
                    </View>

                    {/* Section employé/employeur */}
                    <View style={[styles.tableRow, styles.splitRow]}>
                        <View style={styles.splitColumn}>
                            <Text style={styles.splitHeader}>Cotisations salariales</Text>
                            <Text style={styles.splitValue}>{formatCurrency(calculations.cotisationsEmp)}</Text>
                        </View>
                        <View style={styles.verticalDivider}></View>
                        <View style={styles.splitColumn}>
                            <Text style={styles.splitHeader}>Cotisations patronales</Text>
                            <Text style={styles.splitValue}>{formatCurrency(calculations.cotisationsEmployeur)}</Text>
                        </View>
                    </View>

                    {/* Total général */}
                    <View style={[styles.tableRow, styles.grandTotalRow]}>
                        <Text style={styles.grandTotalLabel}>TOTAL COTISATIONS</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(calculations.cotisationsTotales)}</Text>
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
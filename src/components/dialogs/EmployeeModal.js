import React, { useMemo } from "react";
import {
    FaFileSignature, FaUser, FaCalendarAlt, FaIdCard, FaBuilding,
    FaMoneyBillWave, FaCheckCircle, FaFileAlt, FaPercentage, FaChartLine
} from "react-icons/fa";
import { Modal, Button } from "antd";

const EmployeeDetailsModalBase = ({
    isVisible,
    onCancel,
    employee
}) => {
    // Calcul des congés accumulés depuis l'embauche (total)
    const congesAccumules = useMemo(() => {
        if (!employee?.dateEmbauche) return employee?.joursConges || 0;
        const dateEmbauche = new Date(employee.dateEmbauche);
        const aujourdHui = new Date();
        const moisTotaux = (aujourdHui.getFullYear() - dateEmbauche.getFullYear()) * 12
            + (aujourdHui.getMonth() - dateEmbauche.getMonth());
        return Math.max(0, moisTotaux * 2 - (employee.joursCongesUtilises || 0));
    }, [employee?.dateEmbauche, employee?.joursConges, employee?.joursCongesUtilises]);

    // Calcul des congés pour l'année en cours
    const congesEnCours = useMemo(() => {
        if (!employee?.dateEmbauche) return 0;
        const dateEmbauche = new Date(employee.dateEmbauche);
        const aujourdHui = new Date();
        const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 1);
        const dateDebutPeriode = dateEmbauche > debutAnnee ? dateEmbauche : debutAnnee;
        if (dateDebutPeriode > aujourdHui) return 0;
        const moisEcoules = (aujourdHui.getFullYear() - dateDebutPeriode.getFullYear()) * 12
            + (aujourdHui.getMonth() - dateDebutPeriode.getMonth());
        return Math.max(0, moisEcoules * 2);
    }, [employee?.dateEmbauche]);

    const congesUtilisesAnnee = employee?.joursCongesUtilisesAnnee || 0;
    const soldeConges = useMemo(() => Math.max(0, congesEnCours - congesUtilisesAnnee),
        [congesEnCours, congesUtilisesAnnee]);

    // Calcul du salaire net estimé
    const salaireNet = useMemo(() => {
        const salaireBase = parseFloat(employee?.salaireBase || 0);
        const sursalaire = parseFloat(employee?.sursalaire || 0);
        const ipm = parseFloat(employee?.ipm || 0);
        const transport = parseFloat(employee?.indemniteTransport || 0);
        const panier = parseFloat(employee?.primePanier || 0);
        const responsabilite = parseFloat(employee?.indemniteResponsabilite || 0);
        const deplacement = parseFloat(employee?.indemniteDeplacement || 0);
        const net = (salaireBase + sursalaire) - ipm + transport + panier + responsabilite + deplacement;
        return net > 0 ? net : 0;
    }, [employee?.salaireBase, employee?.sursalaire, employee?.ipm,
        employee?.indemniteTransport, employee?.primePanier,
        employee?.indemniteResponsabilite, employee?.indemniteDeplacement]);

    return (
        <Modal
            title={
                <div className="employee-modal__header">
                    <FaFileSignature className="employee-modal__icon" />
                    <span>Détails de {employee?.prenom} {employee?.nom}</span>
                </div>
            }
            open={isVisible}
            onCancel={onCancel}
            footer={[
                <Button
                    key="back"
                    onClick={onCancel}
                    className="employee-modal__close-btn"
                >
                    Fermer
                </Button>
            ]}
            width={750}
            className="employee-modal"
        >
            {employee && (
                <div className="employee-modal__content">
                    <div className="employee-details">
                        {/* Section informations principales */}
                        <div className="employee-details__main">
                            <div className="employee-details__row">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaUser className="employee-detail__icon" />
                                        Nom complet
                                    </span>
                                    <span className="employee-detail__value">
                                        {employee.prenom} {employee.nom}
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaCalendarAlt className="employee-detail__icon" />
                                        Date d'embauche
                                    </span>
                                    <span className="employee-detail__value employee-detail__value--date">
                                        {new Date(employee.dateEmbauche).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </div>

                            <div className="employee-details__row">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaIdCard className="employee-detail__icon" />
                                        Matricule
                                    </span>
                                    <span className="employee-detail__value">
                                        {employee.matricule}
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaBuilding className="employee-detail__icon" />
                                        Département
                                    </span>
                                    <span className="employee-detail__value">
                                        {employee.departement || 'Non spécifié'}
                                    </span>
                                </div>
                            </div>

                            <div className="employee-details__row">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaCheckCircle className="employee-detail__icon" />
                                        Type de contrat
                                    </span>
                                    <span className={`employee-detail__value employee-detail__value--${employee.typeContrat?.toLowerCase()}`}>
                                        {employee.typeContrat}
                                    </span>
                                </div>
                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        Catégorie
                                    </span>
                                    <span className="employee-detail__value">
                                        {employee.categorie || 'Non spécifié'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section Rémunération */}
                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                <FaMoneyBillWave className="employee-section__icon" />
                                Rémunération
                            </h4>

                            <div className="employee-details__grid">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        Salaire de base
                                    </span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.salaireBase?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaChartLine className="employee-detail__icon" />
                                        Sursalaire
                                    </span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.sursalaire?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaPercentage className="employee-detail__icon" />
                                        IPM (Impôt)
                                    </span>
                                    <span className="employee-detail__value employee-detail__value--amount employee-detail__value--tax">
                                        {employee.ipm?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="employee-detail highlight">
                                    <span className="employee-detail__label">
                                        Salaire net estimé
                                    </span>
                                    <span className="employee-detail__value employee-detail__value--amount employee-detail__value--highlight">
                                        {salaireNet.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section Primes et indemnités */}
                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                Primes et indemnités
                            </h4>

                            <div className="employee-details__grid">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">Transport</span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.indemniteTransport?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Panier</span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.primePanier?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Responsabilité</span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.indemniteResponsabilite?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Déplacement</span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.indemniteDeplacement?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section Statistiques */}
                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                <FaFileAlt className="employee-section__icon" />
                                Statistiques
                            </h4>

                            <div className="employee-details__grid">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">Nombre de parts</span>
                                    <span className="employee-detail__value">
                                        {employee.nbreofParts || 1}
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Nombre de bulletins</span>
                                    <span className="employee-detail__value">
                                        {employee.payrolls?.length || 0}
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Dernier bulletin</span>
                                    <span className="employee-detail__value employee-detail__value--date">
                                        {employee.payrolls?.length > 0
                                            ? new Date(employee.payrolls[0].periode).toLocaleDateString('fr-FR')
                                            : 'Aucun'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section Suivi des congés et absences */}
                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                <FaCalendarAlt className="employee-section__icon" />
                                Suivi des congés et absences
                            </h4>

                            <div className="employee-details__grid">
                                <div className="employee-detail highlight">
                                    <span className="employee-detail__label">Congés accumulés (total)</span>
                                    <span className="employee-detail__value employee-detail__value--highlight">
                                        {congesAccumules} jours
                                    </span>
                                    <small className="employee-detail__hint">
                                        Depuis l'embauche
                                    </small>
                                </div>

                                <div className="employee-detail highlight">
                                    <span className="employee-detail__label">Congés en cours</span>
                                    <span className="employee-detail__value employee-detail__value--highlight">
                                        {congesEnCours} jours
                                    </span>
                                    <small className="employee-detail__hint">
                                        Année {new Date().getFullYear()}
                                    </small>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Congés utilisés (année)</span>
                                    <span className="employee-detail__value">
                                        {employee.joursCongesUtilisesAnnee || 0} jours
                                    </span>
                                </div>

                                <div className="employee-detail highlight">
                                    <span className="employee-detail__label">Solde congés</span>
                                    <span className="employee-detail__value employee-detail__value--highlight">
                                        {soldeConges} jours
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Jours d'absence</span>
                                    <span className="employee-detail__value">
                                        {employee.joursAbsence || 0} jours
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Avance sur salaire</span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.avanceSalaire?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section Informations de contact */}
                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                Informations de contact
                            </h4>

                            <div className="employee-details__grid">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">Email</span>
                                    <span className="employee-detail__value">
                                        {employee.email || 'Non spécifié'}
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Téléphone</span>
                                    <span className="employee-detail__value">
                                        {employee.telephone || 'Non spécifié'}
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Adresse</span>
                                    <span className="employee-detail__value">
                                        {employee.adresse || 'Non spécifiée'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export const EmployeeDetailsModal = React.memo(
  EmployeeDetailsModalBase,
  (prev, next) =>
    prev.isVisible === next.isVisible &&
    prev.employee?.id === next.employee?.id
);
import React from "react";
import {
    FaFileSignature, FaUser, FaCalendarAlt, FaIdCard, FaBuilding,
    FaMoneyBillWave, FaCheckCircle, FaFileAlt
} from "react-icons/fa";
import { Modal, Button } from "antd";


export const EmployeeDetailsModal = ({
    isVisible,
    onCancel,
    employee
}) => {
    // Calcul des jours de congés accumulés (2 jours par mois)
    const calculateJoursConges = () => {
        if (!employee?.dateEmbauche) return employee?.joursConges || 3;

        const dateEmbauche = new Date(employee.dateEmbauche);
        const aujourdHui = new Date();
        const moisEcoules = (aujourdHui.getFullYear() - dateEmbauche.getFullYear()) * 12
            + (aujourdHui.getMonth() - dateEmbauche.getMonth());

        return Math.max(0, moisEcoules * 2 - (employee.joursCongesUtilises || 0));
    };
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
            width={700}
            className="employee-modal"
        >
            {employee && (
                <div className="employee-modal__content">
                    <div className="employee-details">
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
                                        <FaMoneyBillWave className="employee-detail__icon" />
                                        Salaire de base
                                    </span>
                                    <span className="employee-detail__value employee-detail__value--amount">
                                        {employee.salaireBase?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">
                                        <FaCheckCircle className="employee-detail__icon" />
                                        Type de contrat
                                    </span>
                                    <span className={`employee-detail__value employee-detail__value--${employee.typeContrat?.toLowerCase()}`}>
                                        {employee.typeContrat}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                <FaMoneyBillWave className="employee-section__icon" />
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

                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                <FaFileAlt className="employee-section__icon" />
                                Statistiques
                            </h4>

                            <div className="employee-details__grid">
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

                        <div className="employee-section">
                            <h4 className="employee-section__title">
                                <FaCalendarAlt className="employee-section__icon" />
                                Suivi des congés et absences
                            </h4>

                            <div className="employee-details__grid">
                                <div className="employee-detail">
                                    <span className="employee-detail__label">Congés accumulés</span>
                                    <span className="employee-detail__value">
                                        {calculateJoursConges()} jours
                                    </span>
                                </div>

                                <div className="employee-detail">
                                    <span className="employee-detail__label">Congés utilisés</span>
                                    <span className="employee-detail__value">
                                        {employee.joursCongesUtilises || 0} jours
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
                    </div>
                </div>
            )}
        </Modal>

    );
};


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
                <div className="modal-title">
                    <FaFileSignature style={{ color: '#3b82f6', marginRight: 10 }} />
                    <span>Détails de {employee?.prenom} {employee?.nom}</span>
                </div>
            }
            open={isVisible}
            onCancel={onCancel}
            footer={[
                <Button
                    key="back"
                    onClick={onCancel}
                    style={{ padding: '8px 20px', height: 'auto' }}
                >
                    Fermer
                </Button>
            ]}
            width={700}
            className="document-details-modal-container"
        >
            {employee && (
                <div className="document-details-content-container">
                    <div className="document-details-content">
                        <div className="details-main-section">
                            <div className="details-row">
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <FaUser className="detail-icon" />
                                        Nom complet
                                    </span>
                                    <span className="detail-value">{employee.prenom} {employee.nom}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">
                                        <FaCalendarAlt className="detail-icon" />
                                        Date d'embauche
                                    </span>
                                    <span className="detail-value">
                                        {new Date(employee.dateEmbauche).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </div>

                            <div className="details-row">
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <FaIdCard className="detail-icon" />
                                        Matricule
                                    </span>
                                    <span className="detail-value">{employee.matricule}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">
                                        <FaBuilding className="detail-icon" />
                                        Département
                                    </span>
                                    <span className="detail-value">{employee.departement || 'Non spécifié'}</span>
                                </div>
                            </div>

                            <div className="details-row">
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <FaMoneyBillWave className="detail-icon" />
                                        Salaire de base
                                    </span>
                                    <span className="detail-value amount">
                                        {employee.salaireBase?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">
                                        <FaCheckCircle className="detail-icon" />
                                        Type de contrat
                                    </span>
                                    <span className={`detail-value status ${employee.typeContrat?.toLowerCase()}`}>
                                        {employee.typeContrat}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="payment-section">
                            <h4 className="section-subtitle">
                                <FaMoneyBillWave style={{ marginRight: 8 }} />
                                Primes et indemnités
                            </h4>

                            <div className="details-grid two-columns">
                                <div className="detail-item">
                                    <span className="detail-label">Transport</span>
                                    <span className="detail-value">
                                        {employee.indemniteTransport?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Panier</span>
                                    <span className="detail-value">
                                        {employee.primePanier?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Responsabilité</span>
                                    <span className="detail-value">
                                        {employee.indemniteResponsabilite?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Déplacement</span>
                                    <span className="detail-value">
                                        {employee.indemniteDeplacement?.toLocaleString('fr-FR') || '0'} FCFA
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="payment-section">
                            <h4 className="section-subtitle">
                                <FaFileAlt style={{ marginRight: 8 }} />
                                Statistiques
                            </h4>

                            <div className="details-grid two-columns">
                                <div className="detail-item">
                                    <span className="detail-label">Nombre de bulletins</span>
                                    <span className="detail-value">
                                        {employee.payrolls?.length || 0}
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Dernier bulletin</span>
                                    <span className="detail-value">
                                        {employee.payrolls?.length > 0
                                            ? new Date(employee.payrolls[0].periode).toLocaleDateString('fr-FR')
                                            : 'Aucun'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="payment-section">
                            <h4 className="section-subtitle">
                                <FaCalendarAlt style={{ marginRight: 8 }} />
                                Suivi des congés et absences
                            </h4>

                            <div className="details-grid two-columns">
                                <div className="detail-item">
                                    <span className="detail-label">Congés accumulés</span>
                                    <span className="detail-value">
                                        {calculateJoursConges()} jours
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Congés utilisés</span>
                                    <span className="detail-value">
                                        {employee.joursCongesUtilises || 0} jours
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Jours d'absence</span>
                                    <span className="detail-value">
                                        {employee.joursAbsence || 0} jours
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Avance sur salaire</span>
                                    <span className="detail-value">
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


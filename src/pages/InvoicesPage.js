import React from "react";
// eslint-disable-next-line no-unused-vars
import empty from '../assets/empty.png';
import DocumentSection from "../components/DocumentSection";

const InvoicesPage = ({
    activeTab_0,
    setActiveTab_0,
    getFacturesToDisplay,
    getDevisToDisplay,
    getAvoirsToDisplay,
    searchTerm,
    setSearchTerm,
    navigate,
    handleDeleteFacture,
    selectedClient
}) => {
    return (
        <>
            <div className="navbar-tabs">
                <button
                    className={activeTab_0 === "factures" ? "active" : ""}
                    onClick={() => setActiveTab_0("factures")}
                >
                    Factures ({getFacturesToDisplay().length})
                </button>
                <button
                    className={activeTab_0 === "devis" ? "active" : ""}
                    onClick={() => setActiveTab_0("devis")}
                >
                    Devis ({getDevisToDisplay().length})
                </button>
                <button
                    className={activeTab_0 === "avoirs" ? "active" : ""}
                    onClick={() => setActiveTab_0("avoirs")}
                >
                    Avoirs ({getAvoirsToDisplay().length})
                </button>
            </div>

            {activeTab_0 === "factures" && (
                <DocumentSection
                    title="Factures"
                    items={getFacturesToDisplay()}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    onDelete={handleDeleteFacture}
                    selectedClient={selectedClient}
                    type="facture"
                />
            )}
            {activeTab_0 === "devis" && (
                <DocumentSection
                    title="Devis"
                    items={getDevisToDisplay()}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    onDelete={handleDeleteFacture}
                    selectedClient={selectedClient}
                    type="devis"
                />
            )}
            {activeTab_0 === "avoirs" && (
                <DocumentSection
                    title="Avoirs"
                    items={getAvoirsToDisplay()}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    onDelete={handleDeleteFacture}
                    selectedClient={selectedClient}
                    type="avoir"
                />
            )}
        </>
    );
};

export default InvoicesPage;
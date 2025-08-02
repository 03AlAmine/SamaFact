import React, { useState, useEffect } from "react";
import { FaFileInvoiceDollar, FaChevronRight, FaChartLine, FaBell, FaCheckCircle } from "react-icons/fa";


export const DocumentSliderCard = ({ stats, className = "", showTrend = false, showName = true }) => {
    const items = [
        { label: "Factures", value: stats.totalFactures, color: "#007bff" },
        { label: "Devis", value: stats.totalDevis, color: "#ff7e5f" },
        { label: "Avoirs", value: stats.totalAvoirs, color: "#ff4d6d" }
    ];
    // ➕ Auto-défilement toutes les 3 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 3000);

        return () => clearInterval(interval); // Nettoyage à la destruction
    }, [items.length]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => setCurrentIndex((currentIndex + 1) % items.length);

    return (
        <div className={`stat-card ${className}`}>
            <div
                className="stat-icon invoices"
                style={{ background: items[currentIndex].color }}
            >
                <FaFileInvoiceDollar />
            </div>
            <div className="stat-info">
                <h3>{items[currentIndex].value || 0}</h3>
                {showName && (
                    <>
                        <p>{items[currentIndex].label}</p>
                    </>
                )}
                {showTrend && (
                    <>
                        <p>{items[currentIndex].label} enregistrés</p>
                        <div className="stat-trend up">+5% ce mois-ci</div>
                    </>
                )}
            </div>

            {/* Boutons navigation */}
            <button
                onClick={nextSlide}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "5px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                <FaChevronRight />
            </button>
        </div>
    );
};


export const MonthlyAmountSliderCard = ({ allFactures, allDevis, allAvoirs, className = "", showTrend = false, showName = true }) => {
    const currentMonth = new Date().getMonth();

    // Fonction pour calculer le total TTC pour un type de document sur le mois courant
    const getMonthlyTotal = (docs) =>
        (docs || []).reduce((sum, doc) => {
            const date = doc.date ? new Date(doc.date) : null;
            if (date && date.getMonth() === currentMonth) {
                return sum + (parseFloat(doc.totalTTC) || 0);
            }
            return sum;
        }, 0);

    const [currentIndex, setCurrentIndex] = useState(0);

    const items = [
        {
            label: "Montant factures",
            value: `${getMonthlyTotal(allFactures).toLocaleString()} FCFA`,
            color: "#28a745",
            icon: <FaChartLine />
        },
        {
            label: "Montant devis",
            value: `${getMonthlyTotal(allDevis).toLocaleString()} FCFA`,
            color: "#ff4d6d",
            icon: <FaChartLine />
        },
        {
            label: "Montant avoirs",
            value: `${getMonthlyTotal(allAvoirs).toLocaleString()} FCFA`,
            color: "#007bff",
            icon: <FaChartLine />
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [items.length]);

    const nextSlide = () =>
        setCurrentIndex((currentIndex + 1) % items.length);

    return (
        <div className={`stat-card ${className}`}>
            <div
                className="stat-icon revenue"
                style={{ background: items[currentIndex].color }}
            >
                {items[currentIndex].icon}
            </div>
            <div className="stat-info">
                <h3>{items[currentIndex].value}</h3>
                {showName && (
                    <>

                        <p>{items[currentIndex].label}</p>
                    </>
                )}
                {showTrend && (
                    <>
                        <p>{items[currentIndex].label} annuels </p>
                        <div className="stat-trend up">+25% ce mois-ci</div>
                    </>
                )}
            </div>

            <button
                onClick={nextSlide}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "5px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer"
                }}
            >
                <FaChevronRight />
            </button>
        </div>
    );
};
export const TotalAmountSliderCard = ({ allFactures, allDevis, allAvoirs, className = "", showTrend = false, showName = true }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const getTotal = (docs) =>
        (docs || []).reduce((sum, doc) => {
            return sum + (parseFloat(doc.totalTTC) || 0);
        }, 0);

    const items = [
        {
            label: "Total factures",
            value: `${getTotal(allFactures).toLocaleString()} FCFA`,
            color: "#28a745",
            icon: <FaChartLine />
        },
        {
            label: "Total devis",
            value: `${getTotal(allDevis).toLocaleString()} FCFA`,
            color: "#ff4d6d",
            icon: <FaChartLine />
        },
        {
            label: "Total avoirs",
            value: `${getTotal(allAvoirs).toLocaleString()} FCFA`,
            color: "#007bff",
            icon: <FaChartLine />
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [items.length]);

    const nextSlide = () =>
        setCurrentIndex((currentIndex + 1) % items.length);

    return (
        <div className={`stat-card ${className}`}>
            <div
                className="stat-icon revenue"
                style={{ background: items[currentIndex].color }}
            >
                {items[currentIndex].icon}
            </div>
            <div className="stat-info">
                <h3>{items[currentIndex].value}</h3>
                {showName && <p>{items[currentIndex].label}</p>}
                {showTrend && (
                    <>
                        <p>{items[currentIndex].label} annuels</p>
                        <div className="stat-trend up">+18% cette année</div>
                    </>
                )}
            </div>
            <button
                onClick={nextSlide}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "5px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer"
                }}
            >
                <FaChevronRight />
            </button>
        </div>
    );
};
export const PaymentStatusSliderCard = ({
    stats,
    className = "",
    showTrend = false,
    showName = true
}) => {
    const items = [
        {
            label: "Impayées",
            value: stats.facturesImpayees,
            color: "#f59e0b",
            icon: <FaBell />,
            trend: "+2% ce mois"
        },
        {
            label: "Payées",
            value: stats.facturesPayees,
            color: "#10b981",
            icon: <FaCheckCircle />,
            trend: "+5% ce mois"
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-défilement toutes les 3 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [items.length]);

    const nextSlide = () => setCurrentIndex((currentIndex + 1) % items.length);

    return (
        <div className={`stat-card ${className}`}>
            <div
                className="stat-icon"
                style={{ background: items[currentIndex].color }}
            >
                {items[currentIndex].icon}
            </div>

            <div className="stat-info">
                <h3>{items[currentIndex].value || 0}</h3>

                {showName && (
                    <p>{items[currentIndex].label}</p>
                )}

                {showTrend && (
                    <div className={`stat-trend ${currentIndex === 0 ? 'down' : 'up'}`}>
                        {items[currentIndex].trend}
                    </div>
                )}
            </div>

            <button
                onClick={nextSlide}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "5px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer"
                }}
            >
                <FaChevronRight />
            </button>
        </div>
    );
};

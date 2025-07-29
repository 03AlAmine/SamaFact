// src/services/pdfService.js
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '../bill/InvoicePDF';

export const generatePdfBlob = async (facture) => {
    try {
        // Transformation des données avec l'objet correctement placé
        const pdfData = {
            facture: {
                Numéro: [facture.numero || ""],
                Date: [facture.date || ""],
                DateEcheance: [facture.dateEcheance || ""],
                Objet: [facture.objet || "Non spécifié"],
                Type: [facture.type || "facture"]
            },
            client: {
                Nom: [facture.clientNom || ""],
                Adresse: [facture.clientAdresse || ""],
                Ville: [facture.clientVille || ""]
            },
            items: facture.items ? {
                Designation: facture.items.map(i => i.designation || ""),
                Quantite: facture.items.map(i => i.quantite || ""),
                "Prix Unitaire": facture.items.map(i => i.prixUnitaire || ""),
                TVA: facture.items.map(i => i.tva || ""),
                "Montant HT": facture.items.map(i => i.montantHT || ""),
                "Montant TVA": facture.items.map(i => i.montantTVA || ""),
                "Prix Total": facture.items.map(i => i.prixTotal || "")
            } : {
                Designation: [],
                Quantite: [],
                "Prix Unitaire": [],
                TVA: [],
                "Montant HT": [],
                "Montant TVA": [],
                "Prix Total": []
            },
            totals: {
                "Total HT": [facture.totalHT || "0"],
                "Total TVA": [facture.totalTVA || "0"],
                "Total TTC": [facture.totalTTC || "0"]
            }
        };

        const blob = await pdf(
            <InvoicePDF
                data={pdfData}
                ribType={facture.ribs || ["CBAO"]}
                objet={facture.objet || "Non spécifié"}
            />
        ).toBlob();

        return blob;
    } catch (error) {
        console.error("Erreur lors de la génération du PDF:", error);
        throw error;
    }
};

export const downloadPdf = async (facture) => {
    try {
        const blob = await generatePdfBlob(facture);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${facture.type}_${facture.numero}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Nettoyage
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error("Échec du téléchargement:", error);
        throw error;
    }
};

export const previewPdf = async (facture) => {
    try {
        const blob = await generatePdfBlob(facture);
        const url = URL.createObjectURL(blob);

        // Ouvrir dans un nouvel onglet
        const newWindow = window.open(url, '_blank');

        // Si le popup est bloqué, proposer une alternative
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Alternative: afficher dans une iframe ou un modal
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
            modal.style.zIndex = '1000';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';

            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.width = '80%';
            iframe.style.height = '90%';
            iframe.style.border = 'none';

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Fermer';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '20px';
            closeBtn.style.right = '20px';
            closeBtn.style.padding = '10px 20px';
            closeBtn.style.backgroundColor = '#ff4444';
            closeBtn.style.color = 'white';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '5px';
            closeBtn.style.cursor = 'pointer';

            closeBtn.onclick = () => document.body.removeChild(modal);

            modal.appendChild(iframe);
            modal.appendChild(closeBtn);
            document.body.appendChild(modal);
        }
    } catch (error) {
        console.error("Échec de l'aperçu:", error);
        throw error;
    }
};
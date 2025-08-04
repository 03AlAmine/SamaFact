import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable'; // Import spécifique pour autoTable

// Fonction pour exporter en Excel
export const exportToExcel = (data, fileName, dateRange) => {
  // Filtrer par date si une plage est spécifiée
  let filteredData = data;
  if (dateRange && dateRange.from && dateRange.to) {
    filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= new Date(dateRange.from) && itemDate <= new Date(dateRange.to);
    });
  }

  // Préparer les données pour Excel
  const excelData = filteredData.map(item => ({
    'Type': item.type === 'facture' ? 'Facture' : item.type === 'devis' ? 'Devis' : 'Avoir',
    'Numéro': item.numero,
    'Client': item.clientNom || 'N/A',
    'Date': item.date,
    'Objet': item.objet || 'N/A',
    'Montant HT (FCFA)': item.totalHT,
    'TVA (FCFA)': item.totalTVA,
    'Montant TTC (FCFA)': item.totalTTC,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Documents');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};

// Fonction pour exporter en PDF
export const exportToPDF = (data, fileName, dateRange) => {
  // Filtrer par date si une plage est spécifiée
  let filteredData = data;
  if (dateRange && dateRange.from && dateRange.to) {
    filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= new Date(dateRange.from) && itemDate <= new Date(dateRange.to);
    });
  }

  // Créer un nouveau document PDF en mode paysage
  const doc = new jsPDF({
    orientation: 'landscape'
  });

  // Titre
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(`Liste des documents (${fileName})`, 14, 15);

  // Sous-titre avec dates si filtre appliqué
  if (dateRange && dateRange.from && dateRange.to) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Période: ${formatDate(dateRange.from)} au ${formatDate(dateRange.to)}`, 14, 22);
  }

  // Préparer les données pour le tableau
  const tableData = filteredData.map(item => [
    capitalizeFirstLetter(item.type),
    item.numero,
    item.clientNom || 'N/A',
    item.objet || 'N/A',
    formatDate(item.date),
    formatCurrency(item.totalHT),
    formatCurrency(item.totalTVA),
    `${formatCurrency(item.totalTTC)} FCFA`
  ]);

  // Générer le tableau
  autoTable(doc, {
    head: [['Type', 'Numéro', 'Client', 'Objet', 'Date', 'Montant HT', 'TVA (FCFA)', 'Montant TTC']],
    body: tableData,
    startY: 25,
    margin: { horizontal: 10 },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      textColor: [40, 40, 40]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto', halign: 'center' },
      3: { cellWidth: 'auto', halign: 'right' },
      4: { cellWidth: 'auto', halign: 'center' }
    },
    didDrawPage: function (data) {
      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageCount = doc.internal.getNumberOfPages();
      doc.text(`Page ${data.pageNumber} sur ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Fonctions utilitaires
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const formatCurrency = (amount) => {
  return parseFloat(amount).toFixed(2).replace('.', ',');
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
import { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Buffer } from 'buffer';

// Polyfill Buffer pour le navigateur
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

const DynamicPDFViewer = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Chargement du visualiseur PDF...</div>;
  }

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <PDFViewer width="100%" height="100%">
        {children}
      </PDFViewer>
    </div>
  );
};

export default DynamicPDFViewer;
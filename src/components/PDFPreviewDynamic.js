import { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';

const PDFPreviewDynamic = ({ document, width = '100%', height = '800px', style = {} }) => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const generatePdf = async () => {
      try {
        const blob = await pdf(document).toBlob();
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Erreur lors de la génération du PDF');
          console.error('PDF Generation Error:', err);
        }
      }
    };

    generatePdf();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!url) return <div>Chargement du PDF...</div>;

  return (
    <iframe
      src={url}
      style={{
        width,
        height,
        border: 'none',
        ...style
      }}
      title="Aperçu du bulletin de paie"
    />
  );
};

export default PDFPreviewDynamic;

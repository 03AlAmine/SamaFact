export const formatCurrency = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
  }
  
  const numValue = parseFloat(String(value || 0).replace(/\s/g, ''));
  return isNaN(numValue) 
    ? '0,00' 
    : numValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
};

export const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value.replace(/\s/g, ''));
  return 0;
};
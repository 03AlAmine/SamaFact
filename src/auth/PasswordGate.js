import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaLock, FaArrowRight, FaTimes } from 'react-icons/fa';
import './PasswordGate.css'; // Nous créerons ce fichier CSS ensuite

const PasswordGate = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Simulation de délai pour l'UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === process.env.REACT_APP_ADMIN_SECRET) {
      onSuccess();
      navigate(location.pathname, { replace: true });
    } else {
      setError("Mot de passe incorrect. Veuillez réessayer.");
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <div className="password-gate-container">
      <div className="password-gate-card">
        <div className="password-gate-header">
          <div className="password-gate-icon">
            <FaLock size={24} />
          </div>
          <h2>Accès Administrateur</h2>
          <p>Veuillez entrer le mot de passe pour accéder au panneau d'inscription</p>
        </div>

        <form onSubmit={handleSubmit} className="password-gate-form">
          <div className="input-group">
            <label htmlFor="admin-password">Mot de passe administrateur</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              required
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <FaTimes /> Annuler
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? 'Vérification...' : 'Valider'} <FaArrowRight />
            </button>
          </div>
        </form>

        <div className="password-gate-footer">
          <p>Si vous ne possédez pas le mot de passe, veuillez contacter le super administrateur.</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordGate;
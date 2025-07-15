import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import logo from '../assets/Logo_Mf.png';
import './AuthForm.css'; // ou ton chemin vers AuthForm.css

const ForgotPassword = () => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await resetPassword(email);
            setMessage("📩 Un lien de réinitialisation vous a été envoyé.");
        } catch (err) {
            setError("❌ Une erreur est survenue. Vérifiez votre adresse email.");
        }

        setLoading(false);
    };

    return (
        <div className="auth-forgot">
        <div className="auth-form-forgot">
            <form className="form-auth-forgot" onSubmit={handleReset}>
                <img src={logo} alt="Logo SamaFact" className="auth-logo-forgot" />

                <h1>Mot de passe oublié</h1>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-error" style={{ backgroundColor: "#e6fffa", color: "#2ec4b6", borderLeftColor: "#2ec4b6" }}>{message}</div>}

                <div className="auth-input-box">
                    <input
                        type="email"
                        placeholder="Entrez votre adresse email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <FaEnvelope className="auth-icon" />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>

                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                    <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                        ← Retour à la connexion
                    </Link>
                </p>
            </form>
        </div>
        </div>
    );
};

export default ForgotPassword;

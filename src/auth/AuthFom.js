import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaGoogle, FaFacebook, FaGithub, FaLinkedin } from 'react-icons/fa';
import './AuthForm.css';

const AuthForm = ({ type }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const [activeForm, setActiveForm] = useState(type === 'register' ? 'auth-active' : '');

    const toggleForm = () => {
        setActiveForm(activeForm === 'auth-active' ? '' : 'auth-active');
        setError('');
    };

async function handleSubmit(e) {
    e.preventDefault();

    if (type === 'register' && password !== passwordConfirm) {
        return setError("Les mots de passe ne correspondent pas");
    }

    try {
        setError('');
        setLoading(true);

        if (type === 'login') {
            await login(email, password);
            navigate('/');
        } else {
            await signup(email, password);
            navigate('/profile');
        }
    } catch (err) {
        // Personnalisation du message d’erreur pour le login
        if (type === 'login') {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("Email ou mot de passe incorrect");
            } else {
                setError("Échec de la connexion. Vérifiez vos identifiants");
            }
        } else {
            setError(err.message || "Une erreur est survenue lors de l'inscription");
        }
    } finally {
        setLoading(false);
    }
}


    return (
        
        <div className={`auth-container ${activeForm}`}>
            <div className="auth-form-box auth-login">
                <form  className="form-auth" onSubmit={type === 'login' ? handleSubmit : undefined}>
                    {error && <div className="auth-error">{error}</div>}

                    <h1>Connexion</h1>
                    <div className="auth-input-box">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                        <FaEnvelope className="auth-icon" />
                    </div>
                    <div className="auth-input-box">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mot de passe"
                            required
                        />
                        <FaLock className="auth-icon" />
                    </div>
                    <div className="auth-forgot-link">
                        <Link to="/forgot-password">Mot de passe oublié?</Link>
                    </div>
                    <button disabled={loading} type="submit" className="auth-btn">
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                    <p>ou connectez-vous avec</p>
                    <div className="auth-social-icons">
                        <a href="#"><FaGoogle /></a>
                        <a href="#"><FaFacebook /></a>
                        <a href="#"><FaGithub /></a>
                        <a href="#"><FaLinkedin /></a>
                    </div>
                </form>
            </div>

            <div className="auth-form-box auth-register">
                <form onSubmit={type === 'register' ? handleSubmit : undefined}>
                    <h1>Inscription</h1>
                    <div className="auth-input-box">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                        <FaEnvelope className="auth-icon" />
                    </div>
                    <div className="auth-input-box">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mot de passe"
                            required
                        />
                        <FaLock className="auth-icon" />
                    </div>
                    {type === 'register' && (
                        <div className="auth-input-box">
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                placeholder="Confirmez le mot de passe"
                                required
                            />
                            <FaLock className="auth-icon" />
                        </div>
                    )}
                    <button disabled={loading} type="submit" className="auth-btn">
                        {loading ? 'Inscription en cours...' : "S'inscrire"}
                    </button>
                    <p>ou inscrivez-vous avec</p>
                    <div className="auth-social-icons">
                        <a href="#"><FaGoogle /></a>
                        <a href="#"><FaFacebook /></a>
                        <a href="#"><FaGithub /></a>
                        <a href="#"><FaLinkedin /></a>
                    </div>
                </form>
            </div>

            <div className="auth-toggle-box">
                <div className="auth-toggle-panel auth-toggle-left">
                    <h1>Bienvenue !</h1>
                    <p>Vous n'avez pas encore de compte ?</p>
                    <button className="auth-btn auth-register-btn" onClick={toggleForm}>
                        S'inscrire
                    </button>
                </div>

                <div className="auth-toggle-panel auth-toggle-right">
                    <h1>Content de vous revoir !</h1>
                    <p>Vous avez déjà un compte ?</p>
                    <button className="auth-btn auth-login-btn" onClick={toggleForm}>
                        Se connecter
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
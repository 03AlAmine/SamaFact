import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook, FaGithub, FaLinkedin, FaBuilding, FaUser, FaInfoCircle, FaEyeSlash, FaEye, FaBan } from 'react-icons/fa';
import './AuthForm.css';
import logo from '../assets/Logo_Mf.png';
import PasswordGate from './PasswordGate';
import Preloader from '../components/other/Preloader';

const AuthForm = ({ type }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdminVerified, setIsAdminVerified] = useState(false);
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeForm, setActiveForm] = useState(type === 'register' ? 'auth-active' : '');
    const [showSuccess, setShowSuccess] = useState(false);
    const [username, setUsername] = useState('');
    
    const toggleForm = () => {
        setActiveForm(activeForm === 'auth-active' ? '' : 'auth-active');
        setError('');
        setEmail('');
        setPassword('');
        setPasswordConfirm('');
        setCompanyName('');
        setUserName('');
    };

    const handleAdminVerification = () => {
        setIsAdminVerified(true);
    };

    async function handleSubmit(e, formType) {
        e.preventDefault();

        // Validation pour l'inscription
        if (formType === 'register') {
            if (password !== passwordConfirm) {
                return setError("Les mots de passe ne correspondent pas");
            }
            if (!companyName.trim()) {
                return setError("Le nom de l'entreprise est requis");
            }
        }
        
        try {
            setError('');
            setLoading(true);

            if (formType === 'login') {
                // Utilisez soit le username soit l'email pour la connexion
                const identifier = username || email;
                const user = await login(identifier, password);
                setShowSuccess(true);

                await new Promise(resolve => setTimeout(resolve, 1500));

                // Redirection selon le rôle
                if (user.role === 'superadmin') {
                    window.location.assign('/samafact');
                } else if (user.role === 'admin' || user.role === 'user') {
                    window.location.assign('/');
                } else {
                    window.location.assign('/');
                }
            } else {
                await signup(email, password, companyName, userName, username);
                setShowSuccess(true);
                await new Promise(resolve => setTimeout(resolve, 1500));
                navigate('/profile');
            }

        } catch (err) {
            setLoading(false);
            setShowSuccess(false);

            // 🔥 GESTION AMÉLIORÉE DES ERREURS - INCLUT LA DÉSACTIVATION
            if (formType === 'login') {
                switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        setError("Identifiants incorrects");
                        break;
                    case 'auth/too-many-requests':
                        setError("Trop de tentatives. Réessayez plus tard");
                        break;
                    case 'auth/account-disabled':
                    case 'ACCOUNT_DISABLED': // Erreur personnalisée
                        setError("Votre compte a été désactivé. Contactez votre administrateur.");
                        break;
                    default:
                        // Vérifier si c'est une erreur de compte désactivé via le message
                        if (err.message && err.message.includes('désactivé')) {
                            setError(err.message);
                        } else {
                            setError("Erreur de connexion");
                        }
                }
            } else {
                setError(err.message || "Erreur d'inscription");
            }
        }
    }

    // 🔥 NOUVEAU : Composant pour afficher l'erreur de compte désactivé
    const renderDisabledAccountError = () => {
        if (error && error.includes('désactivé')) {
            return (
                <div className="auth-error disabled-account">
                    <FaBan className="error-icon" />
                    <div>
                        <strong>Compte désactivé</strong>
                        <p>{error}</p>
                        <div className="disabled-account-actions">
                            <button 
                                className="auth-btn auth-contact-admin"
                                onClick={() => window.location.href = 'mailto:admin@mentafact.com'}
                            >
                                Contacter l'administrateur
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return error ? <div className="auth-error">{error}</div> : null;
    };

    const renderRegisterForm = () => {
        if (type === 'register' && !isAdminVerified) {
            return <PasswordGate onSuccess={handleAdminVerification} />;
        }

        return (
            <form onSubmit={(e) => handleSubmit(e, 'register')}>
                <h1>Inscription Admin</h1>
                <div className="auth-input-box">
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nom de l'entreprise"
                        required
                    />
                    <FaBuilding className="auth-icon" />
                </div>
                <div className="auth-input-box">
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Votre nom complet"
                        required
                    />
                    <FaUser className="auth-icon" />
                </div>
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
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nom d'utilisateur"
                        required
                    />
                    <FaUser className="auth-icon" />
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
                <div className="auth-input-box">
                    <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Confirmez le mdp"
                        required
                    />
                    <FaLock className="auth-icon" />
                </div>
                <button disabled={loading} type="submit" className="auth-btn">
                    {loading ? 'Inscription en cours...' : "S'inscrire"}
                </button>
            </form>
        );
    };

    const renderInfoPanel = () => (
        <div className="auth-info-panel">
            <div className="auth-info-content">
                <FaInfoCircle className="auth-info-icon" />
                <h2>Comment obtenir un compte ?</h2>
                <p>
                    Pour créer un compte sur notre plateforme, veuillez contacter
                    l'administrateur système ou votre responsable d'entreprise.
                </p>
                <p>
                    Les comptes sont créés et gérés de manière centralisée pour
                    assurer la sécurité de notre écosystème.
                </p>
                <button
                    className="auth-btn auth-contact-btn"
                    onClick={() => window.location.href = 'mailto:admin@mentafact.com'}
                >
                    Contacter l'administrateur
                </button>
            </div>
        </div>
    );

    return (
        <>
            {showSuccess ? (
                <Preloader
                    message="Connexion réussie! Redirection..."
                    onComplete={() => { }}
                />
            ) : (
                <div className={`auth-container ${activeForm}`}>
                    <div className="auth-form-box auth-login">
                        <form className="form-auth" onSubmit={(e) => handleSubmit(e, "login")}>
                            {/* 🔥 REMPLACÉ : Utilise le nouveau composant d'erreur */}
                            {renderDisabledAccountError()}

                            <h1>Connexion</h1>
                            <div className="auth-input-box">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Nom d'utilisateur"
                                    required
                                />
                                <FaUser className="auth-icon" />
                            </div>

                            <div className="auth-input-box">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mot de passe"
                                    required
                                />
                                {password.length === 0 ? (
                                    <FaLock className="auth-icon" />
                                ) : showPassword ? (
                                    <FaEyeSlash
                                        className="auth-icon cursor-pointer"
                                        onClick={() => setShowPassword(false)}
                                    />
                                ) : (
                                    <FaEye
                                        className="auth-icon cursor-pointer"
                                        onClick={() => setShowPassword(true)}
                                    />
                                )}
                            </div>

                            <div className="auth-forgot-link">
                                <Link to="/forgot-password">Mot de passe oublié?</Link>
                            </div>
                            <button disabled={loading} type="submit" className="auth-btn">
                                {loading ? "Connexion en cours..." : "Se connecter"}
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
                        {type === 'register' ? renderRegisterForm() : renderInfoPanel()}
                    </div>

                    <div className="auth-toggle-box">
                        <div className="auth-toggle-panel auth-toggle-left">
                            <img src={logo} alt="Logo" className="auth-logo" />
                            <h1 className="auth-welcome-title">
                                Content de vous revoir  <br /> sur
                                <span className="h1-span"> SamaFact !</span>
                            </h1>

                            <p>Vous n'avez pas encore de compte ?</p>
                            <button className="auth-btn auth-register-btn" onClick={toggleForm}>
                                Plus d'informations
                            </button>
                        </div>

                        <div className="auth-toggle-panel auth-toggle-right">
                            <img src={logo} alt="Logo" className="auth-logo" />

                            <h1>Bienvenue sur<br />
                                <span className="h1-span">SamaFact</span>
                                <p>Votre application de paie et de facturation</p>

                            </h1>
                            <p>Vous avez déjà un compte ?</p>
                            <button className="auth-btn auth-login-btn" onClick={toggleForm}>
                                Se connecter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AuthForm;
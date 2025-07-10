import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../auth/AuthContext';
import './Profile.css';
import Sidebar from "../Sidebar";
import { db, storage } from '../firebase';
import { ROLES } from '../auth/permissions'; // adapte le chemin si nécessaire

const Profile = () => {
  // State management
  const { currentUser } = useAuth();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    companyLogo: '',
    rib: '',
    companyStatus: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    rcNumber: '',
    ninea: '',
    invoiceColor: '#3a86ff',
    invoiceFont: 'Arial',
    invoiceTemplate: 'classic',
    pdfQuality: 'high'
  });

  const [loading, setLoading] = useState(true);
  const [logoUploading, setLogoUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [companyId, setCompanyId] = useState('');

  // Data fetching
  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          // 1. Récupérer le document utilisateur
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (!userDoc.exists()) throw new Error("Utilisateur non trouvé");

          const userData = userDoc.data();
          const companyId = userData.companyId;
          setCompanyId(companyId);

          // 2. Récupérer les infos de l'entreprise
          const companyRef = doc(db, 'companies', companyId);
          const companySnap = await getDoc(companyRef);
          let companyData = {};
          if (companySnap.exists()) {
            companyData = companySnap.data();
          }
          // 3. Récupérer ou initialiser le profil utilisateur
          const profileRef = doc(db, `companies/${companyId}/profiles`, currentUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            setProfileData(profileSnap.data());
          } else {
            // Fusion des données pour init par défaut
            const defaultData = {
              firstName: '',
              lastName: '',
              companyName: companyData.name || userData.companyName || '',
              companyStatus: companyData.status || '',
              address: companyData.address || '',
              phone: companyData.phone || '',
              website: companyData.website || '',
              rcNumber: companyData.rcNumber || '',
              ninea: companyData.ninea || '',
              email: currentUser.email,
              companyLogo: companyData.logo || '',
              createdAt: new Date()
            };

            await setDoc(profileRef, defaultData);
            setProfileData(defaultData);
          }

          setLoading(false);
        } catch (error) {
          console.error("Erreur lors du chargement du profil:", error);
          setErrorMessage("Erreur lors du chargement du profil");
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [currentUser]);


  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Format de fichier non supporté. Utilisez JPEG, PNG ou SVG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("La taille du fichier ne doit pas dépasser 2MB");
      return;
    }

    try {
      setLogoUploading(true);
      const storageRef = ref(storage, `companyLogos/${companyId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setProfileData(prev => ({
        ...prev,
        companyLogo: downloadURL
      }));
      setLogoUploading(false);
      setSuccessMessage("Logo téléchargé avec succès");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error uploading logo:", error);
      setErrorMessage("Erreur lors du téléchargement du logo");
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (!companyId) {
        setErrorMessage("Impossible de trouver l'identifiant de l'entreprise.");
        return;
      }

      const profileRef = doc(db, `companies/${companyId}/profiles`, currentUser.uid);
      await updateDoc(profileRef, profileData);

      setSuccessMessage("Profil mis à jour avec succès");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Erreur lors de la mise à jour du profil");
    }
  };

  const shouldShowSection = (section) => {
    if (!currentUser) return false;

    const role = currentUser.role;

    if ([ROLES.SUPERADMIN, ROLES.ADMIN].includes(role)) {
      return true; // Accès total
    }

    if (role === ROLES.COMPTABLE) {
      return section !== 'company'; // Comptable ne touche pas à la structure
    }

    if (role === ROLES.CHARGE_COMPTE) {
      return section === 'personal' || section === 'invoice'; // accès limité
    }

    if (role === ROLES.LECTEUR) {
      return section === 'personal';
    }

    return false;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        sidebarOpen={true}
        activeTab="profile"
        setActiveTab={() => { }}
        setSidebarOpen={() => { }}
      />

      <div className="profile-container">
        <h1 className="profile-header">Profil de l'Entreprise</h1>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Personal Information Section */}
          <div className="form-section">
            <h2>Informations Personnelles</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleChange}
                  placeholder="Votre nom"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  placeholder="Email professionnel"
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  placeholder="Numéro de téléphone"
                />
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          {shouldShowSection('company') && (
            <div className="form-section">
              <h2>Informations de l'Entreprise</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom de l'entreprise</label>
                  <input
                    type="text"
                    name="companyName"
                    value={profileData.companyName}
                    onChange={handleChange}
                    placeholder="Nom officiel de l'entreprise"
                  />
                </div>
                <div className="form-group">
                  <label>Statut de l'entreprise</label>
                  <select
                    name="companyStatus"
                    value={profileData.companyStatus}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un statut</option>
                    <option value="SARL">SARL</option>
                    <option value="SA">SA</option>
                    <option value="SAS">SAS</option>
                    <option value="EI">Entreprise Individuelle</option>
                    <option value="Autoentrepreneur">Autoentrepreneur</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    placeholder="Adresse de l'entreprise"
                  />
                </div>
                <div className="form-group">
                  <label>Site Web</label>
                  <input
                    type="url"
                    name="website"
                    value={profileData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Numéro RC</label>
                  <input
                    type="text"
                    name="rcNumber"
                    value={profileData.rcNumber}
                    onChange={handleChange}
                    placeholder="Numéro de registre du commerce"
                  />
                </div>
                <div className="form-group">
                  <label>NINEA</label>
                  <input
                    type="text"
                    name="ninea"
                    value={profileData.ninea}
                    onChange={handleChange}
                    placeholder="Numéro d'identification nationale"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Company Logo Section */}
          <div className="form-section">
            <h2>Logo de l'Entreprise</h2>
            <div className="logo-upload-container">
              {profileData.companyLogo ? (
                <div className="logo-preview">
                  <img src={profileData.companyLogo} alt="Company Logo" />
                  <button
                    type="button"
                    className="btn-change-logo"
                    onClick={() => document.getElementById('logoUpload').click()}
                  >
                    Changer le logo
                  </button>
                </div>
              ) : (
                <div className="logo-upload-placeholder">
                  <label htmlFor="logoUpload" className="upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Télécharger un logo</span>
                  </label>
                </div>
              )}
              <input
                id="logoUpload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              {logoUploading && <p>Téléchargement en cours...</p>}
              <small>Format recommandé : PNG ou SVG (max 2MB)</small>
            </div>
          </div>

          {/* Bank Information Section */}
          {shouldShowSection('bank') && (
            <div className="form-section">
              <h2>Coordonnées Bancaires</h2>
              <div className="form-group">
                <label>RIB</label>
                <textarea
                  name="rib"
                  value={profileData.rib}
                  onChange={handleChange}
                  placeholder="Entrez les détails de votre RIB"
                  rows="4"
                ></textarea>
              </div>
            </div>
          )}

          {/* Invoice Customization Section */}
          {shouldShowSection('invoice') && (
            <div className="form-section">
              <h2>Personnalisation des Factures</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Couleur principale</label>
                  <div className="color-picker-container">
                    <input
                      type="color"
                      name="invoiceColor"
                      value={profileData.invoiceColor}
                      onChange={handleChange}
                    />
                    <span>{profileData.invoiceColor}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Police de caractère</label>
                  <select
                    name="invoiceFont"
                    value={profileData.invoiceFont}
                    onChange={handleChange}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Modèle de facture</label>
                  <select
                    name="invoiceTemplate"
                    value={profileData.invoiceTemplate}
                    onChange={handleChange}
                  >
                    <option value="classic">Classique</option>
                    <option value="modern">Moderne</option>
                    <option value="minimal">Minimaliste</option>
                    <option value="professional">Professionnel</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Qualité PDF</label>
                  <select
                    name="pdfQuality"
                    value={profileData.pdfQuality}
                    onChange={handleChange}
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-save">
              Enregistrer les modifications
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Profile;
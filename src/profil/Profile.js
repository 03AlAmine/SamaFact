import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../auth/AuthContext';
import './Profile.css';
import { db, storage } from '../firebase';
import { ROLES } from '../auth/permissions';
import { FaArrowLeft, FaCloudUploadAlt, FaSave, FaEye, FaKey, FaLock, FaTimes } from "react-icons/fa";

const Profile = () => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState({
    name: '',
    lastName: '',
    username: '',
    email: '',
    phone: ''
  });

  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyLogo: '',
    companyStatus: '',
    address: '',
    region: '',
    country: '',
    website: '',
    rcNumber: '',
    ninea: '',
    phone: '',
    email: '',
    ribCBAO: '',
    ribBIS: '',
    ribOther1: '',
    ribOther1Label: '',
    ribOther2: '',
    ribOther2Label: '',

    invoiceColor: '#667eea',
    invoiceFont: 'Arial',
    invoiceTemplate: 'classic',
    pdfQuality: 'high'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [logoUploading, setLogoUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          // Récupérer les données utilisateur
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (!userDoc.exists()) throw new Error("Utilisateur non trouvé");

          const userData = userDoc.data();
          const companyId = userData.companyId;
          setCompanyId(companyId);

          // Récupérer le profil utilisateur
          const profileRef = doc(db, `companies/${companyId}/profiles`, currentUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setUserProfile({
              name: profileData.name || currentUser.name || '',
              lastName: profileData.lastName || '',
              username: profileData.username || userData.username || '',
              email: profileData.email || currentUser.email,
              phone: profileData.phone || ''
            });
          } else {
            // Créer un profil par défaut
            const defaultProfile = {
              name: '',
              lastName: '',
              username: userData.username || '',
              email: currentUser.email,
              phone: '',
              createdAt: new Date()
            };
            await setDoc(profileRef, defaultProfile);
            setUserProfile(defaultProfile);
          }

          // Récupérer les données de l'entreprise
          const companyRef = doc(db, 'companies', companyId);
          const companySnap = await getDoc(companyRef);

          if (companySnap.exists()) {
            const companyDataFromDB = companySnap.data();
            setCompanyData({
              companyName: companyDataFromDB.name || '',
              companyLogo: companyDataFromDB.logo || '',
              companyStatus: companyDataFromDB.status || '',
              address: companyDataFromDB.address || '',
              region: companyDataFromDB.region || 'Dakar',
              country: companyDataFromDB.country || 'Sénégal',
              website: companyDataFromDB.website || '',
              rcNumber: companyDataFromDB.rcNumber || '',
              ninea: companyDataFromDB.ninea || '',
              phone: companyDataFromDB.phone || '',
              email: companyDataFromDB.email || '',
              ribCBAO: companyDataFromDB.ribCBAO || '',
              ribBIS: companyDataFromDB.ribBIS || '',
              ribOther1: companyDataFromDB.ribOther1 || '',
              ribOther1Label: companyDataFromDB.ribOther1Label || '',
              ribOther2: companyDataFromDB.ribOther2 || '',
              ribOther2Label: companyDataFromDB.ribOther2Label || '',

              invoiceColor: companyDataFromDB.invoiceColor || '#667eea',
              invoiceFont: companyDataFromDB.invoiceFont || 'Arial',
              invoiceTemplate: companyDataFromDB.invoiceTemplate || 'classic',
              pdfQuality: companyDataFromDB.pdfQuality || 'high'
            });
          }

          setLoading(false);
        } catch (error) {
          console.error("Erreur lors du chargement:", error);
          setErrorMessage("Erreur lors du chargement des données");
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser]);

  const handleUserProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompanyDataChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
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

      setCompanyData(prev => ({
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

  const canEditCompany = () => {
    if (!currentUser) return false;
    const role = currentUser.role;
    return [ROLES.SUPERADMIN, ROLES.SUPADMIN].includes(role);
  };

  const canEditInvoice = () => {
    if (!currentUser) return false;
    const role = currentUser.role;
    return [ROLES.SUPERADMIN, ROLES.SUPADMIN, ROLES.ADMIN, ROLES.COMPTABLE].includes(role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !companyId) return;

    try {
      // Mettre à jour le profil utilisateur (toujours autorisé)
      const profileRef = doc(db, `companies/${companyId}/profiles`, currentUser.uid);
      await updateDoc(profileRef, {
        ...userProfile,
        updatedAt: new Date()
      });

      // Mettre à jour aussi le document utilisateur principal pour le username
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username: userProfile.username,
        updatedAt: new Date()
      });

      // Mettre à jour les données de l'entreprise (seulement si autorisé)
      if (canEditCompany() || canEditInvoice()) {
        const companyRef = doc(db, 'companies', companyId);
        const companyUpdateData = {};

        if (canEditCompany()) {
          Object.assign(companyUpdateData, {
            name: companyData.companyName,
            status: companyData.companyStatus,
            address: companyData.address,
            region: companyData.region,
            country: companyData.country,
            website: companyData.website,
            rcNumber: companyData.rcNumber,
            ninea: companyData.ninea,
            phone: companyData.phone,
            email: companyData.email,
            ribCBAO: companyData.ribCBAO,
            ribBIS: companyData.ribBIS,
            ribOther1: companyData.ribOther1,
            ribOther1Label: companyData.ribOther1Label,
            ribOther2: companyData.ribOther2,
            ribOther2Label: companyData.ribOther2Label,
            logo: companyData.companyLogo,
            updatedAt: new Date()
          });
        }


        // Ajouter les préférences de facturation si autorisé
        if (canEditInvoice()) {
          Object.assign(companyUpdateData, {
            invoiceColor: companyData.invoiceColor,
            invoiceFont: companyData.invoiceFont,
            invoiceTemplate: companyData.invoiceTemplate,
            pdfQuality: companyData.pdfQuality
          });
        }

        await updateDoc(companyRef, companyUpdateData);
      }

      setSuccessMessage("Profil mis à jour avec succès");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error updating data:", error);
      setErrorMessage("Erreur lors de la mise à jour");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validation des mots de passe
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setPasswordLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      // Réauthentifier l'utilisateur
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Mettre à jour le mot de passe
      await updatePassword(user, passwordData.newPassword);

      setSuccessMessage("Mot de passe modifié avec succès");
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        setErrorMessage("Mot de passe actuel incorrect");
      } else if (error.code === 'auth/requires-recent-login') {
        setErrorMessage("Veuillez vous reconnecter avant de changer votre mot de passe");
      } else {
        setErrorMessage("Erreur lors de la modification du mot de passe");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrorMessage('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (loading) {
    return (
      <div className="loading-container-elegant">
        <div className="spinner-elegant"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="profile-container-elegant">

      <button
        className="p-floating-back-button"
        onClick={() => window.history.back()}
      >
        <FaArrowLeft className="button-icon" />
        <span className="button-text">Retour</span>
      </button>

      <h1 className="profile-header-elegant">
        Profil
      </h1>

      {successMessage && (
        <div className="alert-elegant alert-success-elegant">
          <FaSave />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert-elegant alert-danger-elegant">
          <FaSave />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form-elegant">
        {/* Personal Information Section */}
        <div className="form-section-elegant">
          <h2>Informations Personnelles</h2>
          <div className="form-grid-elegant">
            <div className="form-group-elegant">
              <label>Prénom</label>
              <input
                type="text"
                name="name"
                value={userProfile.name}
                onChange={handleUserProfileChange}
                placeholder="Votre prénom"
              />
            </div>
            <div className="form-group-elegant">
              <label>Nom</label>
              <input
                type="text"
                name="lastName"
                value={userProfile.lastName}
                onChange={handleUserProfileChange}
                placeholder="Votre nom"
              />
            </div>
            <div className="form-group-elegant">
              <label>Nom d'utilisateur</label>
              <div className="username-input-container">
                <input
                  type="text"
                  name="username"
                  value={userProfile.username}
                  onChange={handleUserProfileChange}
                  placeholder="Votre nom d'utilisateur"
                  className="username-input"
                />
              </div>
            </div>
            <div className="form-group-elegant">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={userProfile.email}
                onChange={handleUserProfileChange}
                placeholder="Email professionnel"
              />
            </div>
            <div className="form-group-elegant">
              <label>Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={userProfile.phone}
                onChange={handleUserProfileChange}
                placeholder="Numéro de téléphone"
              />
            </div>
            <div className="form-group-elegant">
              <label>Mot de passe</label>
              <div className="password-action-container">
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="btn-change-password"
                >
                  <FaKey />
                  Modifier le mot de passe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information Section */}
        <div className="form-section-elegant">
          <h2>Informations de l'Entreprise</h2>
          <div className="form-grid-elegant">
            <div className="form-group-elegant">
              <label>Nom de l'entreprise</label>
              <input
                type="text"
                name="companyName"
                value={companyData.companyName}
                onChange={handleCompanyDataChange}
                placeholder="Nom officiel de l'entreprise"
                disabled={!canEditCompany()}
              />
            </div>
            <div className="form-group-elegant">
              <label>Statut de l'entreprise</label>
              <select
                name="companyStatus"
                value={companyData.companyStatus}
                onChange={handleCompanyDataChange}
                disabled={!canEditCompany()}
              >
                <option value="">Sélectionner un statut</option>
                <option value="SARL">SARL</option>
                <option value="SA">SA</option>
                <option value="SAS">SAS</option>
                <option value="EI">Entreprise Individuelle</option>
                <option value="Autoentrepreneur">Autoentrepreneur</option>
              </select>
            </div>

            {/* AJOUTEZ CES CHAMPS : */}
            <div className="form-group-elegant">
              <label>Téléphone de l'entreprise</label>
              <input
                type="tel"
                name="phone"
                value={companyData.phone}
                onChange={handleCompanyDataChange}
                placeholder="Numéro de téléphone"
                disabled={!canEditCompany()}
              />
            </div>

            <div className="form-group-elegant">
              <label>Email de contact</label>
              <input
                type="email"
                name="email"
                value={companyData.email}
                onChange={handleCompanyDataChange}
                placeholder="Email de contact"
                disabled={!canEditCompany()}
              />
            </div>

            <div className="form-group-elegant">
              <label>Adresse *</label>
              <input
                type="text"
                name="address"
                value={companyData.address}
                onChange={handleCompanyDataChange}
                placeholder="Rue, numéro, bâtiment"
                disabled={!canEditCompany()}
              />
            </div>

            {/* Région */}
            <div className="form-group-elegant">
              <label>Région *</label>
              <input
                type="text"
                name="region"
                value={companyData.region}
                onChange={handleCompanyDataChange}
                placeholder="Région"
                disabled={!canEditCompany()}
              />
            </div>

            {/* Pays */}
            <div className="form-group-elegant">
              <label>Pays *</label>
              <select
                name="country"
                value={companyData.country}
                onChange={handleCompanyDataChange}
                disabled={!canEditCompany()}
              >
                <option value="Sénégal">Sénégal</option>
                <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                <option value="Mali">Mali</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Niger">Niger</option>
                <option value="Guinée">Guinée</option>
                <option value="Bénin">Bénin</option>
                <option value="Togo">Togo</option>
                <option value="France">France</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="form-group-elegant">
              <label>Site Web</label>
              <input
                type="url"
                name="website"
                value={companyData.website}
                onChange={handleCompanyDataChange}
                placeholder="https://example.com"
                disabled={!canEditCompany()}
              />
            </div>
            <div className="form-group-elegant">
              <label>Numéro RC</label>
              <input
                type="text"
                name="rcNumber"
                value={companyData.rcNumber}
                onChange={handleCompanyDataChange}
                placeholder="Numéro de registre du commerce"
                disabled={!canEditCompany()}
              />
            </div>
            <div className="form-group-elegant">
              <label>NINEA</label>
              <input
                type="text"
                name="ninea"
                value={companyData.ninea}
                onChange={handleCompanyDataChange}
                placeholder="Numéro d'identification nationale"
                disabled={!canEditCompany()}
              />
            </div>
          </div>
        </div>
        {/* Bank Information Section */}
        <div className="form-section-elegant">
          <h2>Coordonnées Bancaires</h2>
          <div className="form-grid-elegant">
            <div className="form-group-elegant">
              <label>RIB CBAO</label>
              <input
                type="text"
                name="ribCBAO"
                value={companyData.ribCBAO}
                onChange={handleCompanyDataChange}
                placeholder="RIB CBAO (ex: SN012 01201 036182616901 96)"
                disabled={!canEditCompany()}
              />
            </div>

            <div className="form-group-elegant">
              <label>RIB BIS</label>
              <input
                type="text"
                name="ribBIS"
                value={companyData.ribBIS}
                onChange={handleCompanyDataChange}
                placeholder="RIB BIS (ex: SN079 01101 2254061204001 77)"
                disabled={!canEditCompany()}
              />
            </div>

            <div className="form-group-elegant">
              <label>Autre RIB 1 - Label</label>
              <input
                type="text"
                name="ribOther1Label"
                value={companyData.ribOther1Label}
                onChange={handleCompanyDataChange}
                placeholder="Nom de la banque (ex: BICIS)"
                disabled={!canEditCompany()}
              />
            </div>

            <div className="form-group-elegant">
              <label>Autre RIB 1 - Numéro</label>
              <input
                type="text"
                name="ribOther1"
                value={companyData.ribOther1}
                onChange={handleCompanyDataChange}
                placeholder="Numéro du RIB"
                disabled={!canEditCompany()}
              />
            </div>

            <div className="form-group-elegant">
              <label>Autre RIB 2 - Label</label>
              <input
                type="text"
                name="ribOther2Label"
                value={companyData.ribOther2Label}
                onChange={handleCompanyDataChange}
                placeholder="Nom de la banque"
                disabled={!canEditCompany()}
              />
            </div>

            <div className="form-group-elegant">
              <label>Autre RIB 2 - Numéro</label>
              <input
                type="text"
                name="ribOther2"
                value={companyData.ribOther2}
                onChange={handleCompanyDataChange}
                placeholder="Numéro du RIB"
                disabled={!canEditCompany()}
              />
            </div>
          </div>
        </div>

        {/* Company Logo Section */}
        <div className="form-section-elegant">
          <h2>
            Logo de l'Entreprise
          </h2>
          <div className="logo-upload-container-elegant">
            {companyData.companyLogo ? (
              <div className="logo-preview-elegant">
                <img src={companyData.companyLogo} alt="Company Logo" />
                {canEditCompany() && (
                  <button
                    type="button"
                    className="btn-change-logo-elegant"
                    onClick={() => document.getElementById('logoUploadElegant').click()}
                  >
                    <FaCloudUploadAlt />
                    Changer le logo
                  </button>
                )}
              </div>
            ) : (
              <div className="logo-upload-placeholder-elegant">
                {canEditCompany() ? (
                  <label htmlFor="logoUploadElegant" className="upload-label-elegant">
                    <FaCloudUploadAlt />
                    <span>Télécharger un logo</span>
                  </label>
                ) : (
                  <div className="no-logo-message">
                    <FaEye />
                    Aucun logo téléchargé
                  </div>
                )}
              </div>
            )}
            {canEditCompany() && (
              <input
                id="logoUploadElegant"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
            )}
            {logoUploading && <p>Téléchargement en cours...</p>}
            <small>Format recommandé : PNG ou SVG (max 2MB)</small>
          </div>
        </div>

        <div className="form-section-elegant">
          <h2>Personnalisation des Factures</h2>
          <div className="form-grid-elegant">
            <div className="form-group-elegant">
              <label>Couleur principale</label>
              <div className="color-picker-container-elegant">
                <input
                  type="color"
                  name="invoiceColor"
                  value={companyData.invoiceColor}
                  onChange={handleCompanyDataChange}
                  disabled={!canEditInvoice()}
                />
                <span>{companyData.invoiceColor}</span>
              </div>
              <small>
                Thème détecté: {
                  companyData.invoiceColor &&
                  (() => {
                    // Fonction corrigée de calcul de teinte
                    const hex = companyData.invoiceColor.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16) / 255;
                    const g = parseInt(hex.substring(2, 4), 16) / 255;
                    const b = parseInt(hex.substring(4, 6), 16) / 255;

                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    let h = 0;

                    if (max !== min) {
                      const delta = max - min;
                      if (max === r) {
                        h = ((g - b) / delta) % 6;
                      } else if (max === g) {
                        h = (b - r) / delta + 2;
                      } else {
                        h = (r - g) / delta + 4;
                      }

                      h = Math.round(h * 60);
                      if (h < 0) h += 360;
                    }

                    // Déterminer le thème
                    if (h >= 30 && h <= 90) return 'Jaune/Vert';
                    else if (h >= 90 && h <= 150) return 'Vert';
                    else if (h >= 150 && h <= 210) return 'Cyan';
                    else if (h >= 210 && h <= 270) return 'Bleu';
                    else if (h >= 270 && h <= 330) return 'Violet/Pourpre';
                    else return 'Rouge/Orange';
                  })()
                }
              </small>
            </div>

            {/* Option: Sélecteur de thème prédéfini */}
            <div className="form-group-elegant">
              <label>Thème prédéfini</label>
              <select
                value=""
                onChange={(e) => {
                  const color = e.target.value;
                  if (color) {
                    setCompanyData(prev => ({
                      ...prev,
                      invoiceColor: color
                    }));
                  }
                }}
                disabled={!canEditInvoice()}
              >
                <option value="">Choisir un thème...</option>
                <option value="#218838">Thème Vert</option>
                <option value="#2c6fbb">Thème Bleu</option>
                <option value="#8a2be2">Thème Pourpre</option>
                <option value="#e67e22">Thème Orange</option>
                <option value="#d9534f">Thème Rouge</option>
                <option value="#5bc0de">Thème Cyan</option>
              </select>
            </div>

            <div className="form-group-elegant">
              <label>Police de caractère</label>
              <select
                name="invoiceFont"
                value={companyData.invoiceFont}
                onChange={handleCompanyDataChange}
                disabled={!canEditInvoice()}
              >
                <option value="Helvetica">Helvetica</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bouton d'enregistrement */}
        <div className="form-actions-elegant">
          <button type="submit" className="btn-save-elegant">
            <FaSave />
            Enregistrer les modifications
          </button>
        </div>
      </form>

      {/* Modal de modification du mot de passe */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <FaLock />
                Modifier le mot de passe
              </h3>
              <button onClick={closePasswordModal} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group-elegant">
                <label>Mot de passe actuel</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Votre mot de passe actuel"
                  required
                />
              </div>
              <div className="form-group-elegant">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                  required
                />
              </div>
              <div className="form-group-elegant">
                <label>Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirmer le nouveau mot de passe"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="btn-cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
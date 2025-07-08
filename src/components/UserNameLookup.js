import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const UserNameLookup = ({ userId }) => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId) {
        setUserName('Système');
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || userDoc.data().email || 'Utilisateur inconnu');
        } else {
          setUserName(`ID: ${userId.slice(0, 6)}...`);
        }
      } catch (error) {
        console.error("Erreur récupération utilisateur:", error);
        setUserName(`ID: ${userId.slice(0, 6)}...`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserName();
  }, [userId]);

  if (loading) return <span className="loading-text">Chargement...</span>;

  return <span className="user-name">{userName}</span>;
};

export default UserNameLookup;
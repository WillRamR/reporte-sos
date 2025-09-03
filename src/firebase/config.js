import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Configuración de Firebase - Reemplaza con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyA3bi8XTrX78VUizi0d7h28hHoLIWs-mpo",
  authDomain: "unicach-app.firebaseapp.com",
  projectId: "unicach-app",
  storageBucket: "unicach-app.appspot.com",
  messagingSenderId: "347486645459",
  appId: "1:347486645459:web:d0ba7cdcf0c8327c0b7826",
  measurementId: "G-FSDJTRWMT8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Messaging para notificaciones push (opcional)
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Messaging not supported:', error);
  }
}

export { messaging };

// Función para obtener token de FCM
export const getFCMToken = async () => {
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: 'TU_VAPID_KEY' // Opcional para web push
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Escuchar mensajes en primer plano
export const onMessageListener = () => {
  if (!messaging) return Promise.reject('Messaging not supported');

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export default app;

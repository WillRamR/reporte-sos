# Botón Pánico - WebView

Aplicación web progresiva (PWA) diseñada para funcionar como WebView. Incluye funcionalidades de botón de pánico con captura de fotos, grabación de audio, geolocalización y almacenamiento en Firebase.

## Características

- Botón de Pánico: Activación rápida de emergencia
- Captura de Fotos: Tomar fotos con la cámara del dispositivo
- Geolocalización: Obtener y monitorear ubicación GPS
- Grabación de Audio: Grabar audio con el micrófono
- Almacenamiento en la nube automático
- Funciona offline y se instala como app nativa
- Manejo inteligente de permisos del dispositivo

## Requisitos Previos

- Node.js 16+
- npm o yarn
- Cuenta de Firebase

## Instalación Rápida

1. **Instalar dependencias**:
npm install

2. **Configurar Firebase**:
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
   - Habilita Authentication, Firestore, Storage y Messaging
   - Copia las credenciales a `src/firebase/config.js`

3. **Ejecutar en desarrollo**:
npm run dev

4. **Compilar para producción**:
npm run build

## Configuración de Firebase

### 1. Crear Proyecto Firebase

- Ve a [Firebase Console](https://console.firebase.google.com)
- Crea un nuevo proyecto
- Habilita Google Analytics (opcional)

## Estructura del Proyecto

botonpanico/
├── src/
│   ├── components/
│   │   ├── CameraCapture.jsx    # Captura de fotos
│   │   ├── LocationTracker.jsx  # Geolocalización
│   │   └── AudioRecorder.jsx    # Grabación de audio
│   ├── firebase/
│   │   └── config.js           # Configuración Firebase
│   ├── hooks/
│   │   └── usePermissions.js   # Hook para permisos
│   ├── App.jsx                 # Componente principal
│   ├── App.css                 # Estilos principales
│   └── main.jsx               # Punto de entrada
├── package.json
├── vite.config.js             # Configuración Vite + PWA
└── index.html

## Scripts Disponibles

npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
npm run lint     # Verificar código

## Solución de Problemas

### Error: "Camera not accessible"

- Verificar permisos en AndroidManifest.xml
- Confirmar que WebView tiene permisos de cámara
- Usar HTTPS en producción

### Error: "Geolocation denied"

- Verificar permisos de ubicación
- Configurar `onGeolocationPermissionsShowPrompt`
- Usar HTTPS para geolocalización

### Error: "Firebase not initialized"

- Verificar credenciales
- Confirmar que los servicios están habilitados
- Revisar reglas de seguridad

### Error: "Audio recording failed"

- Verificar permisos de micrófono
- Confirmar soporte de MediaRecorder
- Usar HTTPS para grabación

## APIs Utilizadas

- **MediaDevices API**: Cámara y micrófono
- **Geolocation API**: GPS y ubicación
- **MediaRecorder API**: Grabación de audio
- **Firebase SDK**: Almacenamiento y base de datos
- **Service Worker**: Funcionalidad PWA

## Licencia

MIT License - Ver archivo LICENSE para detalles.

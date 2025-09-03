# Reporte SOS

Aplicación web progresiva (PWA) diseñada para funcionar como WebView. Visualiza los registros de geolocalización, fotos y audio almacenados en Firebase.

## Características

- Reportes: Generación de reportes de la geolocalización, fotos y audio almacenados en Firebase
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

reporte-sos/
├── src/
│   ├── components/
│   │   ├── SuccessDialog.jsx    # Dialogo de exito
│   ├── firebase/
│   │   └── config.js           # Configuración Firebase
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

### Error: "Firebase not initialized"

- Verificar credenciales
- Confirmar que los servicios están habilitados
- Revisar reglas de seguridad

## APIs Utilizadas

- **Firebase SDK**: Almacenamiento y base de datos
- **Service Worker**: Funcionalidad PWA

## Licencia

MIT License - Ver archivo LICENSE para detalles.

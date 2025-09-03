// Configuración de Google OAuth - Equivalente a setAuthConfig en PHP
const CLIENT_CONFIG = {
    client_id: "",
    client_secret: "",
    project_id: "",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    redirect_uris: [],
    javascript_origins: []
};

const SCOPES = ['profile', 'email']; // Equivalente a addScope en PHP
const TOKEN_INFO_URL = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';

class GoogleAuthService {
    constructor() {
        this.client = null;
        this.accessToken = null;
        this.user = null;
        this.listeners = [];
        this.sessionData = null;
        this.initializeClient();
    }

    // Equivalente al método index() en PHP
    async initializeClient() {
        this.client = {
            config: CLIENT_CONFIG,
            scopes: SCOPES,
            accessToken: this.getStoredAccessToken() // Equivalente a $this->session->userdata('googleAccessToken')
        };

        // Si hay un token almacenado, ejecutar la lógica del método index()
        if (this.client.accessToken) {
            await this.index();
        } else {
            // Si no hay token, redirigir a oauth2callback
            await this.oauth2callback();
        }

        await this.loadGoogleScript();
    }

    // Equivalente al método index() de PHP
    async index() {
        const accessToken = this.getStoredAccessToken();

        if (accessToken) {
            await this.setAccessToken(accessToken);

            if (await this.isAccessTokenExpired()) {
                this.showError('La sincronización con Google ha expirado, es necesario ingresar nuevamente');
                return;
            }

            // Verificación con Google API (equivalente al cURL en PHP)
            const urlVerificacionGoogle = `${TOKEN_INFO_URL}${accessToken.id_token}`;

            try {
                const response = await fetch(urlVerificacionGoogle);
                const user = await response.json();

                // Verificar dominio unicach.mx
                if (user.hd === 'unicach.mx') {
                    // Datos de Google
                    const emailGoogle = user.email;
                    const imagenGoogle = user.picture;
                    const dominioGoogle = user.hd;
                    const nombreCompletoGoogle = user.name;
                    const nombresGoogle = user.given_name;
                    const apellidosGoogle = user.family_name;

                    // Crear datos de sesión solo con datos de Google
                    const datosSession = {
                        emailG: emailGoogle,
                        nombreCortoG: nombresGoogle,
                        logueado: 1,
                        googleAccessToken: accessToken,
                        // Datos adicionales para la UI
                        id: user.sub,
                        name: nombreCompletoGoogle,
                        picture: imagenGoogle,
                        email: emailGoogle,
                        given_name: nombresGoogle,
                        family_name: apellidosGoogle,
                        hd: dominioGoogle
                    };

                    this.sessionData = datosSession;
                    this.user = datosSession;

                    // Guardar en localStorage
                    localStorage.setItem('sessionData', JSON.stringify(datosSession));
                    localStorage.setItem('google_user', JSON.stringify(datosSession));

                    this.notifyListeners(this.user);

                    // Usuario autenticado correctamente
                    console.log('Usuario autenticado correctamente:', emailGoogle);
                } else {
                    this.showAccessDenied(user.email);
                }

            } catch (error) {
                console.error('Error en verificación con Google:', error);
                this.showError('Error al verificar con Google');
            }
        } else {
            // Equivalente a redirect('autenticacion/oauth2callback')
            await this.oauth2callback();
        }
    }

    // Cargar Google Identity Services
    loadGoogleScript() {
        if (window.google) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => {
                this.initializeGoogleAuth();
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Inicializar Google Auth
    initializeGoogleAuth() {
        if (!window.google) return;

        window.google.accounts.id.initialize({
            client_id: CLIENT_CONFIG.client_id,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: false
        });
    }

    // Equivalente a setAccessToken en PHP
    async setAccessToken(accessToken) {
        this.accessToken = accessToken;
        this.client.accessToken = accessToken;

        // Guardar en localStorage (equivalente a session en PHP)
        localStorage.setItem('googleAccessToken', JSON.stringify(accessToken));

        // Verificar si el token ha expirado (equivalente a isAccessTokenExpired en PHP)
        if (await this.isAccessTokenExpired()) {
            console.log('La sincronización con Google ha expirado, es necesario ingresar nuevamente');
            this.handleTokenExpired();
            return false;
        }

        // Verificar token con Google API
        if (accessToken.id_token) {
            await this.verifyTokenWithGoogle(accessToken.id_token);
        }

        return true;
    }

    // Equivalente a isAccessTokenExpired en PHP
    async isAccessTokenExpired() {
        if (!this.accessToken) return true;

        // Verificar expiración local si existe expires_at
        if (this.accessToken.expires_at) {
            const now = Math.floor(Date.now() / 1000);
            return now >= this.accessToken.expires_at;
        }

        // Si no hay expires_at, verificar con Google
        try {
            if (this.accessToken.id_token) {
                const response = await fetch(`${TOKEN_INFO_URL}${this.accessToken.id_token}`);
                return !response.ok;
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            return true;
        }

        return false;
    }

    // Equivalente a la verificación con Google API en PHP
    async verifyTokenWithGoogle(idToken) {
        try {
            const response = await fetch(`${TOKEN_INFO_URL}${idToken}`);
            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const tokenInfo = await response.json();

            // Verificar que el token pertenece a nuestro client_id
            if (tokenInfo.aud !== CLIENT_CONFIG.client_id) {
                throw new Error('Token no pertenece a este cliente');
            }

            // Extraer información del usuario
            this.user = {
                id: tokenInfo.sub,
                email: tokenInfo.email,
                name: tokenInfo.name,
                picture: tokenInfo.picture,
                given_name: tokenInfo.given_name,
                family_name: tokenInfo.family_name
            };

            localStorage.setItem('google_user', JSON.stringify(this.user));
            this.notifyListeners(this.user);

            return tokenInfo;
        } catch (error) {
            console.error('Error verificando token con Google:', error);
            this.handleTokenExpired();
            throw error;
        }
    }

    // Manejar token expirado
    handleTokenExpired() {
        this.accessToken = null;
        this.user = null;
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('google_user');
        this.notifyListeners(null);
    }

    // Obtener token almacenado (equivalente a session->userdata en PHP)
    getStoredAccessToken() {
        try {
            const stored = localStorage.getItem('googleAccessToken');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error obteniendo token almacenado:', error);
            return null;
        }
    }

    // Equivalente al método oauth2callback() de PHP
    async oauth2callback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
            // Crear URL de autorización
            const authUrl = this.createAuthUrl();
            window.location.href = authUrl;
        } else {
            try {
                // Autenticar con el código
                const token = await this.authenticate(code);

                if (token) {
                    localStorage.setItem('googleAccessToken', JSON.stringify(token));
                    // Redirigir a autenticación (equivalente a redirect('autenticacion'))
                    await this.index();
                } else {
                    this.showError('Error en la autorización del cliente de Google');
                }
            } catch (error) {
                console.error('Error en oauth2callback:', error);
                this.showError('Error en la autorización del cliente de Google');
            }
        }
    }

    // Crear URL de autorización
    createAuthUrl() {
        const params = new URLSearchParams({
            client_id: CLIENT_CONFIG.client_id,
            redirect_uri: window.location.origin + '/oauth2callback',
            scope: SCOPES.join(' '),
            response_type: 'code',
            access_type: 'offline',
            prompt: 'consent'
        });

        return `${CLIENT_CONFIG.auth_uri}?${params.toString()}`;
    }

    // Autenticar con código
    async authenticate(code) {
        try {
            const response = await fetch(CLIENT_CONFIG.token_uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code: code,
                    client_id: CLIENT_CONFIG.client_id,
                    client_secret: CLIENT_CONFIG.client_secret,
                    redirect_uri: window.location.origin + '/oauth2callback',
                    grant_type: 'authorization_code'
                })
            });

            if (response.ok) {
                const token = await response.json();
                token.expires_at = Math.floor(Date.now() / 1000) + token.expires_in;
                return token;
            }

            return null;
        } catch (error) {
            console.error('Error en authenticate:', error);
            return null;
        }
    }

    // Equivalente al método logout() de PHP
    async logout() {
        const accessToken = this.getStoredAccessToken();

        if (accessToken) {
            try {
                // Registrar logout
                console.log('Usuario cerrando sesión:', this.user?.email);

                // Revocar token
                await this.revokeToken(accessToken);

                // Destruir sesión local
                this.sessionData = null;
                this.user = null;
                this.accessToken = null;
                localStorage.removeItem('googleAccessToken');
                localStorage.removeItem('sessionData');
                localStorage.removeItem('google_user');

                this.notifyListeners(null);

                // Redirigir a logout de Google
                const logoutUrl = 'https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=' + window.location.origin;
                window.location.href = logoutUrl;

            } catch (error) {
                console.error('Error en logout:', error);
            }
        }
    }

    // Revocar token
    async revokeToken(accessToken) {
        try {
            const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken.access_token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Error revocando token:', error);
            return false;
        }
    }

    // Manejar respuesta de credenciales (para Google Identity Services)
    handleCredentialResponse(response) {
        try {
            // Crear accessToken similar al formato PHP
            const accessToken = {
                access_token: response.credential,
                id_token: response.credential,
                expires_in: 3600,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                token_type: 'Bearer',
                scope: SCOPES.join(' ')
            };

            localStorage.setItem('googleAccessToken', JSON.stringify(accessToken));
            this.index();
        } catch (error) {
            console.error('Error processing credential response:', error);
            this.notifyListeners(null);
        }
    }

    // Decodificar JWT token
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }

    // Iniciar sesión con popup
    async signInWithPopup() {
        try {
            if (!window.google) {
                // Si no está cargado Google Identity, usar OAuth flow tradicional
                await this.oauth2callback();
                return this.user;
            }

            return new Promise((resolve, reject) => {
                // Configurar callback temporal
                const originalCallback = window.google.accounts.id.callback;
                window.google.accounts.id.callback = (response) => {
                    this.handleCredentialResponse(response);
                    resolve(this.user);
                    window.google.accounts.id.callback = originalCallback;
                };

                // Mostrar el prompt de One Tap
                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // Si One Tap no se muestra, usar el botón de sign-in
                        this.renderSignInButton();
                    }
                });
            });
        } catch (error) {
            console.error('Error en signInWithPopup:', error);
            throw error;
        }
    }

    // Renderizar botón de sign-in como fallback
    renderSignInButton() {
        const buttonDiv = document.createElement('div');
        buttonDiv.id = 'google-signin-button';
        document.body.appendChild(buttonDiv);

        window.google.accounts.id.renderButton(
            buttonDiv,
            {
                theme: 'outline',
                size: 'large',
                width: 300,
                text: 'signin_with'
            }
        );

        // Hacer click automáticamente
        setTimeout(() => {
            const button = buttonDiv.querySelector('div[role="button"]');
            if (button) {
                button.click();
            }
        }, 100);
    }

    // Cerrar sesión (alias para logout)
    async signOut() {
        await this.logout();
    }

    // Obtener usuario actual
    getCurrentUser() {
        if (this.user) return this.user;

        // Intentar cargar desde localStorage
        const savedUser = localStorage.getItem('google_user');
        const savedToken = localStorage.getItem('google_token');

        if (savedUser && savedToken) {
            try {
                this.user = JSON.parse(savedUser);
                // Verificar si el token sigue siendo válido
                const tokenData = this.parseJwt(savedToken);
                if (tokenData && tokenData.exp * 1000 > Date.now()) {
                    return this.user;
                } else {
                    // Token expirado
                    this.signOut();
                }
            } catch (error) {
                console.error('Error loading saved user:', error);
                this.signOut();
            }
        }

        return null;
    }

    // Agregar listener para cambios de autenticación
    onAuthStateChanged(callback) {
        this.listeners.push(callback);
        // Llamar inmediatamente con el estado actual
        callback(this.getCurrentUser());

        // Retornar función para remover el listener
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Notificar a todos los listeners
    notifyListeners(user) {
        this.listeners.forEach(callback => callback(user));
    }


    // Mostrar error (equivalente a load->view('autenticacion/viewError'))
    showError(mensaje) {
        console.error('Error de autenticación:', mensaje);

        // Crear evento personalizado para que la UI pueda manejarlo
        const errorEvent = new CustomEvent('authError', {
            detail: { mensaje }
        });
        window.dispatchEvent(errorEvent);

        // También notificar a los listeners
        this.notifyListeners(null);
    }

    // Mostrar acceso denegado (equivalente a load->view('autenticacion/viewAccesoDenegado'))
    showAccessDenied(correo) {
        console.warn('Acceso denegado para:', correo);

        // Crear evento personalizado para que la UI pueda manejarlo
        const accessDeniedEvent = new CustomEvent('accessDenied', {
            detail: { correo }
        });
        window.dispatchEvent(accessDeniedEvent);

        // También notificar a los listeners
        this.notifyListeners(null);
    }
}

// Exportar instancia singleton
export const googleAuth = new GoogleAuthService();
export default googleAuth;

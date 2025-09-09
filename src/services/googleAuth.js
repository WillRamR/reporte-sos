// Configuración de Google OAuth - Equivalente a setAuthConfig en PHP
const CLIENT_CONFIG = {
    client_id: " ",
    client_secret: " ",
    project_id: " ",
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
                if (user.hd && user.hd === 'unicach.mx') {
                    // Datos de Google
                    const emailGoogle = user.email;
                    const imagenGoogle = user.picture;
                    const dominioGoogle = user.hd;
                    const nombreCompletoGoogle = user.name;
                    const nombresGoogle = user.given_name;
                    const apellidosGoogle = user.family_name;

                    const dataUser = await this.getUsuario(emailGoogle);

                    if (dataUser && dataUser.registro && typeof dataUser.registro === 'object') {
                        // Crear datos de sesión combinando datos de Google y de la API
                        const datosSession = {
                            emailG: emailGoogle,
                            nombreCortoG: nombresGoogle,
                            logueado: 1,
                            googleAccessToken: accessToken,
                            id: user.sub,
                            name: nombreCompletoGoogle,
                            picture: imagenGoogle,
                            email: emailGoogle,
                            given_name: nombresGoogle,
                            family_name: apellidosGoogle,
                            hd: dominioGoogle,
                            // Datos adicionales de la API SIIA
                            matricula: dataUser.registro.MATRICULA,
                            paterno: dataUser.registro.PATERNO,
                            materno: dataUser.registro.MATERNO,
                            nombres: dataUser.registro.NOMBRES,
                            tipo: dataUser.registro.TIPO,
                            descTipo: dataUser.registro.DESCTIPO,
                            sexo: dataUser.registro.SEXO
                        };

                        this.sessionData = datosSession;
                        this.user = datosSession;

                        localStorage.setItem('sessionData', JSON.stringify(datosSession));
                        localStorage.setItem('google_user', JSON.stringify(datosSession));

                        this.notifyListeners(this.user);

                        // Limpiar parámetros de URL después de autenticación exitosa
                        this.cleanUrlParameters();
                    } else {
                        this.clearAccessDeniedData();
                        this.showAccessDenied(user.email);
                    }
                } else {
                    this.clearAccessDeniedData();
                    this.showAccessDenied(user.email);
                }

            } catch (error) {
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

    handleTokenExpired() {
        this.accessToken = null;
        this.user = null;
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('google_user');
        this.notifyListeners(null);
    }

    getStoredAccessToken() {
        try {
            const stored = localStorage.getItem('googleAccessToken');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error obteniendo token almacenado:', error);
            return null;
        }
    }

    async oauth2callback() {
        // Verificar si hay código guardado desde oauth2callback.html
        const storedCode = localStorage.getItem('oauth_code');
        const callbackProcessed = localStorage.getItem('oauth_callback_processed');

        if (storedCode && callbackProcessed) {
            // Limpiar flags
            localStorage.removeItem('oauth_code');
            localStorage.removeItem('oauth_callback_processed');

            try {
                const token = await this.authenticate(storedCode);
                if (token) {
                    localStorage.setItem('googleAccessToken', JSON.stringify(token));
                    await this.index();
                } else {
                    this.showError('Error en la autorización del cliente de Google');
                }
            } catch (error) {
                console.error('Error en oauth2callback:', error);
                this.showError('Error en la autorización del cliente de Google');
            }
            return;
        }

        // Si no hay código almacenado, verificar URL actual
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
            const authUrl = this.createAuthUrl();
            window.location.href = authUrl;
        } else {
            try {
                const token = await this.authenticate(code);

                if (token) {
                    localStorage.setItem('googleAccessToken', JSON.stringify(token));
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

    createAuthUrl() {
        const params = new URLSearchParams({
            client_id: CLIENT_CONFIG.client_id,
            redirect_uri: window.location.origin + '/oauth2callback',
            scope: SCOPES.join(' '),
            response_type: 'code',
            access_type: 'offline',
            prompt: 'select_account consent'
        });

        return `${CLIENT_CONFIG.auth_uri}?${params.toString()}`;
    }

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

    async logout() {
        const accessToken = this.getStoredAccessToken();

        if (accessToken) {
            try {
                this.sessionData = null;
                this.user = null;
                this.accessToken = null;
                localStorage.removeItem('googleAccessToken');
                localStorage.removeItem('sessionData');
                localStorage.removeItem('google_user');
                this.notifyListeners(null);

            } catch (error) {
                console.error('Error en logout:', error);
            }
        }
    }

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

    handleCredentialResponse(response) {
        try {
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

    async signOut() {
        await this.logout();
    }

    getCurrentUser() {
        if (this.user) return this.user;

        const savedUser = localStorage.getItem('google_user');
        const savedToken = localStorage.getItem('google_token');

        if (savedUser && savedToken) {
            try {
                this.user = JSON.parse(savedUser);
                const tokenData = this.parseJwt(savedToken);
                if (tokenData && tokenData.exp * 1000 > Date.now()) {
                    return this.user;
                } else {
                    this.signOut();
                }
            } catch (error) {
                console.error('Error loading saved user:', error);
                this.signOut();
            }
        }

        return null;
    }

    onAuthStateChanged(callback) {
        this.listeners.push(callback);
        callback(this.getCurrentUser());

        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    notifyListeners(user) {
        this.listeners.forEach(callback => callback(user));
    }


    showError(mensaje) {
        console.error('Error de autenticación:', mensaje);

        const errorEvent = new CustomEvent('authError', {
            detail: { mensaje }
        });
        window.dispatchEvent(errorEvent);

        this.notifyListeners(null);
    }

    showAccessDenied(correo) {
        console.warn('Acceso denegado para:', correo);

        const accessDeniedEvent = new CustomEvent('accessDenied', {
            detail: {
                correo,
                mensaje: `Acceso denegado para ${correo}. Solo se permite el acceso a usuarios con dominio @unicach.mx`
            }
        });
        window.dispatchEvent(accessDeniedEvent);
    }

    clearAccessDeniedData() {
        this.accessToken = null;
        this.user = null;
        this.sessionData = null;

        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('sessionData');
        localStorage.removeItem('google_user');

        this.cleanUrlParameters();
        this.notifyListeners(null);
    }

    cleanUrlParameters() {
        // Si estamos en /oauth2callback, redirigir a la raíz
        if (window.location.pathname === '/oauth2callback') {
            window.history.replaceState({}, document.title, '/');
        } else {
            // Si estamos en otra ruta, solo limpiar parámetros
            const url = new URL(window.location);
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            url.searchParams.delete('scope');
            window.history.replaceState({}, document.title, url.pathname);
        }
    }

    clearTokensAndRetry() {
        this.clearAccessDeniedData();

        const storedToken = this.getStoredAccessToken();
        if (storedToken) {
            this.revokeToken(storedToken).catch(error => {
                console.warn('No se pudo revocar el token:', error);
            });
        }

        setTimeout(() => {
            this.oauth2callback();
        }, 100);
    }

    async getUsuario(email) {
        try {
            const url = 'https://siia.unicach.mx/restsiia/usuarios/validasos';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "id_usuario": "UNICACHSOS",
                    "token": "16fd81g111337e3123dd",
                    "correo": email
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en getUsuario:', error);
            return { registro: false, length: 0 };
        }
    }
}

// Exportar instancia singleton
export const googleAuth = new GoogleAuthService();
export default googleAuth;

/**
 * PWA Module - Módulo de Progressive Web App
 * 
 * Gestiona el registro del Service Worker y la instalación de la aplicación.
 */

const PWA = {
    deferredInstallPrompt: null,
    installBtnEl: null,

    /**
     * Inicializa el módulo PWA
     */
    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
    },

    /**
     * Registra el Service Worker
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js')
                    .then((registration) => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch((error) => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
    },

    /**
     * Configura el comportamiento del prompt de instalación
     */
    setupInstallPrompt() {
        // Elemento del botón de instalación (si existe)
        this.installBtnEl = document.getElementById('install-btn');

        // Evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredInstallPrompt = event;
            this.showInstallButton();
        });

        // Evento appinstalled
        window.addEventListener('appinstalled', () => {
            this.deferredInstallPrompt = null;
            this.hideInstallButton();
            console.log('Aplicación instalada correctamente');
        });
    },

    /**
     * Muestra el botón de instalación
     */
    showInstallButton() {
        if (this.installBtnEl) {
            this.installBtnEl.classList.remove('hidden');
        }
    },

    /**
     * Oculta el botón de instalación
     */
    hideInstallButton() {
        if (this.installBtnEl) {
            this.installBtnEl.classList.add('hidden');
        }
    },

    /**
     * Inicia el flujo de instalación de la PWA
     * @returns {Promise<boolean>} - true si el usuario instaló la app
     */
    async promptInstall() {
        if (!this.deferredInstallPrompt) {
            return false;
        }

        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        
        if (outcome === 'accepted') {
            this.deferredInstallPrompt = null;
            return true;
        }
        return false;
    }
};

// Exportar para uso global
window.PWA = PWA;

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    PWA.init();
});

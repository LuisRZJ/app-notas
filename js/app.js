/**
 * App Initialization - Punto de entrada principal de la aplicación
 * 
 * Orquesta la carga de módulos y la inicialización de componentes.
 * Este archivo actúa como coordinador entre los diferentes módulos.
 */

const App = {
    /**
     * Estado de inicialización
     */
    isInitialized: false,

    /**
     * Inicializa la aplicación
     * Coordina la carga de componentes y la inicialización de módulos
     */
    async init() {
        if (this.isInitialized) {
            console.log('App already initialized');
            return;
        }

        console.log('Initializing App...');

        // Verificar que los módulos core estén cargados
        if (!window.ComponentLoader) {
            console.error('ComponentLoader not found. Make sure js/core/components-loader.js is loaded');
            return;
        }

        if (!window.PWA) {
            console.warn('PWA module not found. Some features may not work.');
        }

        // Cargar componentes
        try {
            await window.ComponentLoader.loadComponents();
            console.log('Components loaded successfully');
        } catch (error) {
            console.error('Failed to load components:', error);
        }

        // Disparar evento de aplicación inicializada
        document.dispatchEvent(new CustomEvent('appInitialized'));
        
        this.isInitialized = true;
        console.log('App initialized successfully');
    },

    /**
     * Obtiene el tipo de página actual
     * @returns {string} - Tipo de página (notes, history, etc.)
     */
    getPageType() {
        return document.body.dataset.page || 'notes';
    }
};

// Exportar para uso global
window.App = App;

// Auto-inicializar cuando el DOM esté listo (si no se ha inicializado manualmente)
document.addEventListener('DOMContentLoaded', () => {
    // Dar tiempo a que otros scripts se carguen
    setTimeout(() => {
        if (!App.isInitialized) {
            App.init();
        }
    }, 0);
});
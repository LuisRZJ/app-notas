/**
 * Component Loader - Cargador dinámico de componentes HTML
 * 
 * Este módulo se encarga de cargar dinámicamente los componentes HTML
 * reutilizables en las páginas de la aplicación.
 */

/**
 * Carga un componente HTML en un elemento del DOM
 * @param {string} componentPath - Ruta al archivo del componente
 * @param {string} containerId - ID del contenedor donde se insertará
 * @returns {Promise<boolean>} - true si se cargó correctamente
 */
async function loadComponent(componentPath, containerId) {
    try {
        // Añadir versión para ayudar a invalidar caches accidentalmente persistentes
        const version = (window && window.APP_VERSION) ? window.APP_VERSION : String(Date.now());
        const separator = componentPath.includes('?') ? '&' : '?';
        const url = `${componentPath}${separator}v=${encodeURIComponent(version)}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
            return true;
        } else {
            console.warn(`Contenedor #${containerId} no encontrado`);
            return false;
        }
    } catch (error) {
        console.error(`Error al cargar componente ${componentPath}:`, error);
        return false;
    }
}

/**
 * Oculta la pantalla de carga con una transición suave
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        // Agregar clase para iniciar la transición de opacidad
        loadingScreen.classList.add('opacity-0');
        
        // Esperar a que termine la transición antes de ocultar completamente
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            loadingScreen.style.display = 'none';
        }, 500); // 500ms coincide con la duración de la transición
    }
}

/**
 * Muestra la pantalla de carga
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('opacity-0');
    }
}

/**
 * Carga todos los componentes principales de la página
 * Configura los componentes según la página actual
 */
async function loadComponents() {
    const pageType = document.body.dataset.page || 'notes';
    
    try {
        // Cargar pantalla de carga
        await loadComponent('./components/loading-screen.html', 'loading-screen-component');
        
        // Cargar header y controles (solo en página de notas)
        if (pageType === 'notes') {
            await loadComponent('./components/header.html', 'header-component');
            await loadComponent('./components/notes-controls.html', 'notes-controls-component');
            await loadComponent('./components/empty-notes.html', 'empty-notes-component');
        }
        
        // Cargar componentes específicos de historial (solo en página de historial)
        if (pageType === 'history') {
            await loadComponent('./components/history-header.html', 'history-header-component');
            await loadComponent('./components/weekly-overview.html', 'weekly-overview-component');
            await loadComponent('./components/history-search.html', 'history-search-component');
            await loadComponent('./components/history-filters.html', 'history-filters-component');
            await loadComponent('./components/history-messages.html', 'history-messages-component');
        }
        
        // Cargar navegación (siempre presente)
        await loadComponent('./components/navigation.html', 'navigation-component');
        
        // Cargar componentes específicos de reflexion
        if (pageType === 'reflection') {
            await loadComponent('./components/reflection-header.html', 'reflection-header-component');
            await loadComponent('./components/reflection-cards.html', 'reflection-cards-component');
            await loadComponent('./components/reflection-info.html', 'reflection-info-component');
        }

        // Cargar componentes específicos de chat IA
        if (pageType === 'chat') {
            await loadComponent('./components/chat-home-screen.html', 'chat-home-component');
            await loadComponent('./components/chat-settings-screen.html', 'chat-settings-component');
            await loadComponent('./components/chat-chat-screen.html', 'chat-chat-component');
            await loadComponent('./components/chat-confirm-modal.html', 'chat-modal-component');
        }

        // Cargar componentes específicos de estadísticas
        if (pageType === 'stats') {
            await loadComponent('./components/stats-overview.html', 'stats-overview-component');
            await loadComponent('./components/stats-distribution.html', 'stats-distribution-component');
            await loadComponent('./components/stats-timeline.html', 'stats-timeline-component');
        }
        
        // Cargar componentes de ajustes (solo en página de ajustes)
        if (pageType === 'settings') {
            await loadComponent('./components/settings-header.html', 'settings-header-component');
            await loadComponent('./components/settings-theme.html', 'settings-theme-component');
            await loadComponent('./components/settings-profile.html', 'settings-profile-component');
            await loadComponent('./components/settings-birthday.html', 'settings-birthday-component');
            await loadComponent('./components/settings-tags.html', 'settings-tags-component');
            await loadComponent('./components/settings-storage.html', 'settings-storage-component');
            await loadComponent('./components/settings-sync.html', 'settings-sync-component');
            await loadComponent('./components/settings-stats.html', 'settings-stats-component');
            await loadComponent('./components/settings-integrations.html', 'settings-integrations-component');
            await loadComponent('./components/settings-data-actions.html', 'settings-data-actions-component');
        }

        // Marcar página activa en navegación
        setActiveNavPage(pageType);
        
        // Cargar modal de formulario de notas (en páginas de notas e historial)
        if (pageType === 'notes' || pageType === 'history') {
            await loadComponent('./components/note-form-modal.html', 'note-form-modal-component');
        }
        
        // Cargar modales de confirmación (en páginas de notas e historial)
        if (pageType === 'notes' || pageType === 'history') {
            await loadComponent('./components/confirmation-modals.html', 'confirmation-modals-component');
        }
        
        // Disparar evento para indicar que los componentes están cargados
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
        
        // Ocultar pantalla de carga
        hideLoadingScreen();
        
    } catch (error) {
        console.error('Error al cargar componentes:', error);
        // Ocultar pantalla de carga incluso si hay error
        hideLoadingScreen();
    }
}

/**
 * Marca la página activa en la navegación
 * @param {string} pageType - Tipo de página actual
 */
function setActiveNavPage(pageType) {
    // Remover clase activa de todos los enlaces
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('text-blue-600');
        link.classList.add('text-slate-500');
    });
    
    // Agregar clase activa al enlace correspondiente
    let activeLink = null;
    switch(pageType) {
        case 'notes':
            activeLink = document.querySelector('a[href="index.html"]');
            break;
        case 'history':
            activeLink = document.querySelector('a[href="historial.html"]');
            break;
        case 'stats':
            activeLink = document.querySelector('a[href="estadistica.html"]');
            break;
        case 'reflection':
            activeLink = document.querySelector('a[href="reflexion.html"]');
            break;
        case 'settings':
            activeLink = document.querySelector('a[href="ajustes.html"]');
            break;
    }
    
    if (activeLink) {
        activeLink.classList.remove('text-slate-500');
        activeLink.classList.add('text-blue-600');
    }
}

// Exportar funciones para uso global
window.ComponentLoader = {
    loadComponent,
    loadComponents,
    hideLoadingScreen,
    showLoadingScreen,
    setActiveNavPage
};

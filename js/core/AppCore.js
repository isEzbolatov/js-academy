/**
 * @module AppCore
 * @description Главный контроллер приложения. Координирует модули.
 */
export class AppCore {
    /**
     * @param {import('../store/Store.js').Store} store - Единый объект состояния.
     */
    constructor(store) {
        /** @type {import('../store/Store.js').Store} */
        this.store = store;
    }

    /** Инициализация приложения */
    init() {
        console.log('JS Academy запущен');
        // Здесь позже будем инициализировать Router, Renderer, Sandbox и т.д.
    }
}
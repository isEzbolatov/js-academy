/**
 * @module Router
 * @description Простой хэш-роутер для SPA. Загружает уроки по их id из URL-хэша.
 *
 * @example
 * const router = new Router((lessonId) => { ... });
 * router.init();
 * // Переход: location.hash = '#/lesson/functions';
 */
export class Router {
    /**
     * @param {Function} onRouteChange - Колбэк, вызывается при изменении маршрута.
     * Получает id урока (строка) или null (если хэш пустой/некорректный).
     */
    constructor(onRouteChange) {
        /**
         * @private
         * @type {Function}
         */
        this._onRouteChange = onRouteChange;

        /**
         * Обработчик события hashchange (сохраняем ссылку для удаления)
         * @private
         */
        this._hashHandler = () => this._handleHashChange();
    }

    /** Запускает роутер: подписывается на изменение хэша и сразу обрабатывает текущий URL. */
    init() {
        window.addEventListener('hashchange', this._hashHandler);
        // Обрабатываем текущий хэш при загрузке
        this._handleHashChange();
    }

    /** Удаляет слушатель хэша (для очистки). */
    destroy() {
        window.removeEventListener('hashchange', this._hashHandler);
    }

    /**
     * Парсит текущий хэш и вызывает onRouteChange.
     * @private
     */
    _handleHashChange() {
        const hash = window.location.hash;
        const match = hash.match(/^#\/lesson\/(.+)$/);
        const lessonId = match ? match[1] : null;
        this._onRouteChange(lessonId);
    }
}
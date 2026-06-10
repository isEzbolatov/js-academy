/**
 * @module AppCore
 * @description Главный контроллер приложения. Инициализирует роутер, рендерер, навигацию.
 */

import { Router } from './Router.js';
import { ContentRenderer } from '../renderer/ContentRenderer.js';

export class AppCore {
    /**
     * @param {import('../store/Store.js').Store} store - Хранилище состояния.
     */
    constructor(store) {
        /** @type {import('../store/Store.js').Store} */
        this.store = store;

        /** @type {Router|null} */
        this.router = null;

        /** @type {ContentRenderer|null} */
        this.renderer = null;
    }

    /** Запускает приложение после загрузки DOM. */
    async init() {
        console.log('JS Academy запущен');

        // Инициализируем рендерер
        this.renderer = new ContentRenderer({
            theoryContainerSelector: '#theoryBlock',
            codeEditorSelector: '#codeEditor',
            store: this.store,
            lessonsUrl: './data/lessons.json'
        });

        // Загружаем список уроков
        const lessons = await this.renderer.loadLessons();
        // Строим навигационное меню
        this._buildNavigation(lessons);

        // Создаём роутер, передаём колбэк для смены урока
        this.router = new Router((lessonId) => {
            this.renderer.render(lessonId);
        });
        this.router.init();

        // Восстанавливаем предыдущий урок из состояния (если был сохранён)
        const savedLesson = this.store.getState().currentLesson;
        if (savedLesson) {
            // Устанавливаем хэш без повторного вызова колбэка
            window.location.hash = `#/lesson/${savedLesson}`;
        }
    }

    /**
     * Заполняет левую навигационную панель списком уроков.
     * @param {Array} lessons - Массив объектов уроков.
     * @private
     */
    _buildNavigation(lessons) {
        const navList = document.querySelector('.c-nav__list');
        if (!navList) return;

        navList.innerHTML = '';
        lessons.forEach((lesson) => {
            const li = document.createElement('li');
            li.className = 'c-nav__list-item';
            li.textContent = lesson.title;
            li.setAttribute('role', 'tab');
            li.setAttribute('data-lesson-id', lesson.id);
            li.addEventListener('click', () => {
                window.location.hash = `#/lesson/${lesson.id}`;
            });
            navList.appendChild(li);
        });

        // Подсвечиваем активный пункт при изменении состояния
        this.store.subscribe((newState) => {
            const items = navList.querySelectorAll('.c-nav__list-item');
            items.forEach((item) => {
                const id = item.getAttribute('data-lesson-id');
                item.classList.toggle('c-nav__list-item--active', id === newState.currentLesson);
            });
        });
    }
}
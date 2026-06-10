/**
 * @module ContentRenderer
 * @description Загружает и отображает уроки из JSON-файла в центральной панели.
 * Использует простой конвертер markdown-подобного синтаксиса в HTML.
 */

import { Store } from '../store/Store.js';

export class ContentRenderer {
    /**
     * @param {Object} options
     * @param {string} options.theoryContainerSelector - CSS-селектор для блока теории.
     * @param {string} options.codeEditorSelector - CSS-селектор для textarea с кодом.
     * @param {Store} store - Экземпляр Store для обновления состояния.
     * @param {string} [lessonsUrl='./data/lessons.json'] - URL к JSON с уроками.
     */
    constructor({ theoryContainerSelector, codeEditorSelector, store, lessonsUrl = './data/lessons.json' }) {
        /** @private */
        this._theoryEl = document.querySelector(theoryContainerSelector);
        /** @private */
        this._codeEditorEl = document.querySelector(codeEditorSelector);
        /** @private */
        this._store = store;
        /** @private */
        this._lessonsUrl = lessonsUrl;
        /** @private */
        this._lessons = [];
    }

    /** Загружает список уроков с сервера. */
    async loadLessons() {
        try {
            const response = await fetch(this._lessonsUrl);
            const data = await response.json();
            this._lessons = data.lessons;
            return this._lessons;
        } catch (error) {
            console.error('Не удалось загрузить уроки:', error);
            this._lessons = [];
            return [];
        }
    }

    /**
     * Отображает урок по id.
     * @param {string|null} lessonId - id урока или null (показать заглушку).
     */
    render(lessonId) {
        if (!lessonId) {
            this._theoryEl.innerHTML = '<p>Выберите урок из списка слева.</p>';
            this._codeEditorEl.value = '';
            return;
        }

        const lesson = this._lessons.find((l) => l.id === lessonId);
        if (!lesson) {
            this._theoryEl.innerHTML = '<p>Урок не найден.</p>';
            this._codeEditorEl.value = '';
            return;
        }

        // Отображаем теорию (простой парсинг markdown)
        this._theoryEl.innerHTML = this._parseMarkdown(lesson.content);

        // Устанавливаем код в редакторе и сохраняем в состояние
        this._codeEditorEl.value = lesson.initialCode || '';
        this._store.setState({ currentLesson: lessonId, userCode: lesson.initialCode || '' });
    }

    /**
     * Примитивный конвертер Markdown в HTML.
     * Поддерживает: ## Заголовки, ```код```, `код`, жирный **текст**, курсив *текст*.
     * @param {string} md - Строка в markdown-подобном формате.
     * @returns {string} HTML-строка.
     * @private
     */
    _parseMarkdown(md) {
        let html = md;

        // Экранируем HTML, чтобы избежать XSS, кроме тех тегов, которые мы генерируем сами
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Многострочные блоки кода ```...```
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Однострочный `код`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Заголовки ##
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

        // Жирный **текст**
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Курсив *текст*
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Переносы строк (вне блоков кода и заголовков) – заменяем двойной перевод строки на параграф
        // Но чтобы не повредить pre-теги, делаем это аккуратно: разделяем на блоки, потом обрабатываем.
        const blocks = html.split(/(<pre[\s\S]*?<\/pre>)/g);
        for (let i = 0; i < blocks.length; i++) {
            if (!blocks[i].startsWith('<pre')) {
                // Внутри обычного текста: двойной \n -> </p><p>, а одиночный -> <br>
                const paragraphs = blocks[i].split(/\n\n+/);
                blocks[i] = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            }
        }
        html = blocks.join('');

        return html;
    }
}
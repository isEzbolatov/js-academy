import { Store } from '../store/Store.js';

export class ContentRenderer {
    constructor({ theoryContainerSelector, codeEditorSelector, store, lessonsUrl = './data/lessons.json' }) {
        this._theoryEl = document.querySelector(theoryContainerSelector);
        this._codeEditorEl = document.querySelector(codeEditorSelector);
        this._store = store;
        this._lessonsUrl = lessonsUrl;
        this._lessons = [];
        this._ignoreInput = false;

        if (this._codeEditorEl) {
            this._codeEditorEl.addEventListener('input', () => {
                if (this._ignoreInput) return;
                const currentLesson = this._store.getState().currentLesson;
                if (currentLesson) {
                    const codes = this._store.getState().lessonCodes || {};
                    codes[currentLesson] = this._codeEditorEl.value;
                    this._store.setState({ lessonCodes: codes });
                }
            });
        }
    }

    async loadLessons() {
        try {
            const response = await fetch(this._lessonsUrl);
            const data = await response.json();
            this._lessons = data.lessons;
            return this._lessons;
        } catch (error) {
            console.error('Не удалось загрузить уроки:', error);
            return [];
        }
    }

    render(lessonId) {
        if (!lessonId) {
            this._theoryEl.innerHTML = '<p>Выберите урок из списка слева.</p>';
            this._ignoreInput = true;
            this._codeEditorEl.value = '';
            this._ignoreInput = false;
            return;
        }

        const lesson = this._lessons.find(l => l.id === lessonId);
        if (!lesson) {
            this._theoryEl.innerHTML = '<p>Урок не найден.</p>';
            return;
        }

        // Теория с уже подсвеченным кодом
        this._theoryEl.innerHTML = this._parseMarkdown(lesson.content);

        const state = this._store.getState();
        const savedCodes = state.lessonCodes || {};
        const code = savedCodes[lessonId] !== undefined ? savedCodes[lessonId] : lesson.initialCode || '';

        this._ignoreInput = true;
        this._codeEditorEl.value = code;
        this._ignoreInput = false;

        this._store.setState({ currentLesson: lessonId });
    }

    /**
     * Преобразует Markdown-подобную разметку в HTML.
     * Внутри кодовых блоков сразу применяет подсветку.
     */
    _parseMarkdown(md) {
        // Экранируем HTML в обычном тексте (кроме того, что сгенерируем сами)
        let html = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Находим все блоки кода ```...``` и обрабатываем их до остальной разметки
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            // Применяем подсветку к содержимому блока
            const highlighted = this._highlightSyntax(code);
            return `<pre><code>${highlighted}</code></pre>`;
        });

        // Инлайн-код `...`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Заголовки
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

        // Жирный и курсив
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Параграфы по двойным переносам строк (кроме pre-блоков)
        const blocks = html.split(/(<pre[\s\S]*?<\/pre>)/g);
        for (let i = 0; i < blocks.length; i++) {
            if (!blocks[i].startsWith('<pre')) {
                const paragraphs = blocks[i].split(/\n\n+/);
                blocks[i] = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            }
        }

        return blocks.join('');
    }

    /**
     * Подсвечивает синтаксис JavaScript-кода инлайн-стилями.
     * @param {string} code - Исходный код
     * @returns {string} HTML с раскрашенными элементами
     */
    _highlightSyntax(code) {
        // Убираем повторное экранирование (если вдруг уже есть)
        let html = code;

        // Цвета
        const c = {
            keyword: '#569CD6',
            string: '#CE9178',
            comment: '#6A9955',
            number: '#B5CEA8'
        };

        // Комментарии
        html = html.replace(/(\/\/[^\n]*)/g, `<span style="color:${c.comment};font-style:italic">$1</span>`);
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, `<span style="color:${c.comment};font-style:italic">$1</span>`);

        // Строки (двойные, одинарные, шаблонные)
        html = html.replace(/("(?:[^"\\]|\\.)*")/g, `<span style="color:${c.string}">$1</span>`);
        html = html.replace(/('(?:[^'\\]|\\.)*')/g, `<span style="color:${c.string}">$1</span>`);
        html = html.replace(/(`(?:[^`\\]|\\.)*`)/g, `<span style="color:${c.string}">$1</span>`);

        // Ключевые слова
        const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'new', 'this', 'class', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof'];
        const kw = keywords.join('|');
        html = html.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<span style="color:${c.keyword}">$1</span>`);

        // Числа
        html = html.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:${c.number}">$1</span>`);

        return html;
    }
}
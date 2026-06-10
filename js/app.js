/**
 * @file app.js - Точка входа приложения JS Academy.
 * Инициализирует основные модули после загрузки DOM.
 */

import { AppCore } from './core/AppCore.js';
import { Store } from './store/Store.js';

document.addEventListener('DOMContentLoaded', () => {
    // Создаём Store с начальным состоянием
    const store = new Store({
        currentLesson: null,      // id текущего урока
        userCode: '',             // код в редакторе
        chatHistory: []           // массив сообщений чата
    });

    // Выводим текущее состояние в консоль для проверки
    console.log('Состояние при загрузке:', store.getState());

    // Подписываемся на изменения, чтобы видеть их в консоли (для отладки)
    store.subscribe((newState, oldState) => {
        console.log('Состояние изменилось:', { oldState, newState });
    });

    // Инициализируем ядро приложения и передаём ему store
    const app = new AppCore(store);
    app.init();

    // Для демонстрации: через 2 секунды изменим состояние
    setTimeout(() => {
        store.setState({ currentLesson: 'intro', userCode: '// ваш код' });
        console.log('Обновлённое состояние:', store.getState());
    }, 2000);
});
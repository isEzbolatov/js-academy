import { AppCore } from './core/AppCore.js';
import { Store } from './store/Store.js';

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store({
        currentLesson: null,
        lessonCodes: {},
        chatHistory: []
    });

    console.log('Состояние при загрузке:', store.getState());

    store.subscribe((newState, oldState) => {
        console.log('Состояние изменилось:', { oldState, newState });
    });

    const app = new AppCore(store);
    app.init();
});
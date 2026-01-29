// GameEvents.ts

// Тип для удобства: описывает, что каждый слушатель - это объект
// с функцией (callback) и контекстом (target).
type Listener = {
    callback: Function,
    target: any
};

class SimpleEventManager {
    // Хранилище для всех событий и их слушателей.
    // Формат: { 'имя_события': [слушатель1, слушатель2], ... }
    private events: { [key: string]: Listener[] } = {};

    /**
     * Подписаться на событие.
     * @param eventName Имя события (просто строка)
     * @param callback Функция, которая выполнится
     * @param target `this` из вашего компонента
     */
    on(eventName: string, callback: Function, target: any) {
        // Если для этого события еще нет слушателей, создаем пустой массив
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        // Добавляем слушателя в массив
        this.events[eventName].push({ callback, target });
    }

    /**
     * Отписаться от события. **Обязательно вызывайте это в onDestroy!**
     */
    off(eventName: string, callback: Function, target: any) {
        const listeners = this.events[eventName];
        if (!listeners) return;

        // Оставляем в массиве только тех слушателей, которые не совпадают с нашим
        this.events[eventName] = listeners.filter(
            (listener) => listener.callback !== callback || listener.target !== target
        );
    }

    /**
     * Отправить (вызвать) событие.
     * @param eventName Имя события
     * @param data Любые данные, которые вы хотите передать (число, строка, объект)
     */
    emit(eventName: string, data?: any) {
        const listeners = this.events[eventName];
        if (!listeners) return;

        // Вызываем колбэк у каждого подписчика
        listeners.forEach((listener) => {
            listener.callback.call(listener.target, data);
        });
    }
}

// Создаем ОДИН глобальный экземпляр и экспортируем его.
// Именно его мы и будем использовать во всех скриптах.
export const gameEvents = new SimpleEventManager();
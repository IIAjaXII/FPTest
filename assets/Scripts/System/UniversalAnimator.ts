import { _decorator, Component, Vec3, UIOpacity, tween, Tween, Enum, Node } from 'cc';
import { TweenType } from './TweenTypes';


const { ccclass, property } = _decorator;

/**
 * Типы анимации для выбора в инспекторе
 */
export const AnimationType = Enum({
    Scale: 0,
    Position: 1,
    Rotation: 2,
    Opacity: 3,
});

/**
 * Универсальный компонент для анимации различных свойств объекта.
 * Поддерживает анимацию масштаба, позиции, поворота и прозрачности.
 */
@ccclass('UniversalAnimator')
export class UniversalAnimator extends Component {
    @property({
        tooltip: "Уникальное имя анимации для идентификации (например: 'scale_pulse', 'fade_in')"
    })
    public animationName: string = '';

    @property({
        type: Enum(AnimationType),
        tooltip: "Тип анимируемого свойства"
    })
    public animationType: number = AnimationType.Scale;

    // === ПАРАМЕТРЫ ДЛЯ SCALE, POSITION, ROTATION ===
    @property({
        type: Vec3,
        tooltip: "Начальное значение для Scale/Position/Rotation",
        visible() { return this.animationType !== AnimationType.Opacity; }
    })
    public startValue: Vec3 = new Vec3(1, 1, 1);

    
    @property({
        tooltip: "Использовать стартовые значения при запуске? Если выключено - анимация начнется с текущих значений объекта"
    })
    public useStartValues: boolean = true;

    @property({
        type: Vec3,
        tooltip: "Конечное значение для Scale/Position/Rotation",
        visible() { return this.animationType !== AnimationType.Opacity; }
    })
    public endValue: Vec3 = new Vec3(1.2, 1.2, 1.2);

    // === ПАРАМЕТРЫ ДЛЯ OPACITY ===
    @property({
        tooltip: "Начальная прозрачность (0-255)",
        visible() { return this.animationType === AnimationType.Opacity; }
    })
    public startOpacity: number = 255;

    @property({
        tooltip: "Конечная прозрачность (0-255)",
        visible() { return this.animationType === AnimationType.Opacity; }
    })
    public endOpacity: number = 0;

    // === ОБЩИЕ ПАРАМЕТРЫ АНИМАЦИИ ===
    @property({
        tooltip: "Длительность анимации в одну сторону (секунды)"
    })
    public duration: number = 1.0;

    @property({
        type: TweenType,
        tooltip: "Тип анимации (easing функция)"
    })
    public tweenType: string = TweenType.Linear;

    @property({
        tooltip: "Зацикливать анимацию?"
    })
    public loop: boolean = true;

    @property({
        tooltip: "Анимация туда-обратно (ping-pong)?"
    })
    public pingPong: boolean = true;

    @property({
        tooltip: "Автоматически запускать анимацию при включении объекта?"
    })
    public autoStart: boolean = true;

    @property({
        tooltip: "Задержка перед началом анимации (секунды)"
    })
    public startDelay: number = 0;

    @property({
        tooltip: "Количество повторений (0 = бесконечно, работает только если loop = true)"
    })
    public repeatCount: number = 0;

    @property({
        tooltip: "Использовать реальное время? (игнорирует замедление времени в игре)"
    })
    public useRealTime: boolean = true;

    @property({
        type: [Node],
        tooltip: "Объекты, которые будут включены при завершении анимации"
    })
    public enableOnComplete: Node[] = [];

    @property({
        type: [Node],
        tooltip: "Объекты, которые будут выключены при завершении анимации"
    })
    public disableOnComplete: Node[] = [];

    private _currentTween: Tween<any> | null = null;
    private _isAnimating: boolean = false;
    private _uiOpacity: UIOpacity | null = null;
    private _delayTimer: any = null; // Для хранения setTimeout/scheduleOnce

    onLoad() {
        // Для Opacity получаем или создаем UIOpacity компонент
        if (this.animationType === AnimationType.Opacity) {
            this._uiOpacity = this.getComponent(UIOpacity);
            if (!this._uiOpacity) {
                this._uiOpacity = this.addComponent(UIOpacity);
            }
        }
    }

    start() {
        // Инициализация происходит в onLoad, анимация запускается в onEnable
    }

    onEnable() {
        // Восстанавливаем начальные значения только если useStartValues включен
        if (this.useStartValues) {
            this.setToStartValue();
        }
        
        // Перезапускаем анимацию если autoStart включен
        if (this.autoStart) {
            if (this.startDelay > 0) {
                // Если useRealTime - используем setTimeout для реального времени
                if (this.useRealTime) {
                    this._delayTimer = setTimeout(() => {
                        this.startAnimation();
                    }, this.startDelay * 1000);
                } else {
                    // Иначе используем scheduleOnce (зависит от игрового времени)
                    this._delayTimer = this.scheduleOnce(() => {
                        this.startAnimation();
                    }, this.startDelay);
                }
            } else {
                this.startAnimation();
            }
        }
    }

    onDisable() {
        // Очищаем таймер задержки если есть
        if (this._delayTimer !== null) {
            if (this.useRealTime) {
                clearTimeout(this._delayTimer);
            } else {
                this.unschedule(this._delayTimer);
            }
            this._delayTimer = null;
        }
        this.stopAnimation();
    }

   
    /**
     * Устанавливает объект в начальное состояние
     */
    private setToStartValue() {
        switch (this.animationType) {
            case AnimationType.Scale:
                this.node.setScale(this.startValue);
                break;
            case AnimationType.Position:
                this.node.setPosition(this.startValue);
                break;
            case AnimationType.Rotation:
                this.node.setRotationFromEuler(this.startValue);
                break;
            case AnimationType.Opacity:
                if (this._uiOpacity) {
                    this._uiOpacity.opacity = this.startOpacity;
                }
                break;
        }
    }

    /**
     * Устанавливает объект в конечное состояние
     */
    private setToEndValue() {
        switch (this.animationType) {
            case AnimationType.Scale:
                this.node.setScale(this.endValue);
                break;
            case AnimationType.Position:
                this.node.setPosition(this.endValue);
                break;
            case AnimationType.Rotation:
                this.node.setRotationFromEuler(this.endValue);
                break;
            case AnimationType.Opacity:
                if (this._uiOpacity) {
                    this._uiOpacity.opacity = this.endOpacity;
                }
                break;
        }
    }

    /**
     * Обрабатывает завершение анимации - включает/выключает указанные объекты
     */
    private onAnimationComplete() {
        this._isAnimating = false;
        
        // Включаем объекты из списка enableOnComplete
        for (const node of this.enableOnComplete) {
            if (node && node.isValid) {
                node.active = true;
            }
        }
        
        // Выключаем объекты из списка disableOnComplete
        for (const node of this.disableOnComplete) {
            if (node && node.isValid) {
                node.active = false;
            }
        }
    }

    /**
     * Запускает анимацию
     */
    public startAnimation() {
        if (this.animationType === AnimationType.Opacity && !this._uiOpacity) {
            console.warn('UniversalAnimator: UIOpacity компонент не найден для анимации прозрачности!');
            return;
        }

        if (this._isAnimating) {
            this.stopAnimation();
        }

        this._isAnimating = true;
        
        // Устанавливаем стартовые значения только если useStartValues включен
        if (this.useStartValues) {
            this.setToStartValue();
        }

        // Определяем целевой объект и свойства для анимации
        let target: any;
        let properties: any;

        switch (this.animationType) {
            case AnimationType.Scale:
                target = this.node;
                properties = { scale: this.endValue };
                break;
            case AnimationType.Position:
                target = this.node;
                properties = { position: this.endValue };
                break;
            case AnimationType.Rotation:
                target = this.node;
                // Для rotation используем eulerAngles
                properties = { eulerAngles: this.endValue };
                break;
            case AnimationType.Opacity:
                target = this._uiOpacity;
                properties = { opacity: this.endOpacity };
                break;
        }

        if (this.pingPong) {
            // Анимация туда-обратно
            let backProperties: any;
            switch (this.animationType) {
                case AnimationType.Scale:
                    backProperties = { scale: this.startValue };
                    break;
                case AnimationType.Position:
                    backProperties = { position: this.startValue };
                    break;
                case AnimationType.Rotation:
                    backProperties = { eulerAngles: this.startValue };
                    break;
                case AnimationType.Opacity:
                    backProperties = { opacity: this.startOpacity };
                    break;
            }

            if (this.loop) {
                if (this.repeatCount > 0) {
                    this._currentTween = tween(target)
                        .to(this.duration, properties, { easing: this.tweenType as any })
                        .to(this.duration, backProperties, { easing: this.tweenType as any })
                        .union()
                        .repeat(this.repeatCount)
                        .call(() => {
                            this.onAnimationComplete();
                        });
                    
                } else {
                    this._currentTween = tween(target)
                        .to(this.duration, properties, { easing: this.tweenType as any })
                        .to(this.duration, backProperties, { easing: this.tweenType as any })
                        .union()
                        .repeatForever();
                }
            } else {
                this._currentTween = tween(target)
                    .to(this.duration, properties, { easing: this.tweenType as any })
                    .to(this.duration, backProperties, { easing: this.tweenType as any })
                    .call(() => {
                        this.onAnimationComplete();
                    });
            }
        } else {
            // Анимация в одну сторону
            if (this.loop) {
                if (this.repeatCount > 0) {
                    this._currentTween = tween(target)
                        .to(this.duration, properties, { easing: this.tweenType as any })
                        .call(() => { this.setToStartValue(); })
                        .union()
                        .repeat(this.repeatCount)
                        .call(() => {
                            this.onAnimationComplete();
                        });
                } else {
                    this._currentTween = tween(target)
                        .to(this.duration, properties, { easing: this.tweenType as any })
                        .call(() => { this.setToStartValue(); })
                        .union()
                        .repeatForever();
                }
            } else {
                this._currentTween = tween(target)
                    .to(this.duration, properties, { easing: this.tweenType as any })
                    .call(() => {
                        this.onAnimationComplete();
                    });
            }
        }

        this._currentTween.start();
    }

    /**
     * Останавливает анимацию
     */
    public stopAnimation() {
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
        this._isAnimating = false;
    }

    /**
     * Возвращает объект к начальному состоянию
     */
    public resetToStart() {
        this.stopAnimation();
        this.setToStartValue();
    }

    /**
     * Переводит объект в конечное состояние
     */
    public resetToEnd() {
        this.stopAnimation();
        this.setToEndValue();
    }

    /**
     * Проверяет, выполняется ли анимация в данный момент
     */
    public isAnimating(): boolean {
        return this._isAnimating;
    }

    /**
     * Перезапускает анимацию с текущими настройками
     */
    public restartAnimation() {
        this.stopAnimation();
        this.startAnimation();
    }

    /**
     * Устанавливает новые параметры анимации Vec3 и перезапускает её
     */
    public setAnimationParams(startValue: Vec3, endValue: Vec3, duration: number, tweenType?: string) {
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        if (tweenType) {
            this.tweenType = tweenType;
        }
        
        if (this._isAnimating) {
            this.restartAnimation();
        }
    }

    /**
     * Устанавливает новые параметры анимации Opacity и перезапускает её
     */
    public setOpacityParams(startOpacity: number, endOpacity: number, duration: number, tweenType?: string) {
        this.startOpacity = Math.max(0, Math.min(255, startOpacity));
        this.endOpacity = Math.max(0, Math.min(255, endOpacity));
        this.duration = duration;
        if (tweenType) {
            this.tweenType = tweenType;
        }
        
        if (this._isAnimating) {
            this.restartAnimation();
        }
    }
}

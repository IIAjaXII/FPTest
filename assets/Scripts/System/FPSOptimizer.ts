import { _decorator, Component, director } from 'cc';

const { ccclass, property } = _decorator;

/**
 * Автоматически оптимизирует производительность на основе FPS.
 * Отключает тени, если FPS долго остается ниже целевого значения.
 */
@ccclass('FPSOptimizer')
export class FPSOptimizer extends Component {
    @property({
        tooltip: 'Минимальный целевой FPS. Если FPS ниже этого значения, начинается оптимизация.'
    })
    public targetFPS: number = 30;

    @property({
        tooltip: 'Время в секундах, в течение которого FPS должен быть низким перед отключением теней.'
    })
    public timeBeforeDisable: number = 3.0;

    @property({
        tooltip: 'Интервал проверки FPS (в секундах).'
    })
    public checkInterval: number = 0.5;

    @property({
        tooltip: 'Включить отладочные сообщения в консоль.'
    })
    public enableDebugLogs: boolean = true;

    private _deltaTime: number = 0;
    private _fps: number = 0;
    private _timer: number = 0;
    private _frameCount: number = 0;
    private _lowFPSTimer: number = 0;
    private _shadowsDisabled: boolean = false;
    private _checkTimer: number = 0;

    protected onLoad(): void {
        this.log('FPS Optimizer initialized');
    }

    protected update(deltaTime: number): void {
        // Вычисляем FPS
        this._deltaTime += deltaTime;
        this._frameCount++;
        this._timer += deltaTime;
        this._checkTimer += deltaTime;

        if (this._timer >= this.checkInterval) {
            this._fps = this._frameCount / this._timer;
            this._timer = 0;
            this._frameCount = 0;

            this.checkPerformance(deltaTime);
        }
    }

    private checkPerformance(deltaTime: number): void {
        // Если тени уже отключены, дальнейшая оптимизация не требуется
        if (this._shadowsDisabled) {
            return;
        }

        // Проверяем FPS
        if (this._fps < this.targetFPS && this._fps > 0) {
            this._lowFPSTimer += this._checkTimer;
            this._checkTimer = 0;

            // Отключаем тени после указанного времени
            if (this._lowFPSTimer >= this.timeBeforeDisable) {
                this.disableShadows();
            }
        } else {
            // FPS в норме, сбрасываем таймер
            this._lowFPSTimer = 0;
            this._checkTimer = 0;
        }
    }

    private disableShadows(): void {
        const shadows = this.getShadows();
        if (!shadows) {
            this.log('Shadows component not found.');
            this._shadowsDisabled = true;
            return;
        }

        this.log('Disabling shadows completely due to low FPS.');
        shadows.enabled = false;
        this._shadowsDisabled = true;
    }

    private getShadows() {
        const scene = director.getScene();
        if (!scene) {
            console.warn('FPSOptimizer: Scene not found.');
            return null;
        }

        return scene.globals?.shadows || null;
    }

    private log(message: string): void {
        if (this.enableDebugLogs) {
            console.log(`[FPSOptimizer] ${message}`);
        }
    }

    /**
     * Получить текущее значение FPS
     */
    public getCurrentFPS(): number {
        return this._fps;
    }

    /**
     * Проверить, были ли отключены тени
     */
    public areShadowsDisabled(): boolean {
        return this._shadowsDisabled;
    }

    /**
     * Вручную восстановить тени
     */
    public restoreShadows(): void {
        const shadows = this.getShadows();
        if (!shadows) return;

        shadows.enabled = true;
        this._shadowsDisabled = false;
        this._lowFPSTimer = 0;
        this.log('Shadows restored.');
    }
}

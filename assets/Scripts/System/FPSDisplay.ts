import { _decorator, Component, Label } from 'cc';

const { ccclass, property } = _decorator;

/**
 * Компонент для отображения FPS (Frames Per Second) на экране.
 * Автоматически обновляет текст Label компонента с текущим значением FPS.
 */
@ccclass('FPSDisplay')
export class FPSDisplay extends Component {
    @property({
        type: Label,
        tooltip: 'Label компонент для отображения FPS. Если не указан, будет взят с текущего узла.'
    })
    public fpsLabel: Label = null;

    @property({
        tooltip: 'Частота обновления отображения FPS (в секундах). Например, 0.5 = обновление 2 раза в секунду.'
    })
    public updateInterval: number = 0.5;

    @property({
        tooltip: 'Показывать ли десятичные значения FPS'
    })
    public showDecimals: boolean = false;

    private _deltaTime: number = 0;
    private _fps: number = 0;
    private _timer: number = 0;
    private _frameCount: number = 0;

    protected onLoad(): void {
        // Если Label не назначен в инспекторе, пытаемся получить его с текущего узла
        if (!this.fpsLabel) {
            this.fpsLabel = this.getComponent(Label);
        }

        if (!this.fpsLabel) {
            console.warn('FPSDisplay: Label компонент не найден!');
        }
    }

    protected update(deltaTime: number): void {
        this._deltaTime += deltaTime;
        this._frameCount++;
        this._timer += deltaTime;

        // Обновляем отображение FPS согласно заданному интервалу
        if (this._timer >= this.updateInterval) {
            this._fps = this._frameCount / this._timer;
            this._timer = 0;
            this._frameCount = 0;

            this.updateDisplay();
        }
    }

    private updateDisplay(): void {
        if (!this.fpsLabel) return;

        const fpsValue = this.showDecimals 
            ? this._fps.toFixed(1) 
            : Math.round(this._fps).toString();

        this.fpsLabel.string = `FPS: ${fpsValue}`;
    }

    /**
     * Получить текущее значение FPS
     */
    public getCurrentFPS(): number {
        return this._fps;
    }
}

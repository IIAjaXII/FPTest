import { _decorator, Component, RichText, tween, Color, Vec3, Tween } from 'cc';
import { gameEvents } from '../System/GameEvents';

const { ccclass, property } = _decorator;

export const COINS_COUNTER_EVENT = 'CoinsCounter';

@ccclass('CoinsCounter')
export class CoinsCounter extends Component {
    @property({ type: RichText, tooltip: 'RichText для отображения счётчика' })
    public label: RichText | null = null;

    @property({ tooltip: 'Стартовое значение счётчика' })
    public startValue = 0;

    @property({ tooltip: 'Множитель скейла при изменении' })
    public pulseScale = 1.1;

    @property({ tooltip: 'Скорость скейла (сек)' })
    public scaleDuration = 0.15;

    @property({ tooltip: 'Скорость цвета (сек)' })
    public colorDuration = 0.2;

    @property({ tooltip: 'Цвет при изменении' })
    public pulseColor: Color = new Color(0, 255, 0, 255);

    private _value = 0;
    private _baseScale = new Vec3(1, 1, 1);
    private _baseColor = new Color(255, 255, 255, 255);
    private _colorTweenTarget = { t: 0 };
    private _colorTmp = new Color(255, 255, 255, 255);
    private _currentColor = new Color(255, 255, 255, 255);

    onEnable() {
        this._value = this.startValue;
        this.cacheBaseVisuals();
        this.updateText(false);
        gameEvents.on(COINS_COUNTER_EVENT, this.onAdd, this);
    }

    onDisable() {
        gameEvents.off(COINS_COUNTER_EVENT, this.onAdd, this);
    }

    private onAdd(amount: number = 1) {
        this._value += amount;
        this.updateText(true);
    }

    private updateText(pulse: boolean) {
        if (!this.label) {
            return;
        }
        this.updateStringWithColor(this._currentColor);
        if (pulse) {
            this.playPulse();
        }
    }

    public setValue(value: number) {
        this._value = value;
        this.updateText(true);
    }

    public getValue(): number {
        return this._value;
    }

    private cacheBaseVisuals() {
        if (!this.label) {
            return;
        }
        const nodeScale = this.label.node?.scale as Vec3 | undefined;
        this._baseScale = nodeScale && typeof (nodeScale as any).clone === 'function'
            ? nodeScale.clone()
            : new Vec3(1, 1, 1);

        const labelColor = (this.label as any).color as Color | undefined;
        if (labelColor) {
            this._baseColor.set(labelColor);
        } else {
            this._baseColor.set(255, 255, 255, 255);
        }
        this._currentColor.set(this._baseColor);
    }

    private playPulse() {
        if (!this.label) {
            return;
        }

        if (!this.isValidVisuals()) {
            this.cacheBaseVisuals();
        }

        Tween.stopAllByTarget(this.label.node);
        Tween.stopAllByTarget(this.label);
        Tween.stopAllByTarget(this._colorTweenTarget);

        const targetScale = new Vec3(
            this._baseScale.x * this.pulseScale,
            this._baseScale.y * this.pulseScale,
            this._baseScale.z * this.pulseScale
        );

        tween(this.label.node)
            .to(this.scaleDuration, { scale: targetScale }, { easing: 'sineInOut' })
            .to(this.scaleDuration, { scale: this._baseScale }, { easing: 'sineInOut' })
            .start();

        const start = this._baseColor;
        const end = this.pulseColor;
        const applyColor = (t: number) => {
            Color.lerp(this._colorTmp, start, end, t);
            this._currentColor.set(this._colorTmp);
            this.updateStringWithColor(this._currentColor);
        };

        tween(this._colorTweenTarget)
            .set({ t: 0 })
            .to(this.colorDuration, { t: 1 }, { onUpdate: (_, ratio) => applyColor(ratio), easing: 'sineInOut' })
            .to(this.colorDuration, { t: 0 }, { onUpdate: (_, ratio) => applyColor(1 - ratio), easing: 'sineInOut' })
            .call(() => {
                this._currentColor.set(this._baseColor);
                this.updateStringWithColor(this._currentColor);
            })
            .start();
    }

    private isValidVisuals(): boolean {
        return !!this._baseScale && !!this._baseColor;
    }

    private updateStringWithColor(color: Color) {
        if (!this.label) {
            return;
        }
        const hex = this.colorToHex(color);
        this.label.string = `<color=#${hex}><b><outline color=#000000 width=4>${this._value}</outline></b></color>`;
    }

    private colorToHex(color: Color): string {
        const r = Math.round(color.r).toString(16).padStart(2, '0');
        const g = Math.round(color.g).toString(16).padStart(2, '0');
        const b = Math.round(color.b).toString(16).padStart(2, '0');
        return `${r}${g}${b}`;
    }
}

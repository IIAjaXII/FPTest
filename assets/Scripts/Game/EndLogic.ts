import { _decorator, Component, Node, UIOpacity, tween, Tween, warn } from 'cc';
import { gameEvents } from '../System/GameEvents';

const { ccclass, property } = _decorator;

@ccclass('EnableObjectOnVehicleDestroyed')
export class EnableObjectOnVehicleDestroyed extends Component {
    @property({ type: Node, tooltip: 'Объект, который нужно включить после разрушения машинки.' })
    enableTarget: Node | null = null;

    @property({ tooltip: 'Задержка перед включением объекта (сек.).' })
    enableDelay = 0.5;

    @property({ type: [Node], tooltip: 'Объекты с UIOpacity, которые плавно уходят в 0.' })
    fadeTargets: Node[] = [];

    @property({ tooltip: 'Длительность плавного затухания (сек.).' })
    fadeDuration = 0.5;
    @property({ tooltip: 'Имя звука для разрушения (PLAY_SOUND). Если пусто — звук не проигрывается.' })
    failSound = 'fail';

    private _handled = false;

    onLoad() {
        gameEvents.on('vehicleDestroyed', this._onVehicleDestroyed, this);
    }

    onDestroy() {
        gameEvents.off('vehicleDestroyed', this._onVehicleDestroyed, this);
        this.unscheduleAllCallbacks();
    }

    private _onVehicleDestroyed() {
        if (this._handled) {
            return;
        }
        this._handled = true;
        this._enableTargetAfterDelay();
    }

    private _enableTargetAfterDelay() {
        if (!this.enableTarget) {
            return;
        }
        const delay = Math.max(0, this.enableDelay);
        this.scheduleOnce(() => {
            if (this.enableTarget) {
                this.enableTarget.active = true;
                this._fadeOutTargets();
                gameEvents.emit('PLAY_SOUND', { name: this.failSound });
            }
        }, delay);
    }

    private _fadeOutTargets() {
        if (!this.fadeTargets || this.fadeTargets.length === 0) {
            return;
        }
        for (const node of this.fadeTargets) {
            if (!node) {
                continue;
            }
            const uiOpacity = node.getComponent(UIOpacity);
            if (!uiOpacity) {
                warn(`[EnableObjectOnVehicleDestroyed] UIOpacity не найден на узле: ${node.name}`);
                continue;
            }
            Tween.stopAllByTarget(uiOpacity);
            tween(uiOpacity)
                .to(this.fadeDuration, { opacity: 0 }, { easing: 'linear' })
                .start();
        }
    }
}

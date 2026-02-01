import { _decorator, Component, Collider, ITriggerEvent, warn, Prefab, Node, instantiate } from 'cc';
import { gameEvents } from '../System/GameEvents';
import { COINS_COUNTER_EVENT } from './CoinsCounter';

const { ccclass, property } = _decorator;

@ccclass('CoinPickup')
export class CoinPickup extends Component {
    @property({ type: Collider, tooltip: 'Коллайдер монеты. Если пусто — берётся с текущего узла.' })
    public collider: Collider | null = null;

    @property({ tooltip: 'Сколько монет добавить за подбор' })
    public amount = 1;

    @property({ tooltip: 'Отключать монету после подбора' })
    public disableOnPickup = true;

    @property({ type: Prefab, tooltip: 'VFX префаб, который появится при подборе' })
    public pickupVfx: Prefab | null = null;

    @property({ tooltip: 'Имя звука для воспроизведения (PLAY_SOUND)' })
    public soundName = '';


    onEnable() {
        const collider = this.collider ?? this.getComponent(Collider);
        if (!collider) {
            warn('[CoinPickup] Collider не найден.');
            return;
        }
        this.collider = collider;
        collider.on('onTriggerEnter', this.onTriggerEnter, this);
    }

    onDisable() {
        if (this.collider) {
            this.collider.off('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    private onTriggerEnter(event: ITriggerEvent) {
        gameEvents.emit(COINS_COUNTER_EVENT, this.amount);
        this.spawnVfx();
        this.playSound();
        if (this.disableOnPickup) {
            this.node.active = false;
        }
    }

    private spawnVfx() {
        if (!this.pickupVfx) {
            return;
        }
        const vfxNode = instantiate(this.pickupVfx);
        const parent = this.node.scene ?? this.node.parent;
        if (parent) {
            vfxNode.parent = parent;
        }
        vfxNode.worldPosition = this.node.worldPosition.clone();
    }

    private playSound() {
        if (!this.soundName) {
            return;
        }
        gameEvents.emit('PLAY_SOUND', { name: this.soundName });
    }
}

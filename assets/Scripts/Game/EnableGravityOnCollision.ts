import { _decorator, Component, Collider, ITriggerEvent, RigidBody, warn } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnableGravityOnCollision')
export class EnableGravityOnCollision extends Component {
    @property({ type: Collider, tooltip: 'Коллайдер, который будет отслеживать столкновения. Если пусто — берётся с текущего узла.' })
    collider: Collider | null = null;

    onEnable() {
        const collider = this.collider ?? this.getComponent(Collider);
        if (!collider) {
            warn('[EnableGravityOnCollision] Collider не найден.');
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
        const otherRb = event.otherCollider?.getComponent(RigidBody);
        if (otherRb) {
            otherRb.useGravity = true;
        }
    }
}

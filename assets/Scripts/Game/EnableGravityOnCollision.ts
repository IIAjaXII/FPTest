import { _decorator, Component, Collider, ERigidBodyType, ITriggerEvent, RigidBody, warn } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnableGravityOnCollision')
export class EnableGravityOnCollision extends Component {
    @property({ type: Collider, tooltip: 'Коллайдер, который будет отслеживать столкновения. Если пусто — берётся с текущего узла.' })
    collider: Collider | null = null;

    @property({ tooltip: 'Смещать этот объект по X после успешного переключения.' })
    shiftOnTrigger = true;

    @property({ tooltip: 'Смещение по X (ед.).' })
    shiftDistance = 1;

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
            otherRb.type = ERigidBodyType.DYNAMIC;
            if (this.shiftOnTrigger) {
                const pos = this.node.worldPosition;
                pos.x += this.shiftDistance;
                this.node.setWorldPosition(pos);
            }
        }
    }
}

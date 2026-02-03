import { _decorator, Component, Collider, ERigidBodyType, ITriggerEvent, RigidBody, warn, game, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnableGravityOnCollision')
export class EnableGravityOnCollision extends Component {
    @property({ type: Collider, tooltip: 'Коллайдер, который будет отслеживать столкновения. Если пусто — берётся с текущего узла.' })
    collider: Collider | null = null;

    @property({ tooltip: 'Смещать этот объект по X после успешного переключения.' })
    shiftOnTrigger = true;

    @property({ tooltip: 'Смещение по X (ед.).' })
    shiftDistance = 1;

    @property({ tooltip: 'Порог FPS, ниже которого используется другой шаг.' })
    lowFpsThreshold = 55;

    @property({ tooltip: 'Смещение по X при низком FPS (ед.).' })
    lowFpsShiftDistance = 0.8;

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
            if (event.otherCollider && !event.otherCollider.isTrigger) {
                event.otherCollider.isTrigger = true;
            }
            if (this.shiftOnTrigger) {
                const pos = this.node.worldPosition.clone();
                const dt = game.deltaTime;
                const fps = dt > 0 ? 1 / dt : 0;
                const step = fps > 0 && fps < this.lowFpsThreshold
                    ? this.lowFpsShiftDistance
                    : this.shiftDistance;
                pos.x += step;
                this.node.setWorldPosition(pos);
            }
        }
    }
}

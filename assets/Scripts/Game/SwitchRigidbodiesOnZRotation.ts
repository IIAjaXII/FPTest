import { _decorator, Component, Enum, Node, RigidBody, ERigidBodyType, Vec3, warn } from 'cc';
import { gameEvents } from '../System/GameEvents';

const { ccclass, property } = _decorator;

@ccclass('SwitchRigidbodiesOnZRotation')
export class SwitchRigidbodiesOnZRotation extends Component {
    @property({ type: Node, tooltip: 'Объект, за вращением Z которого следим.' })
    target: Node | null = null;

    @property({ type: RigidBody, tooltip: 'Rigidbody объекта, чью инерцию копируем.' })
    targetRigidbody: RigidBody | null = null;

    @property({ tooltip: 'Порог Z-угла (в градусах).' })
    zThreshold = 30;

    @property({ tooltip: 'Срабатывать также по координате X.' })
    useXThreshold = false;

    @property({ tooltip: 'Порог X-координаты (мир).' })
    xThreshold = 10;

    @property({ type: [RigidBody], tooltip: 'Rigidbody, которые переключаем на Dynamic.' })
    bodies: RigidBody[] = [];

    @property({ tooltip: 'Сработать только один раз.' })
    triggerOnce = true;

    @property({ tooltip: 'Копировать линейную и угловую скорость целевого Rigidbody.' })
    copyTargetVelocity = true;

    private _triggered = false;
    private _tmpLinear = new Vec3();
    private _tmpAngular = new Vec3();

    update() {
        if (!this.target) {
            return;
        }
        if (this.triggerOnce && this._triggered) {
            return;
        }

        const z = this._normalizeAngle(this.target.eulerAngles.z);
        const zCondition = Math.abs(z) > this.zThreshold;
        const xCondition = this.useXThreshold ? (this.target.worldPosition.x >= this.xThreshold) : false;
        const condition = zCondition || xCondition;

        if (condition) {
            this._switchBodies();
            this._triggered = true;
        }
    }

    private _switchBodies() {
        if (!this.bodies || this.bodies.length === 0) {
            warn('[SwitchRigidbodiesOnZRotation] Rigidbody массив пуст.');
            return;
        }
        if (this.targetRigidbody) {
            this.targetRigidbody.type = ERigidBodyType.STATIC;
        }
        for (const body of this.bodies) {
            if (!body) {
                continue;
            }
            body.type = ERigidBodyType.DYNAMIC;
           /* if (this.copyTargetVelocity && this.targetRigidbody) {
                this.targetRigidbody.getLinearVelocity(this._tmpLinear);
                this.targetRigidbody.getAngularVelocity(this._tmpAngular);
                body.setLinearVelocity(this._tmpLinear);
                body.setAngularVelocity(this._tmpAngular);
            }*/
        }

        gameEvents.emit('vehicleDestroyed');
    }

    private _normalizeAngle(angle: number) {
        let a = (angle + 180) % 360;
        if (a < 0) a += 360;
        return a - 180;
    }
}

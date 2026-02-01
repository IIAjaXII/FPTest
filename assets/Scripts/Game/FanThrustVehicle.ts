import { _decorator, Component, Enum, isValid, Node, RigidBody, Toggle, Vec3 } from 'cc';
import { gameEvents } from '../System/GameEvents';

const { ccclass, property } = _decorator;

enum WheelAxis {
    X = 0,
    Y = 1,
    Z = 2,
}

enum PropellerAxis {
    X = 0,
    Y = 1,
    Z = 2,
}


@ccclass('FanThrustVehicle')
export class FanThrustVehicle extends Component {
    @property({ type: RigidBody, tooltip: 'Rigidbody (если есть) для фиксации угловой скорости.' })
    rigidbody: RigidBody | null = null;

    @property({ type: Toggle, tooltip: 'Toggle, который включает тягу вентилятора.' })
    toggle: Toggle | null = null;

    @property({ tooltip: 'Скорость движения по оси X (ед/сек).' })
    moveSpeed = 2;

    @property({ tooltip: 'Ускорение (ед/сек^2).' })
    acceleration = 3;

    @property({ tooltip: 'Торможение (ед/сек^2).' })
    deceleration = 4;

    @property({ tooltip: 'Множитель торможения при разрушении.' })
    destroyedDecelMultiplier = 2;

    @property({ tooltip: 'Блокировать вращение по оси X.' })
    lockRotationX = true;

    @property({ tooltip: 'Блокировать вращение по оси Y.' })
    lockRotationY = true;

    @property({ tooltip: 'Блокировать вращение по оси Z.' })
    lockRotationZ = false;

    @property({ type: [Node], tooltip: 'Массив нод колёс (только визуальное вращение).' })
    wheelNodes: Node[] = [];

    @property({ type: [Node], tooltip: 'Массив нод пропеллера (визуальное вращение).' })
    propellerNodes: Node[] = [];

    @property({ tooltip: 'Радиус колеса (для вычисления угловой скорости).' })
    wheelRadius = 0.3;

    @property({ tooltip: 'Коэф. поворота колеса по скорости.' })
    wheelSpinMultiplier = 1;

    @property({ type: Enum(WheelAxis), tooltip: 'Ось вращения колеса (локальная).' })
    wheelSpinAxis: WheelAxis = WheelAxis.Z;

    @property({ tooltip: 'Коэф. поворота пропеллера по скорости.' })
    propellerSpinMultiplier = 5;

    @property({ type: Enum(PropellerAxis), tooltip: 'Ось вращения пропеллера (локальная).' })
    propellerSpinAxis: PropellerAxis = PropellerAxis.Y;

    private _tmpForward = new Vec3();
    private _tmpVel = new Vec3();
    private _tmpDelta = new Vec3();
    private _lastPos = new Vec3();
    private _hasLastPos = false;
    private _frameDeltaValid = false;
    private _currentSpeed = 0;
    private _forceStop = false;
    private _initialEuler = new Vec3();
    private _tmpEuler = new Vec3();
    private _tmpAngVel = new Vec3();

    onLoad() {
        gameEvents.on('vehicleDestroyed', this._onVehicleDestroyed, this);
    }

    start() {
        this._initialEuler.set(this.node.eulerAngles);
    }

    onDestroy() {
        gameEvents.off('vehicleDestroyed', this._onVehicleDestroyed, this);
    }

    update(dt: number) {
        if (!isValid(this.node, true)) {
            return;
        }
        this._prepareFrameDelta();

        const isActive = !this.toggle || this.toggle.isChecked;
        const targetSpeed = (this._forceStop || !isActive) ? 0 : this.moveSpeed;

        this._updateSpeed(dt, targetSpeed);
        this._moveAlongX(dt);
        this._updateWheelSpin(dt);
        this._updatePropellerSpin(dt);
    }

    lateUpdate() {
        if (this.lockRotationX || this.lockRotationY || this.lockRotationZ) {
            const euler = this.node.eulerAngles;
            this._tmpEuler.set(euler);
            if (this.lockRotationX) this._tmpEuler.x = this._initialEuler.x;
            if (this.lockRotationY) this._tmpEuler.y = this._initialEuler.y;
            if (this.lockRotationZ) this._tmpEuler.z = this._initialEuler.z;
            this.node.setRotationFromEuler(this._tmpEuler);

            if (this.rigidbody) {
                this.rigidbody.getAngularVelocity(this._tmpAngVel);
                if (this.lockRotationX) this._tmpAngVel.x = 0;
                if (this.lockRotationY) this._tmpAngVel.y = 0;
                if (this.lockRotationZ) this._tmpAngVel.z = 0;
                this.rigidbody.setAngularVelocity(this._tmpAngVel);
            }
        }
    }

    private _onVehicleDestroyed() {
        this._forceStop = true;
        if (this.toggle) {
            this.toggle.isChecked = false;
        }
    }

    private _prepareFrameDelta() {
        const currentPos = this.node.worldPosition;
        if (!this._hasLastPos) {
            this._lastPos.set(currentPos);
            this._hasLastPos = true;
            this._frameDeltaValid = false;
            return;
        }

        Vec3.subtract(this._tmpDelta, currentPos, this._lastPos);
        this._lastPos.set(currentPos);
        this._frameDeltaValid = true;
    }

    private _updateSpeed(dt: number, targetSpeed: number) {
        let accel = Math.abs(targetSpeed) > Math.abs(this._currentSpeed)
            ? this.acceleration
            : this.deceleration;
        if (this._forceStop && targetSpeed === 0) {
            accel *= this.destroyedDecelMultiplier;
        }
        const maxDelta = accel * dt;
        const diff = targetSpeed - this._currentSpeed;
        const clamped = Math.max(-maxDelta, Math.min(maxDelta, diff));
        this._currentSpeed += clamped;
    }

    private _moveAlongX(dt: number) {
        const pos = this.node.worldPosition;
        pos.x += this._currentSpeed * dt;
        this.node.setWorldPosition(pos);
    }

    private _updateWheelSpin(dt: number) {
        if (!this.wheelNodes || this.wheelNodes.length === 0) {
            return;
        }
        if (!this._frameDeltaValid) {
            return;
        }

        const forward = this._tmpForward.set(1, 0, 0);
        if (this.wheelRadius <= 0) {
            return;
        }

        const distance = this._tmpDelta.length(); // units
        const directionSign = Math.sign(Vec3.dot(this._tmpDelta, forward));
        const signedDistance = distance * (directionSign === 0 ? 1 : directionSign);
        const angleRad = (signedDistance / this.wheelRadius) * this.wheelSpinMultiplier; // rad
        const deltaDeg = angleRad * 57.2958; // deg

        for (const wheel of this.wheelNodes) {
            if (!wheel || !isValid(wheel, true)) {
                continue;
            }
            const euler = wheel.eulerAngles;
            switch (this.wheelSpinAxis) {
                case WheelAxis.X:
                    wheel.setRotationFromEuler(euler.x + deltaDeg, euler.y, euler.z);
                    break;
                case WheelAxis.Y:
                    wheel.setRotationFromEuler(euler.x, euler.y + deltaDeg, euler.z);
                    break;
                case WheelAxis.Z:
                    wheel.setRotationFromEuler(euler.x, euler.y, euler.z + deltaDeg);
                    break;
            }
        }
    }

    private _updatePropellerSpin(dt: number) {
        if (!this.propellerNodes || this.propellerNodes.length === 0) {
            return;
        }
        if (!this._frameDeltaValid) {
            return;
        }

        const forward = this._tmpForward.set(1, 0, 0);
        const distance = this._tmpDelta.length();
        const directionSign = Math.sign(Vec3.dot(this._tmpDelta, forward));
        const signedDistance = distance * (directionSign === 0 ? 1 : directionSign);
        const angleRad = signedDistance * this.propellerSpinMultiplier; // rad
        const deltaDeg = angleRad * 57.2958; // deg

        for (const propeller of this.propellerNodes) {
            if (!propeller || !isValid(propeller, true)) {
                continue;
            }
            const euler = propeller.eulerAngles;
            switch (this.propellerSpinAxis) {
                case PropellerAxis.X:
                    propeller.setRotationFromEuler(euler.x + deltaDeg, euler.y, euler.z);
                    break;
                case PropellerAxis.Y:
                    propeller.setRotationFromEuler(euler.x, euler.y + deltaDeg, euler.z);
                    break;
                case PropellerAxis.Z:
                    propeller.setRotationFromEuler(euler.x, euler.y, euler.z + deltaDeg);
                    break;
            }
        }
    }
}

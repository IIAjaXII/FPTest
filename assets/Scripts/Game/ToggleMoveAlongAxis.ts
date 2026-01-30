import { _decorator, Component, Enum, Node, Toggle, Vec3, warn } from 'cc';

const { ccclass, property } = _decorator;

enum Axis {
    X = 0,
    Y = 1,
    Z = 2,
}

@ccclass('ToggleMoveAlongAxis')
export class ToggleMoveAlongAxis extends Component {
    @property({ type: Toggle, tooltip: 'Toggle, который включает движение.' })
    toggle: Toggle | null = null;

    @property({ type: Enum(Axis), tooltip: 'Ось движения.' })
    axis: Axis = Axis.X;

    @property({ tooltip: 'Скорость движения (ед/сек). Можно отрицательную.' })
    speed = 1;

    @property({ tooltip: 'Использовать мировые координаты (иначе локальные).' })
    useWorldSpace = false;

    update(dt: number) {
        if (!this.toggle) {
            return;
        }

        if (!this.toggle.isChecked) {
            return;
        }

        const delta = this.speed * dt;
        const pos = this.useWorldSpace ? this.node.worldPosition.clone() : this.node.position.clone();

        switch (this.axis) {
            case Axis.X:
                pos.x += delta;
                break;
            case Axis.Y:
                pos.y += delta;
                break;
            case Axis.Z:
                pos.z += delta;
                break;
        }

        if (this.useWorldSpace) {
            this.node.worldPosition = pos;
        } else {
            this.node.position = pos;
        }
    }
}

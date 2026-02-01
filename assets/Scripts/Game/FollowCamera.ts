import { _decorator, Component, Node, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('FollowCamera')
export class FollowCamera extends Component {
    @property({ type: Node, tooltip: 'Объект, за которым следует камера.' })
    target: Node | null = null;

    @property({ tooltip: 'Оффсет от цели (если useInitialOffset = false).' })
    offset = new Vec3(0, 5, -10);

    @property({ tooltip: 'Брать стартовый оффсет из текущих позиций при старте.' })
    useInitialOffset = true;

    private _tmpPos = new Vec3();

    start() {
        if (!this.target) {
            return;
        }

        if (this.useInitialOffset) {
            Vec3.subtract(this.offset, this.node.worldPosition, this.target.worldPosition);
        }
    }

    lateUpdate() {
        if (!this.target) {
            return;
        }

        Vec3.add(this._tmpPos, this.target.worldPosition, this.offset);
        this.node.setWorldPosition(this._tmpPos);
    }
}

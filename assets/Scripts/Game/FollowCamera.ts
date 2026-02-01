import { _decorator, Component, Node, Vec3, isValid } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('FollowCamera')
export class FollowCamera extends Component {
    @property({ type: Node, tooltip: 'Объект, за которым следует камера.' })
    target: Node | null = null;

    @property({ tooltip: 'Оффсет от цели (если useInitialOffset = false).' })
    offset = new Vec3(0, 5, -10);

    @property({ tooltip: 'Брать стартовый оффсет из текущих позиций при старте.' })
    useInitialOffset = true;

    @property({ tooltip: 'Плавное следование камеры.' })
    smoothFollow = true;

    @property({ tooltip: 'Скорость плавного следования (чем больше, тем быстрее).' })
    smoothSpeed = 6;

    @property({ tooltip: 'Минимальная высота камеры по Y.' })
    minY = 8;

    @property({ tooltip: 'Максимальная высота камеры по Y.' })
    maxY = 12;

    private _tmpPos = new Vec3();

    start() {
        if (!this.target || !isValid(this.target) || !this.node || !isValid(this.node)) {
            return;
        }

        if (this.useInitialOffset) {
            Vec3.subtract(this.offset, this.node.worldPosition, this.target.worldPosition);
        }
    }

    lateUpdate(dt: number) {
        if (!this.target || !isValid(this.target) || !this.node || !isValid(this.node)) {
            return;
        }
        Vec3.add(this._tmpPos, this.target.worldPosition, this.offset);
        this._tmpPos.y = Math.min(this.maxY, Math.max(this.minY, this._tmpPos.y));
        if (!this.smoothFollow) {
            this.node.setWorldPosition(this._tmpPos);
            return;
        }
        const t = 1 - Math.exp(-this.smoothSpeed * dt);
        const current = this.node.worldPosition;
        Vec3.lerp(this._tmpPos, current, this._tmpPos, t);
        this.node.setWorldPosition(this._tmpPos);
    }
}

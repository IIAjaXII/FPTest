import { _decorator, Component, Camera, view, Size } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Компонент для установки разного FOV у камеры в зависимости от
 * ориентации экрана (портретной или ландшафтной).
 * Проверяет ориентацию в каждом кадре для надежности.
 */
@ccclass('FOVAdapt')
export class FOVAdapt extends Component {
    @property({
        tooltip: "FOV, который будет применен, когда экран в портретной (вертикальной) ориентации."
    })
    public portraitFOV: number = 60;

    @property({
        tooltip: "FOV, который будет применен, когда экран в ландшафтной (горизонтальной) ориентации."
    })
    public landscapeFOV: number = 45;

    private _isPortrait: boolean = false;
    private _camera: Camera | null = null;

    start() {
        this._camera = this.getComponent(Camera);
        if (!this._camera) {
            console.warn('FOVAdapt: Camera component not found on this node!');
            return;
        }
        this.checkAndApplyFOV(true);
    }

    lateUpdate() {
        if (!this._camera) return;
        this.checkAndApplyFOV();
    }

    private checkAndApplyFOV(force: boolean = false) {
        const visibleSize: Size = view.getVisibleSize();
        const currentIsPortrait = visibleSize.height > visibleSize.width;

        if (this._isPortrait === currentIsPortrait && !force) {
            return;
        }
        this._isPortrait = currentIsPortrait;

        if (this._camera) {
            this._camera.fov = this._isPortrait ? this.portraitFOV : this.landscapeFOV;
        }
    }
} 
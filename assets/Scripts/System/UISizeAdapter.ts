import { _decorator, Component, Node, Vec3, view, size, Size } from 'cc';

const { ccclass, property } = _decorator;

/**
 * Компонент для установки разного масштаба объекта в зависимости от
 * ориентации экрана (портретной или ландшафтной).
 * Проверяет ориентацию в каждом кадре для большей надежности.
 */
@ccclass('UISizeAdapter')
export class UISizeAdapter extends Component {

    @property({
        type: Vec3,
        tooltip: "Масштаб, который будет применен, когда экран в портретной (вертикальной) ориентации."
    })
    public portraitScale: Vec3 = new Vec3(1, 1, 1);

    @property({
        type: Vec3,
        tooltip: "Масштаб, который будет применен, когда экран в ландшафтной (горизонтальной) ориентации."
    })
    public landscapeScale: Vec3 = new Vec3(1, 1, 1);

    private _isPortrait: boolean = false;

    start() {
        // Выполняем первую проверку принудительно, чтобы установить начальный масштаб.
        this.checkAndApplyScale(true);
    }

    lateUpdate() {
        // Проверяем в каждом кадре.
        this.checkAndApplyScale();
    }

    private checkAndApplyScale(force: boolean = false) {
        const visibleSize: Size = view.getVisibleSize();
        const currentIsPortrait = visibleSize.height > visibleSize.width;

        // Если ориентация не изменилась с последней проверки, ничего не делаем.
        // `force` используется для самой первой проверки в start().
        if (this._isPortrait === currentIsPortrait && !force) {
            return;
        }

        // Запоминаем новую ориентацию.
        this._isPortrait = currentIsPortrait;

        if (this._isPortrait) {
            this.node.setScale(this.portraitScale);
        } else {
            this.node.setScale(this.landscapeScale);
        }
    }
} 
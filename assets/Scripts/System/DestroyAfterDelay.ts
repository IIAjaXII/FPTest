import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DestroyAfterDelay')
export class DestroyAfterDelay extends Component {
    @property({ type: Number, tooltip: "Время до уничтожения (в секундах)" })
    public delay: number = 1;

    start() {
        this.scheduleOnce(() => {
            this.node.destroy();
        }, this.delay);
    }
} 
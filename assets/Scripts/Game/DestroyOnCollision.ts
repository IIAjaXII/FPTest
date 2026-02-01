import { _decorator, Component, Collider, ICollisionEvent, ITriggerEvent } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DestroyOnCollision')
export class DestroyOnCollision extends Component {
   

    onEnable() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onCollisionEnter', this._onCollisionEnter, this);
            collider.on('onTriggerEnter', this._onTriggerEnter, this);
        }
    }

    onDisable() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.off('onCollisionEnter', this._onCollisionEnter, this);
            collider.off('onTriggerEnter', this._onTriggerEnter, this);
        }
    }

    private _onCollisionEnter(event: ICollisionEvent) {
        if (event.otherCollider) {
            event.otherCollider.node.destroy();
        }
        
    }

    private _onTriggerEnter(event: ITriggerEvent) {
        if (event.otherCollider) {
            event.otherCollider.node.destroy();
        }
    }
}

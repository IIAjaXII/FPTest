import { _decorator, Component, Prefab, Node, instantiate, Vec3, Enum, warn, RigidBody } from 'cc';

const { ccclass, property } = _decorator;

enum Axis {
    X = 0,
    Y = 1,
    Z = 2,
}

enum Direction {
    Positive = 1,
    Negative = -1,
}

const SPAWN_PREFIX = '__LinePrefabSpawner__';

@ccclass('LinePrefabSpawner')
export class LinePrefabSpawner extends Component {
    @property({ type: Prefab })
    prefab: Prefab | null = null;

    @property({ type: Node, tooltip: 'Родитель, в который будут добавляться префабы. Если пусто — текущий узел.' })
    parent: Node | null = null;

    @property({ type: Enum(Axis), tooltip: 'Ось, по которой строится линия.' })
    axis: Axis = Axis.X;

    @property({ type: Enum(Direction), tooltip: 'Направление вдоль оси.' })
    direction: Direction = Direction.Positive;

    @property({ tooltip: 'Длина линии от позиции узла.' })
    length = 10;

    @property({ tooltip: 'Промежуток между префабами.' })
    spacing = 1;

    @property({ tooltip: 'Включать префаб на позиции узла (нулевая точка).' })
    includeStart = true;

    @property({ tooltip: 'Очищать существующих детей у родителя перед спавном.' })
    clearChildren = false;

    @property({ tooltip: 'Использовать мировые координаты (иначе локальные).' })
    useWorldSpace = false;

    @property({ tooltip: 'В редакторе очищать ранее созданные (по префиксу имени).' })
    editorAutoClean = true;

    @property({ tooltip: 'Спавнить объекты с задержкой (по одному)' })
    spawnWithDelay = false;

    @property({ tooltip: 'Задержка между спавнами (сек)' })
    spawnDelay = 0.1;

    @property({ tooltip: 'Linear Factor по Y для первого объекта.' })
    linearFactorYStart = 1;

    @property({ tooltip: 'Linear Factor по Y для последнего объекта.' })
    linearFactorYEnd = 1;

    start() {
        this.spawnLine();
    }

    private spawnLine() {
        if (!this.prefab) {
            warn('[LinePrefabSpawner] Prefab не назначен.');
            return;
        }

        if (this.spacing <= 0) {
            warn('[LinePrefabSpawner] spacing должен быть > 0.');
            return;
        }

        const parent = this.parent ?? this.node;

        if (this.clearChildren) {
            parent.removeAllChildren();
        } else if (this.editorAutoClean) {
            this.clearPreviewNodes(parent);
        }

        const count = Math.max(0, Math.floor(this.length / this.spacing));
        const startIndex = this.includeStart ? 0 : 1;
        const total = this.includeStart ? count + 1 : count;

        const startPos = this.useWorldSpace ? this.node.worldPosition.clone() : this.node.position.clone();

        const spawnOne = (i: number) => {
            const step = (startIndex + i) * this.spacing * this.direction;
            const pos = new Vec3(startPos.x, startPos.y, startPos.z);

            switch (this.axis) {
                case Axis.X:
                    pos.x += step;
                    break;
                case Axis.Y:
                    pos.y += step;
                    break;
                case Axis.Z:
                    pos.z += step;
                    break;
            }

            const node = instantiate(this.prefab!);
            if (this.editorAutoClean) {
                node.name = `${SPAWN_PREFIX}${i}`;
            }
            node.parent = parent;
            if (this.useWorldSpace) {
                node.worldPosition = pos;
            } else {
                node.position = pos;
            }

            const rb = node.getComponent(RigidBody);
            if (rb) {
                const t = total <= 1 ? 0 : i / (total - 1);
                const y = this.linearFactorYStart + (this.linearFactorYEnd - this.linearFactorYStart) * t;
                const current = rb.linearFactor;
                rb.linearFactor = new Vec3(current.x, y, current.z);
            } else {
                warn('[LinePrefabSpawner] На объекте нет RigidBody.');
            }
        };

        if (this.spawnWithDelay) {
            const delay = Math.max(0, this.spawnDelay);
            const immediateCount = this.includeStart ? Math.min(1, total) : 0;

            for (let i = 0; i < immediateCount; i++) {
                spawnOne(i);
            }

            for (let i = 0; i < total; i++) {
                if (i < immediateCount) {
                    continue;
                }
                const index = i - immediateCount;
                const spawnAt = immediateCount > 0 ? (index + 1) * delay : index * delay;
                this.scheduleOnce(() => spawnOne(i), spawnAt);
            }
            return;
        }

        for (let i = 0; i < total; i++) {
            spawnOne(i);
        }
    }

    private clearPreviewNodes(parent: Node) {
        const children = parent.children.slice();
        for (const child of children) {
            if (child.name.startsWith(SPAWN_PREFIX)) {
                child.removeFromParent();
                child.destroy();
            }
        }
    }
}

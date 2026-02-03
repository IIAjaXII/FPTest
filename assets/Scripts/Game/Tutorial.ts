import { _decorator, Component, Node, Vec3, tween, UIOpacity, Slider, warn } from 'cc';
import { TweenType, TweenTypeValues } from '../System/TweenTypes';

const { ccclass, property } = _decorator;

@ccclass('Tutorial')
export class Tutorial extends Component {
    @property({ type: Node, tooltip: 'Объект руки, который летит к цели' })
    public handNode: Node | null = null;

    @property({ type: Node, tooltip: 'Нода-цель, к координатам которой летит рука' })
    public targetNode: Node | null = null;

    @property({ type: Node, tooltip: 'Нода, на которой находится Slider' })
    public sliderNode: Node | null = null;

    @property({ tooltip: 'Длительность полёта руки к цели (сек)' })
    public moveDuration = 0.8;

    @property({ tooltip: 'Задержка перед началом движения руки (сек)' })
    public moveInitialDelay = 0.2;

    @property({ tooltip: 'Изиинг для полёта руки', type: TweenType })
    public moveEasing = TweenType.SineInOut;

    @property({ tooltip: 'Длительность заполнения Slider 0 -> 1 (сек)' })
    public sliderUpDuration = 0.35;

    @property({ tooltip: 'Изиинг заполнения Slider', type: TweenType })
    public sliderUpEasing = TweenType.SineOut;

    @property({ tooltip: 'Длительность спуска Slider 1 -> 0 (сек)' })
    public sliderDownDuration = 0.25;

    @property({ tooltip: 'Изиинг спуска Slider', type: TweenType })
    public sliderDownEasing = TweenType.SineIn;

    @property({ tooltip: 'Задержка на пике Slider (сек)' })
    public sliderHoldDuration = 0.2;

    @property({ tooltip: 'Первоначальная задержка перед первым циклом Slider (сек)' })
    public sliderInitialDelay = 0.2;

    @property({ tooltip: 'Задержка между циклами Slider (сек)' })
    public sliderBetweenCyclesDelay = 0.15;

    @property({ tooltip: 'Сколько циклов анимации Slider' })
    public sliderCycles = 2;

    @property({ tooltip: 'Длительность плавного исчезновения руки (сек)' })
    public fadeDuration = 0.6;

    @property({ tooltip: 'Изиинг исчезновения руки', type: TweenType })
    public fadeEasing = TweenType.SineInOut;

    onEnable() {
        this.playSequence();
    }

    private playSequence() {
        this.setSliderInteractable(false);
        if (!this.handNode || !this.targetNode) {
            warn('[Tutorial] handNode или targetNode не назначены.');
            return;
        }

        const hand = this.handNode;
        const targetWorld = this.targetNode.worldPosition.clone();

        tween(hand)
            .delay(this.moveInitialDelay)
            .to(this.moveDuration, { worldPosition: targetWorld }, { easing: this.getEasing(this.moveEasing) })
            .call(() => {
                // Сделать руку дочерней для цели и обнулить локальные координаты
                hand.parent = this.targetNode;
                hand.setPosition(Vec3.ZERO);
            })
            .call(() => {
                const sliderDuration = this.playSliderAnimation();
                const fadeDelay = this.getFadeDelay();
                if (sliderDuration <= 0) {
                    this.fadeOutHand();
                    this.scheduleSliderEnable(fadeDelay);
                    return;
                }
                tween(this.node)
                    .delay(sliderDuration)
                    .call(() => this.fadeOutHand())
                    .start();

                this.scheduleSliderEnable(sliderDuration + fadeDelay);
            })
            .start();
    }

    private playSliderAnimation(): number {
        if (!this.sliderNode) {
            return 0;
        }

        const slider = this.sliderNode.getComponent(Slider);
        if (!slider) {
            return 0;
        }

        slider.progress = 0;

        const cycle = () =>
            tween(slider)
                .to(this.sliderUpDuration, { progress: 1 }, { easing: this.getEasing(this.sliderUpEasing) })
                .delay(this.sliderHoldDuration)
                .to(this.sliderDownDuration, { progress: 0 }, { easing: this.getEasing(this.sliderDownEasing) })
                .start();

        for (let i = 0; i < this.sliderCycles; i += 1) {
            const cycleDuration = this.sliderUpDuration + this.sliderHoldDuration + this.sliderDownDuration;
            const delay = this.sliderInitialDelay + i * (cycleDuration + this.sliderBetweenCyclesDelay);
            tween(this.node)
                .delay(delay)
                .call(cycle)
                .start();
        }

        if (this.sliderCycles <= 0) {
            return 0;
        }

        const fullCycleDuration = this.sliderUpDuration + this.sliderHoldDuration + this.sliderDownDuration;
        const betweenDelay = this.sliderCycles > 1 ? (this.sliderCycles - 1) * this.sliderBetweenCyclesDelay : 0;
        return this.sliderInitialDelay + this.sliderCycles * fullCycleDuration + betweenDelay;
    }

    private fadeOutHand() {
        if (!this.handNode) {
            return;
        }

        const opacity = this.handNode.getComponent(UIOpacity);
        if (!opacity) {
            return;
        }

        tween(opacity)
            .to(this.fadeDuration, { opacity: 0 }, { easing: this.getEasing(this.fadeEasing) })
            .start();
    }

    private getFadeDelay(): number {
        if (!this.handNode) {
            return 0;
        }
        const opacity = this.handNode.getComponent(UIOpacity);
        return opacity ? this.fadeDuration : 0;
    }

    private scheduleSliderEnable(delay: number) {
        tween(this.node)
            .delay(Math.max(0, delay))
            .call(() => this.setSliderInteractable(true))
            .start();
    }

    private setSliderInteractable(value: boolean) {
        if (!this.sliderNode) {
            return;
        }
        const slider = this.sliderNode.getComponent(Slider);
        if (!slider) {
            return;
        }
        slider.enabled = value;
    }

    private getEasing(type: TweenType): string {
        return TweenTypeValues[type] ?? 'sineInOut';
    }
}

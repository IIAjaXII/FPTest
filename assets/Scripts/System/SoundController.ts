import { _decorator, Component, AudioClip, AudioSource, Toggle, director, Node, Director } from 'cc';
import { gameEvents } from './GameEvents';
const { ccclass, property } = _decorator;

@ccclass('SoundController')
export class SoundController extends Component {
    
    @property({ type: [AudioClip] })
    public soundEffects: AudioClip[] = [];

    @property({ type: [String] })
    public soundNames: string[] = [];

    @property
    public soundOn: boolean = true;

    @property({ type: AudioSource })
    public bgmSource: AudioSource = null;


    @property({ type: AudioSource })
    public effectSource: AudioSource = null;

    @property({ type: AudioSource })
    public shotSource: AudioSource = null;

    private bgmMaxVolume: number = 1;
    private effectMaxVolume: number = 1;
    private shotMaxVolume: number = 1;
    private _waitForFirstTouch: boolean = true;
    private _toggle: Toggle = null;
    private _gameEnded: boolean = false;

    onLoad() {
        // Сохраняем максимальные значения громкости
        if (this.bgmSource) {
            this.bgmMaxVolume = this.bgmSource.volume;
        }
        if (this.effectSource) {
            this.effectMaxVolume = this.effectSource.volume;
        }
        if (this.shotSource) {
            this.shotMaxVolume = this.shotSource.volume;
        }

        // Подписка на события
        gameEvents.on('PLAY_SOUND', this.onPlaySound, this);
        gameEvents.on('PLAY_BGM', this.onPlayBGM, this);
        gameEvents.on('STOP_BGM', this.onStopBGM, this);
        gameEvents.on('TOGGLE_SOUND', this.onToggleSound, this);
        gameEvents.on('SET_SOUND_ON', this.onSetSoundOn, this);
        gameEvents.on('goalReached', this.onGameEnded, this);

        // Подписка на событие загрузки новой сцены
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH, this._findAndBindToggle, this);

        // Первый поиск Toggle
        this._findAndBindToggle();
    }

    onDestroy() {
        gameEvents.off('PLAY_SOUND', this.onPlaySound, this);
        gameEvents.off('PLAY_BGM', this.onPlayBGM, this);
        gameEvents.off('STOP_BGM', this.onStopBGM, this);
        gameEvents.off('TOGGLE_SOUND', this.onToggleSound, this);
        gameEvents.off('SET_SOUND_ON', this.onSetSoundOn, this);
        gameEvents.off('goalReached', this.onGameEnded, this);

        if (this._toggle) {
            this._toggle.node.off('toggle', this.onToggleSoundToggle, this);
        }
        director.off(Director.EVENT_AFTER_SCENE_LAUNCH, this._findAndBindToggle, this);
    }

    private onGameEnded() {
        this._gameEnded = true;
    }

    private onToggleSoundToggle(toggle: Toggle) {
        this.soundOn = !toggle.isChecked;
        this.updateVolume();
    }

    private onPlaySound(data: { name: string }) {
        if (!this.soundOn || this._gameEnded) return;
        const idx = this.soundNames.indexOf(data.name);
        if (idx !== -1 && this.soundEffects[idx]) {
            if (data.name.includes('shot') && this.shotSource) {
                this.shotSource.playOneShot(this.soundEffects[idx]);
            } else if (this.effectSource) {
                this.effectSource.playOneShot(this.soundEffects[idx]);
            }
        }
    }

    private onPlayBGM() {
        if (this.soundOn && this.bgmSource) {
            this.bgmSource.play();
        }
    }

    private onStopBGM() {
        if (this.bgmSource) {
            this.bgmSource.stop();
        }
    }

    private onToggleSound() {
        this.soundOn = !this.soundOn;
        if (this._toggle) {
            this._toggle.isChecked = !this.soundOn;
        }
        this.updateVolume();
    }

    private onSetSoundOn(data: boolean) {
        this.soundOn = data;
        if (this._toggle) {
            this._toggle.isChecked = !this.soundOn;
        }
        this.updateVolume();
    }

    private updateVolume() {
        if (this.bgmSource) {
            this.bgmSource.volume = this.soundOn ? this.bgmMaxVolume : 0;
        }
        if (this.effectSource) {
            this.effectSource.volume = this.soundOn ? this.effectMaxVolume : 0;
        }
        if (this.shotSource) {
            this.shotSource.volume = this.soundOn ? this.shotMaxVolume : 0;
        }
    }

    private _onFirstTouch = () => {
        if (!this._waitForFirstTouch) return;
        this._waitForFirstTouch = false;
        this.soundOn = true;
        if (this._toggle) {
            this._toggle.isChecked = false;
        }
        this.updateVolume();
        // Сразу отписываемся от событий с useCapture=true
        const rootNode = director.getScene().getChildByName('Canvas') || director.getScene();
        if (rootNode) {
            rootNode.off(Node.EventType.TOUCH_START, this._onFirstTouch, this, true);
            rootNode.off(Node.EventType.MOUSE_DOWN, this._onFirstTouch, this, true);
        }
};

    private _findAndBindToggle() {
        // Отписываемся от предыдущего Toggle
        if (this._toggle && this._toggle.node) {
            this._toggle.node.off('toggle', this.onToggleSoundToggle, this);
        }
        this._toggle = null;
        const rootNode = director.getScene().getChildByName('Canvas') || director.getScene();
        if (rootNode) {
            const toggleNode = rootNode.getChildByName('AudioToggle');
            if (toggleNode) {
                this._toggle = toggleNode.getComponent(Toggle);
                if (this._toggle) {
                    this._toggle.node.on('toggle', this.onToggleSoundToggle, this);
                    this._toggle.isChecked = !this.soundOn;
                }
            }
            // Отключаем звук до первого касания только при первом запуске
            if (this._waitForFirstTouch) {
                this.soundOn = false;
                this.updateVolume();
                // Используем useCapture=true, чтобы обработчик сработал даже при клике по кнопке
                rootNode.on(Node.EventType.TOUCH_START, this._onFirstTouch, this, true);
                rootNode.on(Node.EventType.MOUSE_DOWN, this._onFirstTouch, this, true);
            }
        }
    }
}

const soundController = new SoundController();
export default soundController; 
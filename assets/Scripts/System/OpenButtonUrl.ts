import { _decorator, Component, Button, log, warn } from 'cc';

const { ccclass, property } = _decorator;

function openAd() {
  if (typeof window["onCtaClick"] === "function") {
    (window as any).onCtaClick();
    if (typeof window["gameFinish"] === "function") {
        (window as any).gameFinish();
    }
  } else {
    log("Функция 'onCtaClick' не найдена в глобальном объекте window.");
  }
}

@ccclass('OpenButtonUrl')
export class OpenButtonUrl extends Component {
  private button: Button | null = null;

  onLoad() {
    this.button = this.getComponent(Button);
    if (!this.button) {
        warn(`Компонент Button не найден на узле ${this.node.name}`);
    }
  }

  onEnable() {
    this.node.on(Button.EventType.CLICK, this.openMarket, this);
  }

  onDisable() {
    this.node.off(Button.EventType.CLICK, this.openMarket, this);
  }

  openMarket() {
    openAd();
  }
}
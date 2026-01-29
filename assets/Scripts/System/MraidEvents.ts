import { _decorator, Component, log, warn } from 'cc';

const { ccclass } = _decorator;

@ccclass('MraidEvents')

export class MraidEvents extends Component { 
    
    start() {
        if (typeof window['gameStart'] === 'function') {
            (window as any).gameStart();
        } else {
            log("Функция 'gameStart' не найдена в window.");
        }
    }
    
    onDestroy() {
        if (typeof window['gameClose'] === 'function') {
            (window as any).gameClose();
        } else {
            log("Функция 'gameClose' не найдена в window.");
        }
    }
}
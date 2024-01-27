import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";

let lastClickedButtonIndex = -1;
let isAutoClickActive = false;

const settings = definePluginSettings({
    hotkey: { type: OptionType.STRING, description: "Hotkey to trigger AutoClick", default: "F22" }
});

const clickElement = (elementSelector, index) => {
    const buttons = document.querySelectorAll(elementSelector);
    const authorId = '845022164134789191';
    const button = buttons[index] || buttons[0];
    const parentContainer = button?.closest(`[data-author-id="${authorId}"]`);
    const imgSelector = 'img[data-name="🔁"]';

    if (!button || !parentContainer) return console.error(`Button not clicked. Element or parent container not found.`);
    console.log(`Button clicked with index ${index}.`);
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    lastClickedButtonIndex = (index + 1) % buttons.length;
};

export default definePlugin({
    name: "AutoClick",
    description: "Automatically clicks buttons when F22 is pressed.",
    authors: [Devs.LuckyCanucky],
    settings,

    start() { window.addEventListener("keydown", this.event.bind(this)); },
    stop() { window.removeEventListener("keydown", this.event.bind(this)); },
    event(e) {
        if (e.code === settings.store.hotkey) {
            isAutoClickActive = !isAutoClickActive;
            if (isAutoClickActive) clickElement('.container_d09a0b .Button__button', lastClickedButtonIndex);
        }
    }
});

/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import definePlugin, { OptionType } from "@utils/types";
import { MessageObject } from "@api/MessageEvents";
import { ChannelStore, MessageActions, SelectedChannelStore } from "@webpack/common";
import { definePluginSettings } from "@api/Settings";


function sendMessage(channelId: string, content: string) {
    const messageData: Partial<MessageObject> = {
        content,
    };

    MessageActions.sendMessage(channelId, messageData, true);
}

function getCurrentChannelId() {
    return SelectedChannelStore.getChannelId();
}

function handler(event: KeyboardEvent) {
    const hotkey = settings.store.pickHotkey.toLowerCase();

    if (hotkey && event.key.toLowerCase() === hotkey) {
        const channelId = getCurrentChannelId();
        if (channelId) {
            sendMessage(channelId, ".pick");
        }
    }
}

const settings = definePluginSettings({
    pickHotkey: {
        type: OptionType.STRING,
        description: "Hotkey for sending '.pick' into the current channel",
        default: "F23",
    },
});

export default definePlugin({
    name: "AutoPick",
    description: "Sends '.pick' into the current channel when the specified hotkey is pressed.",
    authors: [
        {
            id: 995923917594173440n,
            name: "LuckyCanucky",
        },
    ],
    settings,

    start() {
        window.addEventListener("keydown", handler);
    },

    stop() {
        window.removeEventListener("keydown", handler);
    },
});

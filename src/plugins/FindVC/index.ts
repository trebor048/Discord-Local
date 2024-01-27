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
import { SelectedChannelStore, ChannelStore } from "@webpack/common";
import { definePluginSettings } from "@api/Settings";

const timers = {} as Record<string, {
    timeout?: NodeJS.Timeout;
    i: number;
}>;

function switchToVoiceChannel(channelId: string) {
    const channel = ChannelStore.getChannel(channelId);
    if (!channel || ![2, 13].includes(channel.type)) return;

    const data = (timers[channelId] ??= { timeout: void 0, i: 0 });
    clearTimeout(data.timeout);

    if (++data.i >= 2) {
        // Implement your logic to switch the current channel to the specified voice channel
        console.log(`Switching to voice channel: ${channelId}`);
        // You may use Discord API or other methods to switch the channel here
        // Example: DiscordAPI.switchChannel(channelId);
        delete timers[channelId];
    } else {
        data.timeout = setTimeout(() => {
            delete timers[channelId];
        }, 500);
    }
}

function handler(event: KeyboardEvent) {
    const hotkey = settings.store.FindVCKey.toLowerCase();

    if (hotkey && event.key.toLowerCase() === hotkey) {
        const currentVoiceChannelId = SelectedChannelStore.getVoiceChannelId();
        if (currentVoiceChannelId) {
            switchToVoiceChannel(currentVoiceChannelId);
        }
    }
}

const settings = definePluginSettings({
    FindVCKey: {
        type: OptionType.STRING,
        description: "Finds the current VC Chat you are in by executing the shortcut Home",
        default: "Home",
    },
});

export default definePlugin({
    name: "FindVC",
    description: "Finds the current VC Chat you are in by executing the shortcut Home",
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

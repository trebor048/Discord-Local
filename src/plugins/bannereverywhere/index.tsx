/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { RestAPI } from "@webpack/common";

import style from "./index.css?managed";

const settings = definePluginSettings({
    animate: {
        description: "Animate banners by default",
        type: OptionType.BOOLEAN,
        default: false,
    },
});
const data: { [key: string]: string; } = {};
const membersWithoutBanners: string[] = [];
const membersHovered: string[] = [];

let enabled = false;

async function refreshVisibleMembers() {
    for await (const elem of document.querySelectorAll(
        'div[role="listitem"][class*="member"]'
    )) {
        const rect = elem.getBoundingClientRect();

        if (
            !(
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <=
                (window.innerWidth || document.documentElement.clientWidth)
            )
        )
            continue;

        const avatar = (
            elem.querySelector('img[class*="avatar"]') as any
        ).src.split("/");

        let memberId = "";
        if (avatar[3] === "avatars") memberId = avatar[4];
        else if (avatar[3] === "guilds") memberId = avatar[6];
        else continue;

        if (data[memberId]) continue;
        if (membersWithoutBanners.includes(memberId)) continue;

        let res: any;
        try {
            res = (await RestAPI.get({
                url: `/users/${memberId}`,
            })) as { body: { banner: string; }; };
        } catch (e: any) {
            if (e.status === 429) {
                await new Promise(r => setTimeout(r, e.body.retry_after * 2000));
                continue;
            }
        }

        const { banner } = res.body;

        if (!banner) {
            membersWithoutBanners.push(memberId);
            continue;
        }

        data[
            memberId
        ] = `https://cdn.discordapp.com/banners/${memberId}/${banner}.${banner.startsWith("a_") ? "gif" : "png"
        }?size=4096`;

        // Trigger a rerender via hovering
        elem.dispatchEvent(
            new MouseEvent("mouseover", {
                bubbles: true,
                cancelable: true,
                view: window,
            })
        );

        // Please dont ratelimit us :pleadey:
        await new Promise(r => setTimeout(r, 1000));
    }
    if (enabled) {
        setTimeout(refreshVisibleMembers, 1000);
    }
}

export default definePlugin({
    name: "Banners Everywhere",
    description: "Displays banners in the member list and voice chat",
    authors: [Devs.ImLvna, Devs.AutumnVN, Devs.pylix, Devs.TheKodeToad],
    settings,
    patches: [
        {
            find: '["aria-selected"])',
            replacement:
            {
                // i am so sorry for this patch
                match: /(forwardRef\(\(function\((\w{1,2})(.+?"listitem",)innerRef:\w{1,2},children:)(\w{1,2})/,
                replace: "$1[$self.memberListBannerHook($2), $4]",
            },
        },

    ],

    start() {
        enableStyle(style);
        enabled = true;
        refreshVisibleMembers();
    },

    stop() {
        enabled = false;
        disableStyle(style);
    },

    memberListBannerHook(props: any) {
        let url = this.getBanner(props.avatar._owner.pendingProps.user.id);
        if (url === "") return;
        let isHovered = props.subText._owner.memoizedState?.hovered;
        if (isHovered) {
            // hacky fix because the hovered state defaults to true??????/
            if (!membersHovered.includes(props.avatar._owner.pendingProps.user.id)) {
                isHovered = false;
            }
        } else membersHovered.push(props.avatar._owner.pendingProps.user.id);
        if (!settings.store.animate && !isHovered) {
            url = url.replace(".gif", ".png");
        }
        return (
            <img src={url} className="bannersEverywhere-memberlist"></img>
        );
    },

    getBanner(userId: string) {
        if (data[userId]) return data[userId];
        if (Vencord.Plugins.isPluginEnabled("USRBG") && (Vencord.Plugins.plugins.USRBG as any).data[userId]) {
            data[userId] = (Vencord.Plugins.plugins.USRBG as any).data[userId];
            return data[userId];
        }
        return "";
    },
});

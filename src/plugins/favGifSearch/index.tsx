/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import ErrorBoundary from "@components/ErrorBoundary";
import { findByPropsLazy } from "@webpack";
import { useCallback, useEffect, useRef, useState } from "@webpack/common";
import { definePluginSettings } from "@api/Settings";

interface SearchBarComponentProps {
    ref?: React.MutableRefObject<any>;
    autoFocus: boolean;
    className: string;
    size: string;
    onChange: (query: string) => void;
    onClear: () => void;
    query: string;
    placeholder: string;
}

type TSearchBarComponent =
    React.FC<SearchBarComponentProps> & { Sizes: Record<"SMALL" | "MEDIUM" | "LARGE", string>; };

interface Gif {
    format: number;
    src: string;
    width: number;
    height: number;
    order: number;
    url: string;
}

interface Instance {
    dead?: boolean;
    state: {
        resultType?: string;
    };
    props: {
        favCopy: Gif[],
        favorites: Gif[],
    },
    forceUpdate: () => void;
}

const containerClasses: { searchBar: string; } = findByPropsLazy("searchBar", "searchBarFullRow");

export const settings = definePluginSettings({
    searchOption: {
        type: OptionType.SELECT,
        description: "The part of the url you want to search",
        options: [
            {
                label: "Entire Url",
                value: "url"
            },
            {
                label: "Path Only (/somegif.gif)",
                value: "path"
            },
            {
                label: "Host & Path (tenor.com somgif.gif)",
                value: "hostandpath",
                default: true
            }
        ] as const
    },
    showFavoritesFirst: {
        type: OptionType.BOOLEAN,
        description: "Show favorite gifs first when opening the gif drawer",
        default: true,
    }
});

export default definePlugin({
    name: "FavGifDrawer",
    authors: [
        Devs.Samwich,
        Devs.Aria
    ],
    description: "Combination of FavsOnOpen and FavoriteGifSearch plugins.",
    patches: [
        {
            find: ".GIFPickerResultTypes.SEARCH",
            replacement: [{
                match: "this.state={resultType:null}",
                replace: 'this.state={resultType:"Favorites"}'
            }]
        },
        {
            find: "renderHeaderContent()",
            replacement: [
                {
                    match: /(renderHeaderContent\(\).{1,150}FAVORITES:return)(.{1,150});(case.{1,200}default:return\(0,\i\.jsx\)\((?<searchComp>\i\..{1,10}),)/,
                    replace: "$1 this.state.resultType === 'Favorites' ? $self.renderSearchBar(this, $<searchComp>) : $2;$3"
                },
                {
                    match: /(,suggestions:\i,favorites:)(\i),/,
                    replace: "$1$self.getFav($2),favCopy:$2,"
                }
            ]
        }
    ],

    settings,

    getTargetString,

    instance: null as Instance | null,
    renderSearchBar(instance: Instance, SearchBarComponent: TSearchBarComponent) {
        this.instance = instance;
        return (
            <ErrorBoundary noop={true}>
                <SearchBar instance={instance} SearchBarComponent={SearchBarComponent} />
            </ErrorBoundary>
        );
    },

    getFav(favorites: Gif[]) {
        if (!this.instance || this.instance.dead) return favorites;
        const { favorites: filteredFavorites } = this.instance.props;

        return filteredFavorites != null && filteredFavorites?.length !== favorites.length ? filteredFavorites : favorites;

    },

    onStart() {
        if (settings.store.showFavoritesFirst && this.instance) {
            // Set the initial state to show favorites
            this.instance.state.resultType = 'Favorites';
            this.instance?.forceUpdate();
        }
    }
});

function SearchBar({ instance, SearchBarComponent }: { instance: Instance; SearchBarComponent: TSearchBarComponent; }) {
    const [query, setQuery] = useState("");
    const ref = useRef<{ containerRef?: React.MutableRefObject<HTMLDivElement>; } | null>(null);

    const onChange = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        const { props } = instance;

        if (searchQuery === "") {
            props.favorites = props.favCopy;
            instance.forceUpdate();
            return;
        }

        ref.current?.containerRef?.current
            .closest("#gif-picker-tab-panel")
            ?.querySelector("[class|=\"content\"]")
            ?.firstElementChild?.scrollTo(0, 0);

        const result =
            props.favCopy
                .map(gif => ({
                    score: fuzzySearch(searchQuery.toLowerCase(), getTargetString(gif.url ?? gif.src).replace(/(%20|[_-])/g, " ").toLowerCase()),
                    gif,
                }))
                .filter(m => m.score != null) as { score: number; gif: Gif; }[];

        result.sort((a, b) => b.score - a.score);
        props.favorites = result.map(e => e.gif);

        instance.forceUpdate();
    }, [instance.state]);

    useEffect(() => {
        return () => {
            instance.dead = true;
        };
    }, []);

    return (
        <SearchBarComponent
            ref={ref}
            autoFocus={true}
            className={containerClasses.searchBar}
            size={SearchBarComponent.Sizes.MEDIUM}
            onChange={onChange}
            onClear={() => {
                setQuery("");
                if (instance.props.favCopy != null) {
                    instance.props.favorites = instance.props.favCopy;
                    instance.forceUpdate();
                }
            }}
            query={query}
            placeholder={Vencord.Plugins.isPluginEnabled("FavoriteAnything") ? "Search Favorite Media" : "Search Favorite GIFs"}
        />
    );
}

export function getTargetString(urlStr: string) {
    const url = new URL(urlStr);
    switch (settings.store.searchOption) {
        case "url":
            return url.href;
        case "path":
            if (url.host === "media.discordapp.net" || url.host === "tenor.com" || url.host === "i.imgur.com" || url.host === "imgur.com" || url.host === "cdn.discordapp.com")
                return url.pathname.split("/").at(-1) ?? url.pathname;
            return url.pathname;
        case "hostandpath":
            if (url.host === "media.discordapp.net" || url.host === "tenor.com" || url.host === "i.imgur.com" || url.host === "imgur.com" || url.host === "cdn.discordapp.com")
                return `${url.host} ${url.pathname.split("/").at(-1) ?? url.pathname}`;
            return `${url.host} ${url.pathname}`;

        default:
            return "";
    }
}

function fuzzySearch(searchQuery: string, searchString: string) {
    let searchIndex = 0;
    let score = 0;

    for (let i = 0; i < searchString.length; i++) {
        if (searchString[i] === searchQuery[searchIndex]) {
            score++;
            searchIndex++;
        } else {
            score--;
        }

        if (searchIndex === searchQuery.length) {
            return score;
        }
    }

    return null;
}

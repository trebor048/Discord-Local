import definePlugin from "@utils/types";
import { waitFor } from "@webpack";

const dismissables: any = {};

waitFor("getDismissedGuildContent", (m: any) => dismissables.userSettingsStore = m);

dismissables.displayDismissable = function(ID: string | number, bypassFatigue: boolean = false) {
    ID = convertID(ID);
    if (bypassFatigue) dismissables.bypassFatigue.add(ID);
    dismissables.resetDismissable(ID);
    dismissables.dismissableStore.currentlyShown.add(ID);
}

dismissables.resetDismissable = function(ID: string | number) {
    ID = convertID(ID);
    setFlag(dismissables.userSettingsStore.settings.userContent.dismissedContents, ID, 0);
};

dismissables.resetAllDismissables = function() {
    dismissables.userSettingsStore.settings.userContent.dismissedContents = new Uint8Array(Math.ceil(Object.keys(dismissables.enum).length/16));
};

dismissables.timeouts = [3e5, 18e5];

function convertID(ID: string | number): number {
    if (dismissables.enum[ID]) {
        if (typeof ID === "string") {
            return dismissables.enum[ID];
        }
        return ID;
    }
    throw new Error(`Invalid ID (${ID})`);
}

function setFlag(arr: Uint8Array, flag: number, state: 1 | 0) {
    if (state === 1) {
        arr[flag/8|0] |= 1<<flag%8;
    } else if (state === 0) {
        arr[flag/8|0] &= ~(1<<flag%8);
    }
}

export default definePlugin({
    name: "dismissables",
    description: "guh",
    authors: [{
        id: 457579346282938368n,
        name: "Davri",
    }],

    patches: [{
        find: "shownFatigableCandidate",
        replacement: {
            match: /(\i)\.unschedule\(\)\};function \i\(\i\)\{return (\i)\(\i\)\}/,
            replace: "$&Object.defineProperty($self.dismissables,\"dismissableStore\",{get:()=>$2.getState()});$self.dismissables.scheduleActions=$1"
        }
    }, {
        find: "shownFatigableCandidate",
        replacement: {
            match: /\.lastWinnerTime>(\d+e\d+)/,
            replace: ".lastWinnerTime>($self.dismissables.timeouts[0]??$1)"
        }
    }, {
        find: "shownFatigableCandidate",
        replacement: {
            match: /\.lastWinnerTime<(\d+e\d+)/,
            replace: ".lastWinnerTime<($self.dismissables.timeouts[1]??$1)"
        }
    }, {
        find: ".GG_ANNOUNCEMENT,",
        replacement: {
            match: /(\i)=new Set\(\[(\i)\.(\i)\..*\]\)/,
            replace: "$&;$self.dismissables.bypassFatigue=$1;$self.dismissables.enum=$2.$3"
        }
    }],

    dismissables,

    start() {
        window.dismissables = dismissables;
    }
});
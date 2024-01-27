## Dismissables

Exposes objects related to dismissable content under `window.dismissables`:

**bypassFatigue** - set of dismissable ids that can bypass the fatigue (being shown alongside other dismissables of the same type)\
**displayDismissable(ID, bypassFatigue)** - tries to display a dismissable of the specified ID (number or string). Note that there could be other checks, such as the user being a nitro subscriber.\
**enum** - all dismissables\
**resetAllDismissables()** - resets usercontent to the initial state\
**resetDismissable(ID)** - resets a specific dismissable to its initial state\
**scheduleActions** - some kind of automatic schedule handler, not entirely sure\
**timeouts** - default timeouts before the next dismissable is shown (5 minutes, 30 minutes)\
**dismissableStore** - object containing information about queued candidates, currently shown dismissables, and previous candidates

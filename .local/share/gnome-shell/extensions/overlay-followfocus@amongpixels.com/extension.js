const Main = imports.ui.main;
const Workspace = imports.ui.workspace;

let overlayInjections, workspaceInjections;

function resetState() {
    overlayInjections = { };
    workspaceInjections = { };
    windowToFocus = null;
}

function injectToFunction(parent, name, func) {
    let origin = parent[name];
    parent[name] = function() {
        let ret;
        ret = origin.apply(this, arguments);
        if (ret === undefined)
            ret = func.apply(this, arguments);
        return ret;
    }
    
    return origin;
}

function removeInjection(object, injection, name) {
    object[name] = injection[name];
}


function init() {
    // do nothing
}

function enable() {

    resetState();
    
    overlayInjections['_onEnter'] = injectToFunction(Workspace.WindowOverlay.prototype, '_onEnter', function () {
        this._windowClone.mouseOvered = true;
    });
    
    overlayInjections['_onLeave'] = injectToFunction(Workspace.WindowOverlay.prototype, '_onLeave', function () {
        this._windowClone.mouseOvered = false;
    });
    
    workspaceInjections['zoomFromOverview'] = injectToFunction(Workspace.Workspace.prototype, 'zoomFromOverview', function () {
        
        // See if any window was mouseovered at the time of going back to normal desktop
        for (let i = 0; i < this._windows.length; i++) {
            let clone = this._windows[i];
            
            if ( (clone.mouseOvered !== undefined) && (clone.mouseOvered) ) {
                // Activate that window
                clone.metaWindow.activate(global.get_current_time());
            }
        }
        
    });
    
}

function disable() {

    for (i in overlayInjections) {
        removeInjection(Workspace.WindowOverlay.prototype, overlayInjections, i);
        global.log("removing injection " + i);
    }
    
    for (i in workspaceInjections) {
        removeInjection(Workspace.Workspace.prototype, workspaceInjections, i);
    }
    
    resetState();
    
}

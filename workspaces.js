const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.base.Base;
const Window = Me.imports.windows.Window;
const Mainloop = imports.mainloop;
const HighlightedArea = Me.imports.highlight.HighlightedArea;
const Grid = Me.imports.grid.Grid;
const GridDisplay = Me.imports.grid.GridDisplay;


var WorkspaceManager = class WorkspaceManager extends Base {
  constructor({ settings }) {
    super();
    this.log('Initializing');

    const manager = global.workspace_manager;
    this._manager = manager;
    this._settings = settings;
    this._workspaces = this._loadExistingWorkspaces();
    this._bindings = [
      manager.connect('workspace-added', this._handleWorkspaceAdded),
      manager.connect('workspace-removed', this._handleWorkspaceRemoved),
      manager.connect('active-workspace-changed', this._handleActiveWorkspaceChanged),
    ];
  }

  _loadExistingWorkspaces() {
    this.log('Loading existing workspaces');

    const workspaceCount = this._manager.get_n_workspaces();
    let workspaces = [];

    for (let i = 0; i < workspaceCount; i++)
      workspaces.push(this._createWorkspace(i));

    return workspaces;
  }

  _createWorkspace(index) {
    const gnomeWorkspace = this._manager.get_workspace_by_index(index);
    return new Workspace({
      workspace: gnomeWorkspace,
      settings: this._settings,
    });
  }

  _handleWorkspaceAdded(manager, index) {
    this.log('Workspace added: ' + index);

    const newWorkspace = this._createWorkspace(index);
    this._workspaces.splice(index, 0, newWorkspace);
  }

  _handleWorkspaceRemoved(manager, index) {
    this.log('Workspace removed: ' + index);

    const [workspace] = this._workspaces.splice(index, 1);
    workspace.destroy();
  }

  _handleActiveWorkspaceChanged() {
    this.log('Active workspace changed');
    this._workspaces.forEach(ws => ws.hideGrid());
  }

  destroy() {
    this._bindings.forEach(binding => this._manager.disconnect(binding));
    this._bindings = null;

    this._workspaces.forEach(workspace => workspace.destroy());
    this._workspaces = null;

    this._manager = null;
  }

  getActiveWorkspace() {
    const activeIndex = this._manager.get_active_workspace_index();
    return this._workspaces[activeIndex];
  }
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var Workspace = class Workspace extends Base {

  get logId() {
    return this._workspace
      ? `Workspace ${this._workspace.index()}`
      : 'Workspace';
  }

  constructor({ workspace, settings }) {
    super();

    this._workspace = workspace;
    this._display = workspace.get_display();
    this._settings = settings;
    this._windows = this._loadExistingWindows();

    this._workspaceBindings = [
      workspace.connect('window-added', this._handleWindowAdded),
      workspace.connect('window-removed', this._handleWindowRemoved),
    ];

    this._displayBindings = [
      this._display.connect('grab-op-begin', this._handleWindowStartMoveOrResize),
      this._display.connect('grab-op-end', this._handleWindowMovedOrResized),
    ];

    settings.addChangeBinding('grid-rows', this._handleGridRowsChanged);

    const workArea = this._getLayoutArea();
    this._grid = new Grid({ boundingRect: workArea, settings });
    this._gridDisplay = new GridDisplay({ grid: this._grid });

    Mainloop.timeout_add(300, () => this.arrange());
  }

  destroy() {
    this._workspaceBindings.forEach(binding => this._workspace.disconnect(binding));
    this._workspaceBindings = null;

    this._displayBindings.forEach(binding => this._display.disconnect(binding));
    this._displayBindings = null;

    this._settings.removeChangeBinding('grid-rows', this._handleGridRowChanged);

    this._windows.forEach(window => window.destroy());
    this._windows = null;

    this._workspace = null;
    this._display = null;

    this._gridDisplay.destroy();
    this._gridDisplay = null;
  }

  _getLayoutArea() {
    return this._workspace.get_work_area_all_monitors();
  }

  _loadExistingWindows() {
    const gnomeWindows = this._workspace.list_windows() || [];
    const windowsToCreate = gnomeWindows.filter(gw => gw.get_window_type() === Meta.WindowType.NORMAL);
    return windowsToCreate.map(this._createWindow);
  }

  _createWindow(gnomeWindow) {
    return new Window({
      gnomeWindow,
      onFocused: this._handleWindowFocused,
      // onSizeChanged: this._handleWindowSizeChanged,
    });
  }

  _handleWindowAdded(_, gnomeWindow) {
    this.log('Window added');
    const windowType = gnomeWindow.get_window_type();
    if (windowType !== Meta.WindowType.NORMAL)
      return;

    const window = this._createWindow(gnomeWindow);
    this._windows.push(window);

    const attemptLayout = remainingAttempts => {
      if (window.isReady()) {
        this.log('Window ready, snapping...');
        this.snapWindowToGrid(window);
      } else if (remainingAttempts)
        Mainloop.timeout_add(50, () => attemptLayout(remainingAttempts - 1));
      else
        this.log('Window still not ready, giving up');
    };

    Mainloop.timeout_add(100, () => attemptLayout(50));
  }

  _handleWindowRemoved(_, gnomeWindow) {
    this.log('Window removed');
    const window = this._findWindow(gnomeWindow);
    if (!window)
      return;

    this._windows = this._windows.filter(w => w !== window);
    window.destroy();
  }

  _handleWindowFocused(window) {
    this.log(`Window focused`);
  }

  _handleWindowStartMoveOrResize(display, display2, gnomeWindow, grabOp) {
    this.log('handleWindowStartMoveOrResize', display, display2, gnomeWindow, grabOp);
    const window = this._findWindow(gnomeWindow);
    const bailOnThese = [
      Meta.GrabOp.NONE,
      Meta.GrabOp.COMPOSITOR,
      Meta.GrabOp.WAYLAND_POPUP,
      Meta.GrabOp.FRAME_BUTTON,
    ];

    if (!window || bailOnThese.includes(grabOp))
      return;

    this._gridDisplay.show();
  }

  _handleWindowMovedOrResized(display, display2, gnomeWindow, grabOp) {
    this.log('handleWindowMovedOrResized', display, display2, gnomeWindow, grabOp);
    const window = this._findWindow(gnomeWindow);
    const ignoredOps = [
      Meta.GrabOp.NONE,
      Meta.GrabOp.COMPOSITOR,
      Meta.GrabOp.WAYLAND_POPUP,
      Meta.GrabOp.FRAME_BUTTON,
    ];

    if (!window || ignoredOps.includes(grabOp))
      return;

    this._gridDisplay.hide();
    this.snapWindowToGrid(window);
  }

  _handleGridRowsChanged() {
    const { rows } = this._settings.getValues('grid-rows');
    this.log('Grid rows changed: ' + rows);
  }

  snapWindowToGrid(window) {
    const windowRect = window.getBoundingRect();
    const snappedRect = this._grid.snapRectToGrid(windowRect);
    window.setBoundingRect(snappedRect);
  }

  _findWindow(gnomeWindow) {
    return this._windows.find(window => window.isSameWindow(gnomeWindow));
  }

  arrange() {
    this.log('Arranging workspace');

    const workArea = this._getLayoutArea();
    this._grid.setBoundingRect(workArea);
    this._gridDisplay.update(this._grid);
    this._windows.forEach(this.snapWindowToGrid);
  }

  showGrid() {
    this._gridDisplay.show();
  }

  hideGrid() {
    this._gridDisplay.hide();
  }

  toggleGrid() {
    this.log('Toggling grid');
    this._gridDisplay.toggle();
  }

  getFocusedWindow() {
    const window = this._windows.find(win => win.isFocused());
    return window;
  }

  transformWindow({ window, top = 0, left = 0, columns = 0, rows = 0 }) {
    const windowRect = window.getBoundingRect();
    const gridRect = this._grid.screenToGrid(windowRect);
    const newGridRect = {
      top: gridRect.top + top,
      left: gridRect.left + left,
      columns: gridRect.columns + columns,
      rows: gridRect.rows + rows,
    };
    const newWindowRect = this._grid.gridToScreen(newGridRect);
    window.setBoundingRect(newWindowRect);
  }

  moveWindowLeft() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, left: -1 });
  }

  moveWindowRight() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, left: 1 });
  }

  moveWindowUp() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, top: -1 });
  }

  moveWindowDown() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, top: 1 });
  }

  growWindowWider() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, columns: 1 });
  }

  growWindowNarrower() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, columns: -1 });
  }

  growWindowTaller() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, rows: 1 });
  }

  growWindowShorter() {
    const window = this.getFocusedWindow();
    this.transformWindow({ window, rows: -1 });
  }
};
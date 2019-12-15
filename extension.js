const Me = imports.misc.extensionUtils.getCurrentExtension();
const Log = Me.imports.log.Log;
const Settings = Me.imports.settings.Settings;
const WorkspaceManager = Me.imports.workspaces.WorkspaceManager;

let settings = null;
let workspaceManager = null;

function init() {
  Log('Initializing');
}

function enable() {
  Log('Enabling');

  settings = new Settings();
  settings.addKeyBinding('arrange-workspace', handleArrangeWorkspace);
  settings.addKeyBinding('toggle-grid', handleToggleGrid);
  settings.addKeyBinding('move-left', handleMoveLeft);
  settings.addKeyBinding('move-right', handleMoveRight);
  settings.addKeyBinding('move-up', handleMoveUp);
  settings.addKeyBinding('move-down', handleMoveDown);
  settings.addKeyBinding('grow-wider', handleGrowWider);
  settings.addKeyBinding('grow-narrower', handleGrowNarrower);
  settings.addKeyBinding('grow-taller', handleGrowTaller);
  settings.addKeyBinding('grow-shorter', handlerGrowShorter);

  workspaceManager = new WorkspaceManager({ settings });
}

function disable() {
  Log('Disabling');

  settings.destroy();
  settings = null;

  workspaceManager.destroy();
  workspaceManager = null;
}


function handleArrangeWorkspace(display, something, keybinding) {
  Log('handleArrangeWorkspace', ...arguments);
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.arrange();
}

function handleToggleGrid() {
  Log('handleToggleGrid');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.toggleGrid();
}

function handleMoveLeft() {
  Log('handleMoveLeft');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.moveWindowLeft();
}

function handleMoveRight() {
  Log('handleMoveRight');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.moveWindowRight();
}

function handleMoveUp() {
  Log('handleMoveUp');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.moveWindowUp();
}

function handleMoveDown() {
  Log('handleMoveDown');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.moveWindowDown();
}

function handleGrowWider() {
  Log('handleGrowWider');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.growWindowWider();
}

function handleGrowNarrower() {
  Log('handleGrowNarrower');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.growWindowNarrower();
}

function handleGrowTaller() {
  Log('handleGrowTaller');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.growWindowTaller();
}

function handlerGrowShorter() {
  Log('handleGrowShorter');
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  activeWorkspace.growWindowShorter();
}
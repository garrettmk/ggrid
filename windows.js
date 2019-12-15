const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.base.Base;
const Meta = imports.gi.Meta;


var Window = class Window extends Base {
  constructor({ gnomeWindow, onFocused, onSizeChanged }) {
    super();

    this.log('Initializing');
    this._window = gnomeWindow;
    this._onFocused = onFocused;
    this._onSizeChanged = onSizeChanged;

    this._bindings = [
      gnomeWindow.connect('focus', this._handleWindowFocused),
      gnomeWindow.connect('size-changed', this._handleSizeChanged),
    ];
  }

  get logId() {
    if (!this._window)
      return super.logId;

    return `Window ${this._window.wm_class} ${this._window.get_id()}`;
  }

  destroy() {
    this._bindings.forEach(binding => this._window.disconnect(binding));
    this._bindings = null;

    this._window = null;
  }

  _handleWindowFocused() {
    this._isReady = true;
    const callback = this._onFocused;

    if (callback)
      callback(this);
  }

  _handleSizeChanged() {
    const callback = this._onSizeChanged;

    if (callback)
      callback(this);
  }

  isSameWindow(gnomeWindow) {
    if (!gnomeWindow)
      return false;

    const gnomeWindowId = gnomeWindow.get_id();
    const myWindowId = this._window.get_id();

    return myWindowId === gnomeWindowId;
  }

  getBoundingRect() {
    return this._window.get_frame_rect();
  }

  setBoundingRect({ x, y, width, height }) {
    const isMaximized = this._window.get_maximized();
    if (isMaximized)
      this._window.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);

    this._window.move_resize_frame(false, x, y, width, height);
  }

  isReady() {
    return Boolean(this._isReady);
  }

  isFocused() {
    return this._window.has_focus();
  }
};
const Me = imports.misc.extensionUtils.getCurrentExtension();
const St = imports.gi.St;
const Main = imports.ui.main;
const Base = Me.imports.base.Base;


var HighlightedArea = class HighlightedArea extends Base {
  constructor({ x = 0, y = 0, width = 0, height = 0, visible = false } = {}) {
    super();

    this._rect = { x, y, width, height };
    this._visible = visible;
    this._actor = new St.BoxLayout({
      style_class: 'highlighted-area',
      visible: true,
      x, y, width, height
    });

    Main.uiGroup.add_actor(this._actor);

    if (visible)
      this.show();
  }

  destroy() {
    Main.uiGroup.remove_actor(this._actor);
  }

  setBoundingRect({ x, y, width, height }) {
    this._rect = { x, y, width, height };
    Object.assign(this._actor, this._rect);
  }

  show() {
    this._visible = true;
    this._actor.add_style_pseudo_class('visible');
  }

  hide() {
    this._visible = false;
    this._actor.remove_style_pseudo_class('visible');
  }

  toggle() {
    this._visible = !this._visible;
    this._visible ? this.show() : this.hide();
  }
};
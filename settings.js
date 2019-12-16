const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.base.Base;


var Settings = class Settings extends Base {
  constructor() {
    super();

    const directory = Me.dir.get_child('schemas').get_path();
    const source = Gio.SettingsSchemaSource.new_from_directory(
      directory,
      Gio.SettingsSchemaSource.get_default(),
      false
    );

    if (!source)
      throw new Error('Could not set up settings source.');

    const schemaKey = Me.metadata['settings-schema'];
    const schema = source.lookup(schemaKey, false);

    if (!schema)
      throw new Error('Could not find schema.');

    this._settings = new Gio.Settings({ settings_schema: schema });
    this._keybindings = {};
    this._changeBindings = [];
  }

  destroy() {
    Object.keys(this._keybindings).forEach(key => Main.wm.removeKeybinding(key));
    this._keybindings = {};


  }

  addKeyBinding(key, fn) {
    const ModeType = Shell.hasOwnProperty('ActionMode') ? Shell.ActionMode : Shell.KeyBindingMode;
    const success = Main.wm.addKeybinding(
      key,
      this._settings,
      Meta.KeyBindingFlags.NONE,
      ModeType.NORMAL | ModeType.OVERVIEW,
      fn
    );

    if (success)
      this._keybindings[key] = true;
    else
      this.log('Failed to bind to key: ' + key);
  }

  removeKeyBinding(key) {
    delete this._keybindings[key];
    Main.wm.removeKeybinding(key);
  }

  getValue(key) {
    const variant = this._settings.get_value(key);
    const type = variant.get_type_string();

    switch (type) {
      case 'b':
        return variant.get_boolean();

      case 'y':
        return variant.get_byte();

      case 'n':
        return variant.get_int16();

      case 'q':
        return variant.get_uint16();

      case 'i':
        return variant.get_int32();

      case 'u':
        return variant.get_uint32();

      case 'x':
        return variant.get_int64();

      case 't':
        return variant.get_uint64();

      case 'h':
        return variant.get_handle();

      case 'd':
        return variant.get_double();

      case 's':
        return variant.get_string();

      default:
        throw new Error('Unrecognized type: ' + type);
    }
  }

  getValues(...keys) {
    return keys.map(key => this.getValue(key));
  }

  addChangeBinding(key, fn) {
    this.removeChangeBinding(key, fn);

    const eventKey = `changed::${key}`;
    this._changeBindings.push({
      key,
      fn,
      ref: this._settings.connect(eventKey, fn)
    });
  }

  removeChangeBinding(key, fn) {
    const existingBinding = this._changeBindings.find(binding => binding.key === key && binding.fn === fn);
    if (!existingBinding)
      return;

    this._settings.disconnect(existingBinding.ref);
    this._changeBindings = this._changeBindings.filter(binding => binding !== existingBinding);
  }
};
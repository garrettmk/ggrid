const Me = imports.misc.extensionUtils.getCurrentExtension();
const Log = Me.imports.log.Log;

var Base = class Base {
  constructor() {
    const methodNames = enumerateAllMethods(this);
    methodNames.forEach(name => this[name] = this[name].bind(this));
  }

  get logId() {
    return Object.getPrototypeOf(this).constructor.name;
  }

  log(...args) {
    Log(`[${this.logId}]`, ...args);
  }
};

function enumerateAllMethods(obj) {
  const prototype = Object.getPrototypeOf(obj);
  if (!prototype || prototype.constructor.name === 'Object')
    return [];

  const ownMethodNames = Object.getOwnPropertyNames(prototype).filter(
    name => name !== 'constructor' && typeof obj[name] === 'function'
  );

  const inheritedMethodNames = enumerateAllMethods(prototype);

  return [...new Set([...ownMethodNames, ... inheritedMethodNames])];
}
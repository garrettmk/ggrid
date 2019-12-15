const Me = imports.misc.extensionUtils.getCurrentExtension();
const UUID = Me.metadata['uuid'];


function Log(...args) {
  const logString = args.reduce(
    (result, arg) => `${result} ${arg}`,
    `[${UUID}]`
  );

  log(logString);
}
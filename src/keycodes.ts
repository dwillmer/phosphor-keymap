/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';


/**
 * Create a normalize keystroke for a `'keydown'` event.
 *
 * @param event - The event object for a `'keydown'` event.
 *
 * @returns The normalized keystroke string for the event.
 *
 * #### Notes
 * This function uses the `keyCode` property of the event to determine
 * which key was pressed. The code will be incorrect for a `'keypress'`
 * event, so this function must only be used for a `'keydown'` event.
 */
export
function keystrokeForKeydownEvent(event: KeyboardEvent): string {
  var prefix = '';
  if (event.ctrlKey) prefix += 'ctrl+';
  if (event.altKey) prefix += 'alt+';
  if (event.shiftKey) prefix += 'shift+';
  if (event.metaKey) prefix += 'cmd+';
  return prefix + keyForKeyCode(event.keyCode);
}


/**
 * Normalize and validate a keystroke.
 *
 * @param keystroke - The keystroke to normalize.
 *
 * @returns The lower cased and canonically ordered keystroke.
 *
 * @throws An error if the keystroke has an invalid format.
 *
 * #### Notes
 * The keystroke must adhere to the following format:
 *
 *   `[<modifier-1>+[<modifier-2>+[<modifier-n>+]]]<key>`
 *
 *   - Supported modifiers are `'ctrl'`, `'alt'`, `'shift'`, `'cmd'`.
 *   - The `'cmd'` modifier only works on OSX (browser limitation).
 *   - The modifiers may appear in any order.
 *   - The modifiers cannot appear in duplicate.
 *   - The primary key must be a valid key character.
 *   - The keystroke is case insensitive.
 *
 * If the key does not adhere to the format, an error will be thrown.
 */
export
function normalizeKeystroke(keystroke: string): string {
  var key = '';
  var sep = false;
  var alt = false;
  var cmd = false;
  var ctrl = false;
  var shift = false;
  var tokens = keystroke.toLowerCase().split(/(\+)/).filter(s => !!s);
  for (var i = 0, n = tokens.length; i < n; ++i) {
    var token = tokens[i];
    if (token === '+') {
      if (sep || key || !(alt || cmd || ctrl || shift)) {
        throwKeystrokeError(keystroke);
      }
      sep = true;
    } else if (token === 'alt') {
      if (alt || key) {
        throwKeystrokeError(keystroke);
      }
      alt = true;
      sep = false;
    } else if (token === 'cmd') {
      if (cmd || key) {
        throwKeystrokeError(keystroke);
      }
      cmd = true;
      sep = false;
    } else if (token === 'ctrl') {
      if (ctrl || key) {
        throwKeystrokeError(keystroke);
      }
      ctrl = true;
      sep = false;
    } else if (token === 'shift') {
      if (shift || key) {
        throwKeystrokeError(keystroke);
      }
      shift = true;
      sep = false;
    } else {
      if (key || token === 'meta' || !(token in KEY_CODE_MAP_INV)) {
        throwKeystrokeError(keystroke);
      }
      key = token;
      sep = false;
    }
  }
  if (!key) {
    throwKeystrokeError(keystroke);
  }
  var prefix = '';
  if (ctrl) prefix += 'ctrl+';
  if (alt) prefix += 'alt+';
  if (shift) prefix += 'shift+';
  if (cmd) prefix += 'cmd+';
  return prefix + key;
}


/**
 * A mapping of key code to key character.
 */
var KEY_CODE_MAP: { [key: number]: string } = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  19: 'pause',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'insert',
  46: 'delete',
  48: '0',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',
  59: ';', // firefox
  61: '=', // firefox
  65: 'a',
  66: 'b',
  67: 'c',
  68: 'd',
  69: 'e',
  70: 'f',
  71: 'g',
  72: 'h',
  73: 'i',
  74: 'j',
  75: 'k',
  76: 'l',
  77: 'm',
  78: 'n',
  79: 'o',
  80: 'p',
  81: 'q',
  82: 'r',
  83: 's',
  84: 't',
  85: 'u',
  86: 'v',
  87: 'w',
  88: 'x',
  89: 'y',
  90: 'z',
  91: 'meta',
  92: 'meta',
  93: 'contextmenu',
  96: 'numpad0',
  97: 'numpad1',
  98: 'numpad2',
  99: 'numpad3',
  100: 'numpad4',
  101: 'numpad5',
  102: 'numpad6',
  103: 'numpad7',
  104: 'numpad8',
  105: 'numpad9',
  106: 'multiply',
  107: 'add',
  109: 'subtract',
  110: 'decimal',
  111: 'divide',
  112: 'f1',
  113: 'f2',
  114: 'f3',
  115: 'f4',
  116: 'f5',
  117: 'f6',
  118: 'f7',
  119: 'f8',
  120: 'f9',
  121: 'f10',
  122: 'f11',
  123: 'f12',
  124: 'f13',
  125: 'f14',
  126: 'f15',
  144: 'numlock',
  145: 'scrolllock',
  173: '-', // firefox
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: '\'',
  224: 'meta',  // firefox
};


/**
 * A mapping of key character to key code.
 */
var KEY_CODE_MAP_INV: { [key: string]: number } = {};


// Populate the key characters from the key codes map.
(() => {
  for (var key in KEY_CODE_MAP) {
    var n = parseInt(key, 10);
    var c = KEY_CODE_MAP[key];
    KEY_CODE_MAP_INV[c] = n;
  }
})();


/**
 * Throw an error for an invalid keystroke.
 */
function throwKeystrokeError(keystroke: string): void {
  throw new Error('Invalid Keystroke: ' + keystroke);
}


/**
 * Get the key character for a key code.
 *
 * If the code is not valid, an empty string is returned.
 */
function keyForKeyCode(code: number): string {
  return KEY_CODE_MAP[code] || '';
}

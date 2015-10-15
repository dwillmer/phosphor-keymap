/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';


/**
 * Create a normalized keystroke for a `'keydown'` event.
 *
 * @param event - The event object for a `'keydown'` event.
 *
 * @returns The normalized keystroke string for the event, or an
 *   empty string if the event does not represent a valid shortcut.
 *
 * #### Notes
 * TODO - conversion rules
 */
export
function keystrokeForKeydownEvent(event: KeyboardEvent): string {
  var key = keyForKeydownEvent(event);
  if (!key) {
    return '';
  }
  var modifiers = '';
  if (IS_MAC && event.metaKey) {
    modifiers += 'Cmd ';
  }
  if (key.length === 1) {
    if (event.ctrlKey && (!IS_WIN || !event.altKey)) {
      modifiers += 'Ctrl ';
    }
  } else {
    if (event.ctrlKey) {
      modifiers += 'Ctrl ';
    }
    if (event.altKey) {
      modifiers += 'Alt ';
    }
    if (event.shiftKey) {
      modifiers += 'Shift ';
    }
  }
  return modifiers + key;
}


/**
 * Normalize and validate a keystroke.
 *
 * @param keystroke - The keystroke to normalize.
 *
 * @returns The lower cased and canonically ordered keystroke.
 *
 * @throws An error if the keystroke is invalid.
 *
 * #### Notes
 * TODO - conversion rules
 */
export
function normalizeKeystroke(keystroke: string): string {
  var key = '';
  var alt = false;
  var cmd = false;
  var ctrl = false;
  var shift = false;
  var tokens = keystroke.trim().split(/\s+/);
  for (var i = 0, n = tokens.length; i < n; ++i) {
    var token = tokens[i];
    if (token === 'Alt') {
      if (alt || key) {
        throwKeystrokeError(keystroke);
      }
      alt = true;
    } else if (token === 'Cmd' || (token === 'Accel' && IS_MAC)) {
      if (cmd || key) {
        throwKeystrokeError(keystroke);
      }
      cmd = true;
    } else if (token === 'Ctrl' || (token === 'Accel' && !IS_MAC)) {
      if (ctrl || key) {
        throwKeystrokeError(keystroke);
      }
      ctrl = true;
    } else if (token === 'Shift') {
      if (shift || key) {
        throwKeystrokeError(keystroke);
      }
      shift = true;
    } else if (token === 'Space') {
      if (key) {
        throwKeystrokeError(keystroke);
      }
      key = token;
    } else if (token.length === 1 || token in VALID_NAMED_KEYS) {
      if (key) {
        throwKeystrokeError(keystroke);
      }
      key = token;
    }
  }
  if (!key || (key.length === 1 && (alt || shift))) {
    throwKeystrokeError(keystroke);
  }
  var modifiers = '';
  if (cmd) {
    modifiers += 'Cmd ';
  }
  if (ctrl) {
    modifiers += 'Ctrl ';
  }
  if (alt) {
    modifiers += 'Alt ';
  }
  if (shift) {
    modifiers += 'Shift ';
  }
  return modifiers + key;
}


/**
 * Throw an error with the give invalid keystroke.
 */
function throwKeystrokeError(keystroke: string): void {
  throw new Error(`invalid keystroke: ${keystroke}`);
}


/**
 * Get the key character or named key for a keydown event.
 *
 * Returns an empty string if the key is not a valid shortcut key.
 */
function keyForKeydownEvent(event: KeyboardEvent): string {
  var key = event.key;
  if (key === void 0) {
    key = keyForKeyCode(event.keyCode, event.shiftKey);
  }
  var result: string;
  if (key.length === 1) {
    result = key === ' ' ? 'Space' : key;
  } else {
    result = (key in VALID_NAMED_KEYS) ? key : '';
  }
  return result;
}


/**
 * Get the key character or named key for a key code.
 *
 * Returns an empty string if the key is not a valid shortcut key.
 *
 * This assumes a US english keyboard layout.
 *
 * This is a fallback for browsers which don't implement `.key`.
 */
function keyForKeyCode(code: number, shifted: boolean): string {
  return (shifted ? SHIFTED_KEY_CODES[code] : KEY_CODES[code]) || '';
}


/**
 * A flag indicating whether the platform is Mac.
 */
var IS_MAC = !!navigator.platform.match(/Mac/i);


/**
 * A flag indicating whether the platform is Windows.
 */
var IS_WIN = !!navigator.platform.match(/Win/i);


/**
 * DOM 3 key names which are treated as valid shortcut keys.
 */
var VALID_NAMED_KEYS: { [key: string]: boolean } = {
  ArrowDown: true,
  ArrowLeft: true,
  ArrowRight: true,
  ArrowUp: true,
  Backspace: true,
  ContextMenu: true,
  Delete: true,
  End: true,
  Enter: true,
  Escape: true,
  F1: true,
  F2: true,
  F3: true,
  F4: true,
  F5: true,
  F6: true,
  F7: true,
  F8: true,
  F9: true,
  F10: true,
  F11: true,
  F12: true,
  Home: true,
  Insert: true,
  PageDown: true,
  PageUp: true,
  Tab: true,
}


/**
 * A mapping of key code to key character or named key.
 *
 * This mapping represents a US english keyboard layout.
 *
 * This is a fallback for browsers which don't implement `.key`.
 */
var KEY_CODES: { [key: number]: string } = {
  8: 'Backspace',
  9: 'Tab',
  13: 'Enter',
  27: 'Escape',
  32: ' ',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  45: 'Insert',
  46: 'Delete',
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
  93: 'ContextMenu',
  96: '0',  // numpad
  97: '1',  // numpad
  98: '2',  // numpad
  99: '3',  // numpad
  100: '4',  // numpad
  101: '5',  // numpad
  102: '6',  // numpad
  103: '7',  // numpad
  104: '8',  // numpad
  105: '9',  // numpad
  106: '*',  // numpad
  107: '+',  // numpad
  109: '-',  // numpad
  110: '.',  // numpad
  111: '/',  // numpad
  112: 'F1',
  113: 'F2',
  114: 'F3',
  115: 'F4',
  116: 'F5',
  117: 'F6',
  118: 'F7',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  122: 'F11',
  123: 'F12',
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
};


/**
 * A mapping of key code to shifted key character or named key.
 *
 * This mapping represents a US english keyboard layout.
 *
 * This is a fallback for browsers which don't implement `.key`.
 */
var SHIFTED_KEY_CODES: { [key: number]: string } = {
  8: 'Backspace',
  9: 'Tab',
  13: 'Enter',
  27: 'Escape',
  32: ' ',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  45: 'Insert',
  46: 'Delete',
  48: ')',
  49: '!',
  50: '@',
  51: '#',
  52: '$',
  53: '%',
  54: '^',
  55: '&',
  56: '*',
  57: '(',
  65: 'A',
  66: 'B',
  67: 'C',
  68: 'D',
  69: 'E',
  70: 'F',
  71: 'G',
  72: 'H',
  73: 'I',
  74: 'J',
  75: 'K',
  76: 'L',
  77: 'M',
  78: 'N',
  79: 'O',
  80: 'P',
  81: 'Q',
  82: 'R',
  83: 'S',
  84: 'T',
  85: 'U',
  86: 'V',
  87: 'W',
  88: 'X',
  89: 'Y',
  90: 'Z',
  93: 'ContextMenu',
  96: '0',  // numpad
  97: '1',  // numpad
  98: '2',  // numpad
  99: '3',  // numpad
  100: '4',  // numpad
  101: '5',  // numpad
  102: '6',  // numpad
  103: '7',  // numpad
  104: '8',  // numpad
  105: '9',  // numpad
  106: '*',  // numpad
  107: '+',  // numpad
  109: '-',  // numpad
  110: '.',  // numpad
  111: '/',  // numpad
  112: 'F1',
  113: 'F2',
  114: 'F3',
  115: 'F4',
  116: 'F5',
  117: 'F6',
  118: 'F7',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  122: 'F11',
  123: 'F12',
  186: ':',
  187: '+',
  188: '<',
  189: '_',
  190: '>',
  191: '?',
  192: '~',
  219: '{',
  220: '|',
  221: '}',
  222: '"',
};

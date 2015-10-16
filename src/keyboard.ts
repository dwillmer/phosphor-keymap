/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';


/**
 * An object which represents an abstract keyboard layout.
 */
export
interface IKeyboardLayout {
  /**
   * The human-readable read-only name of the layout.
   *
   * This value is used primarily for display and debugging purposes.
   */
  name: string;

  /**
   * Get an array of all keycap values supported by the layout.
   *
   * @returns A new array of the supported keycap values.
   *
   * #### Notes
   * This can be useful for authoring tools and debugging, when it's
   * necessary to know which keys are available for shortcut use.
   */
  keycaps(): string[];

  /**
   * Test whether the given keycap is a valid value for the layout.
   *
   * @param keycap - The user-provided keycap to test for validity.
   *
   * @returns `true` if the keycap is supported by the layout, `false`
   *   otherwise.
   */
  isValidKeycap(keycap: string): boolean;

  /**
   * Get the keycap for a `'keydown'` event.
   *
   * @param event - The event object for a `'keydown'` event.
   *
   * @returns The associated keycap value, or an empty string if
   *   the event does not represent a valid primary shortcut key.
   */
  keycapForKeydownEvent(event: KeyboardEvent): string;
}


/**
 * Create a normalized keystroke for a `'keydown'` event.
 *
 * @param event - The event object for a `'keydown'` event.
 *
 * @param layout - The keyboard layout for computing the keycap.
 *
 * @returns A normalized keystroke, or an empty string if the
 *   event does not represent a valid shortcut keystroke.
 */
export
function keystrokeForKeydownEvent(event: KeyboardEvent, layout: IKeyboardLayout): string {
  var keycap = layout.keycapForKeydownEvent(event);
  if (!keycap) {
    return '';
  }
  var mods = '';
  if (event.metaKey && IS_MAC) {
    mods += 'Cmd ';
  }
  if (event.ctrlKey) {
    mods += 'Ctrl ';
  }
  if (event.altKey) {
    mods += 'Alt ';
  }
  if (event.shiftKey) {
    mods += 'Shift ';
  }
  return mods + keycap;
}


/**
 * Normalize and validate a keystroke.
 *
 * @param keystroke - The keystroke to normalize.
 *
 * @param layout - The keyboard layout for validating the keycap.
 *
 * @returns The normalized keystroke.
 *
 * @throws An error if the keystroke is invalid.
 *
 * #### Notes
 * The keystroke must adhere to the format:
 *
 *   `[<modifier 1> [<modifier 2> [<modifier N]]] <primary key>`
 *
 * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
 * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
 * `Ctrl` on all other platforms.
 *
 * The keystroke must conform to the following:
 *   - Modifiers and the primary key are case senstive.
 *   - The primary key must be a valid key for the layout.
 *   - Whitespace is used to separate modifiers and primary key.
 *   - Modifiers may appear in any order before the primary key.
 *   - Modifiers cannot appear in duplicate.
 *
 * If a keystroke is nonconforming, an error will be thrown.
 */
export
function normalizeKeystroke(keystroke: string, layout: IKeyboardLayout): string {
  var keycap = '';
  var alt = false;
  var cmd = false;
  var ctrl = false;
  var shift = false;
  var tokens = keystroke.trim().split(/\s+/);
  for (var i = 0, n = tokens.length; i < n; ++i) {
    var token = tokens[i];
    if (token === 'Accel') {
      token = IS_MAC ? 'Cmd' : 'Ctrl';
    }
    if (token === 'Alt') {
      if (alt) {
        throwKeystrokeError(keystroke, '`Alt` specified in duplicate');
      }
      if (keycap) {
        throwKeystrokeError(keystroke, '`Alt` follows primary key');
      }
      alt = true;
    } else if (token === 'Cmd') {
      if (cmd) {
        throwKeystrokeError(keystroke, '`Cmd` specified in duplicate');
      }
      if (keycap) {
        throwKeystrokeError(keystroke, '`Cmd` follows primary key');
      }
      if (!IS_MAC) {
        throwKeystrokeError(keystroke, '`Cmd` used on non-Mac platform');
      }
      cmd = true;
    } else if (token === 'Ctrl') {
      if (ctrl) {
        throwKeystrokeError(keystroke, '`Ctrl` specified in duplicate');
      }
      if (keycap) {
        throwKeystrokeError(keystroke, '`Ctrl` follows primary key');
      }
      ctrl = true;
    } else if (token === 'Shift') {
      if (shift) {
        throwKeystrokeError(keystroke, '`Shift` specified in duplicate');
      }
      if (keycap) {
        throwKeystrokeError(keystroke, '`Shift` follows primary key');
      }
      shift = true;
    } else {
      if (keycap) {
        throwKeystrokeError(keystroke, 'primary key specified in duplicate');
      }
      if (!layout.isValidKeycap(token)) {
        throwKeystrokeError(keystroke, 'invalid primary key');
      }
      keycap = token;
    }
  }
  if (keycap) {
    throwKeystrokeError(keystroke, 'primary key not specified');
  }
  var mods = '';
  if (cmd) {
    mods += 'Cmd ';
  }
  if (ctrl) {
    mods += 'Ctrl ';
  }
  if (alt) {
    mods += 'Alt ';
  }
  if (shift) {
    mods += 'Shift ';
  }
  return mods + keycap;
}


/**
 * Throw an error with the give invalid keystroke.
 */
function throwKeystrokeError(keystroke: string, message: string): void {
  throw new Error(`invalid keystroke: ${keystroke} (${message})`);
}


/**
 * A flag indicating whether the platform is Mac.
 */
var IS_MAC = !!navigator.platform.match(/Mac/i);


// temp
export var US_EN: any;


/**
 * A mapping of key code to shifted key character or named key.
 *
 * This mapping represents a US english keyboard layout.
 *
 * This is a fallback for browsers which don't implement `.key`.
 */
// var SHIFTED_KEY_CODES: { [key: number]: string } = {
//   8: 'Backspace',
//   9: 'Tab',
//   13: 'Enter',
//   27: 'Escape',
//   32: ' ',
//   33: 'PageUp',
//   34: 'PageDown',
//   35: 'End',
//   36: 'Home',
//   37: 'ArrowLeft',
//   38: 'ArrowUp',
//   39: 'ArrowRight',
//   40: 'ArrowDown',
//   45: 'Insert',
//   46: 'Delete',
//   48: ')',
//   49: '!',
//   50: '@',
//   51: '#',
//   52: '$',
//   53: '%',
//   54: '^',
//   55: '&',
//   56: '*',
//   57: '(',
//   65: 'A',
//   66: 'B',
//   67: 'C',
//   68: 'D',
//   69: 'E',
//   70: 'F',
//   71: 'G',
//   72: 'H',
//   73: 'I',
//   74: 'J',
//   75: 'K',
//   76: 'L',
//   77: 'M',
//   78: 'N',
//   79: 'O',
//   80: 'P',
//   81: 'Q',
//   82: 'R',
//   83: 'S',
//   84: 'T',
//   85: 'U',
//   86: 'V',
//   87: 'W',
//   88: 'X',
//   89: 'Y',
//   90: 'Z',
//   93: 'ContextMenu',
//   96: '0',  // numpad
//   97: '1',  // numpad
//   98: '2',  // numpad
//   99: '3',  // numpad
//   100: '4',  // numpad
//   101: '5',  // numpad
//   102: '6',  // numpad
//   103: '7',  // numpad
//   104: '8',  // numpad
//   105: '9',  // numpad
//   106: '*',  // numpad
//   107: '+',  // numpad
//   109: '-',  // numpad
//   110: '.',  // numpad
//   111: '/',  // numpad
//   112: 'F1',
//   113: 'F2',
//   114: 'F3',
//   115: 'F4',
//   116: 'F5',
//   117: 'F6',
//   118: 'F7',
//   119: 'F8',
//   120: 'F9',
//   121: 'F10',
//   122: 'F11',
//   123: 'F12',
//   186: ':',
//   187: '+',
//   188: '<',
//   189: '_',
//   190: '>',
//   191: '?',
//   192: '~',
//   219: '{',
//   220: '|',
//   221: '}',
//   222: '"',
// };

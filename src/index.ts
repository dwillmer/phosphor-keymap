/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

/**
 * Maps a given key sequence to an identifier.
 * The identifier could be the id of a command, or any
 * other 
 */
export IKeySequenceMap {

    input: string;

    id: string;

}


export
interface IKeymapManager {
  /**
   * Registers a key sequence with the manager
   */
  registerSequence(key: IKeySequence): boolean;

  /**
   * 
   */

}





/**
 * A convenience implementation of IKeymapManager
 *
 */
export KeymapManager implements IKeymapManager {
  /**
   * Map of keycode to key character.
   *
   * **See also**
   * https://github.com/jupyter/notebook/blob/master/notebook/static/base/js/keyboard.js#L30
   *
   * We potentially have more than one Keyboard Manager in the app, so we 
   * don't want to store a copy of the keycodes list for each instance.
   */
  static keycodes = {
      65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e', 70: 'f', 71: 'g', 72: 'h', 73: 'i',
      74: 'j', 75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o', 80: 'p', 81: 'q', 82: 'r',
      83: 's', 84: 't', 85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y', 90: 'z',
      49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
      48: '0',
      219: '[', 221: ']', 192: '`', 188: ',', 190: '.', 191: '/', 220: '\\', 222: '\'',
      220: '\\', 222: '\'',
      96: 'numpad0', 97: 'numpad1', 98: 'numpad2', 99: 'numpad3', 100: 'numpad4',
      101: 'numpad5', 102: 'numpad6', 103: 'numpad7', 104: 'numpad8', 105: 'numpad9',
      106: 'multiply', 107: 'add', 109: 'subtract', 110: 'decimal', 111: 'divide', 
      112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 116: 'f5', 117: 'f6', 118: 'f7',
      119: 'f8', 120: 'f9', 121: 'f10', 122: 'f11', 123: 'f12', 124: 'f13', 125: 'f14',
      
  }
}

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  ISignal, Signal
} from 'phosphor-signaling';


/**
 * Groups a given key sequence with a command identifier.
 */
export 
interface IKeySequence {
  /** 
   * A string representing the key sequence, eg 'Ctrl-Shift-X'
   */
  input: string;
  /**
   * A string representing the id for an external component to use
   * in processing the keyboard shortcut when activated.
   */
  id: string;
}


/**
 * Defines the behaviour of a keymap manager.
 */
export
interface IKeymapManager {
  /**
   * Registers a key sequence with the manager.
   */
  registerSequence(key: IKeySequence): boolean;

  /**
   * A signal which fires when the keymap manager receives a 
   * key sequence which corresponds to a registered command id.
   */
  commandRequested: ISignal<IKeymapManager, string>;

  /**
   * Returns a boolean to show whether a given keyboard shortcut
   * is already in use.
   */
  hasShortcut(value: string): boolean;

  /**
   * Returns the keyboard shortcut for a given command id.
   */
  shortcutForCommand(id: string): string;
}


/**
 * The options object for instantiating a keymap manager.
 */
export interface IKeymapManagerOptions {
  /**
   * The keyboard setting for this machine/user, 'mozilla' or 'ie'
   */
  keycodeSetting: string;
  /**
   * The external manager which will execute some code when a correct
   * key sequence is pressed.
   */
  manager: any;
}


var MOZILLA_MODIFIERS: StringMap = { '59': ';', '61': '=', '224': 'meta', '173': 'minus' };
var IE_MODIFIERS: StringMap = { '186': ';', '187': '=', '189': 'minus' };

/**
 * Convenience interface for string:string mappings
 */ 
export
interface StringMap {
  [s: string]: string;
}

/**
 * A convenience implementation of IKeymapManager
 *
 */
export 
class KeymapManager implements IKeymapManager {
  /**
   * A signal emitted when the [[commandRequested]]
   */
  static commandRequestedSignal = new Signal<KeymapManager, string>();

  /**
   * Map of keycode to key character.
   *
   * **See also**
   * https://github.com/jupyter/notebook/blob/master/notebook/static/base/js/keyboard.js#L30
   *
   * We potentially have more than one Keyboard Manager in the app, so we 
   * don't want to store a copy of the keycodes list for each instance.
   */
  static keycodes: StringMap = {
    '65': 'a', '66': 'b', '67': 'c', '68': 'd', '69': 'e', '70': 'f', '71': 'g', 
    '72': 'h', '73': 'i',
    '74': 'j', '75': 'k', '76': 'l', '77': 'm', '78': 'n', '79': 'o', '80': 'p', 
    '81': 'q', '82': 'r',
    '83': 's', '84': 't', '85': 'u', '86': 'v', '87': 'w', '88': 'x', '89': 'y', 
    '90': 'z',
    '49': '1', '50': '2', '51': '3', '52': '4', '53': '5', '54': '6', '55': '7', 
    '56': '8', '57': '9',
    '48': '0',
    '219': '[', '221': ']', '192': '`', '188': ',', '190': '.', '191': '/', '220': '\\', 
    '222': '\'',
    '96': 'numpad0', '97': 'numpad1', '98': 'numpad2', '99': 'numpad3', '100': 'numpad4',
    '101': 'numpad5', '102': 'numpad6', '103': 'numpad7', '104': 'numpad8', '105': 'numpad9',
    '106': 'multiply', '107': 'add', '109': 'subtract', '110': 'decimal', '111': 'divide',
    '112': 'f1', '113': 'f2', '114': 'f3', '115': 'f4', '116': 'f5', '117': 'f6', '118': 'f7',
    '119': 'f8', '120': 'f9', '121': 'f10', '122': 'f11', '123': 'f12', '124': 'f13', '125': 'f14',
    '126': 'f15',
    '8': 'backspace', '9': 'tab', '13': 'enter', '16': 'shift', '17': 'ctrl', '18': 'alt',
    '91': 'meta', '20': 'capslock', '27': 'esc', '32': 'space', '33': 'pageup', '34': 'pagedown',
    '35': 'end', '36': 'home', '37': 'left', '38': 'up', '39': 'right', '40': 'down', '45': 'insert',
    '46': 'delete', '144': 'numlock'
  };

  /**
   * Modifier keys for sequences
   */
  static modifierKeys: string[] = ['ctrl', 'alt', 'shift'];

  /**
   * Construct a new Keymap Manager.
   */
  constructor(options: IKeymapManagerOptions) {

    if(options.keycodeSetting === 'mozilla') {
      this._keycodeModifications = MOZILLA_MODIFIERS;
    } else if(options.keycodeSetting === 'ie') {
      this._keycodeModifications === IE_MODIFIERS;
    }

    this._commandManager = options.manager;
    this._bindEvents();
  }

  get commandRequested(): ISignal<KeymapManager, string> {
    return KeymapManager.commandRequestedSignal.bind(this);
  }

  registerSequence(sequence: IKeySequence): boolean {
    var input = this._mapKeyFromUserString(sequence.input);

    if (this._keySequenceMap[input] !== undefined) {
      console.warn("Keyboard shortcut already set: " + sequence.input);
      return false;
    }

    this._commandToKeySequenceMap[sequence.id] = sequence.input;
    this._keySequenceMap[input] = sequence.id;
    return true;
  }

  hasShortcut(value: string): boolean {
    var input = this._mapKeyFromUserString(value);
    return input in this._keySequenceMap;
  }

  shortcutForCommand(id: string): string {
    return this._commandToKeySequenceMap[id];
  }

  private _mapKeyFromUserString(input: string): string {
    var lowerInput = input.toLowerCase();
    var seqItems = lowerInput.split('-');
    var keyString = seqItems[seqItems.length - 1];
    var modString = this._getModifierStringForSequence(lowerInput);
    return modString + keyString;
  }

  private _getKeyChars(code: number): string {
    var strCode = code.toString();
    if(strCode in this._keycodeModifications) {
      return this._keycodeModifications[strCode];
    } else if(strCode in KeymapManager.keycodes) { 
      return KeymapManager.keycodes[strCode];
    }
    console.error('Unrecognised keycode: ' + code.toString());
  }

  private _getModifierStringForSequence(value: string): string {
    var lowerValue = value.toLowerCase();
    var result = '';
    for (var i = 0; i < KeymapManager.modifierKeys.length; i++) {
      result += lowerValue.indexOf(KeymapManager.modifierKeys[i]) > -1 ? '1' : '0';
    }
    return result; 
  }

  private _getModifierStringForEvent(event: KeyboardEvent): string {
    var isCtrl = <boolean>(event.ctrlKey);
    var isAlt = <boolean>(event.altKey);
    var isShift = <boolean>(event.shiftKey);

    var result = '';
    result += isCtrl ? '1' : '0';
    result += isAlt ? '1' : '0';
    result += isShift ? '1' : '0';
    return result;
  }

  private _bindEvents(): void {
    var that = this;
    document.addEventListener("keydown", function(event: KeyboardEvent) {
      
      var key = <number>(event.keyCode);
      var mods = that._getModifierStringForEvent(event);
      var keyStr = that._getKeyChars(key);
      if(keyStr === undefined) { 
        console.error('Keycode not found: ' + key.toString());
        return;
      }
      var joinedKey = mods + keyStr;

      if(joinedKey in that._keySequenceMap) {
        var command = that._keySequenceMap[joinedKey];
        console.log('ID found: ' + command);
        that.commandRequested.emit(command);
      }
    });
  }

  private _keycodeModifications: StringMap = {};
  private _keySequenceMap: StringMap = {};
  private _commandToKeySequenceMap: StringMap = {};
  private _commandManager: any;
}

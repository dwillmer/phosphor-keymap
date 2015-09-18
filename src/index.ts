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

import {
  IDisposable
} from 'phosphor-disposable';


/**
 * Groups a given key sequence with a command identifier.
 */
export 
interface IKeyBinding {
  /** 
   * A string representing the key sequence, eg 'Ctrl-C Ctrl-X'
   */
  keys: string;
  /**
   * A string representing the id for an external command to use
   * in processing the keyboard shortcut when activated.
   */
  command: string;
  /**
   * An optional string of CSS selectors which determine whether the
   * key sequence should be actioned based on the currently focused
   * element.
   * 
   * Eg., cssScope: '.myStyle .otherStyle'
   * will cause the shortcut defined here to only be active when 
   * the active element matches .myStyle OR .otherStyle.
   */
  selector?: string;
}


/**
 * Defines the behaviour of a keymap manager. 
 *
 * A keymap manager takes an arbitrary set of keyboard bindings and 
 * will emit the commandRequested signal when a series of user inputs 
 * matches one of the registered bindings.
 * The signal will contain the command id registered for that key
 * sequence.
 */
export
interface IKeymapManager {
  /**
   * A signal which fires when the keymap manager receives a 
   * key sequence which corresponds to a registered command id.
   */
  commandRequested: ISignal<IKeymapManager, string>;

  /**
   * Registers a key sequence with the manager.
   */
  registerBindings(key: IKeyBinding[]): IDisposable;

  /**
   * Removes previously registered bindings.
   */
  removeBindings(bindings: IKeyBinding[]): void;

  /**
   * Returns a boolean to show whether a given keyboard shortcut
   * is already in use.
   */
  hasShortcut(value: string, scope: string): boolean;

  /**
   * Returns the keyboard shortcut for a given command id.
   */
  shortcutForCommand(id: string, scope: string): string;
}

/**
 * Disposes of keyboard shortcut bindings.
 */
export
class BindingDisposable implements IDisposable {
  constructor(manager: IKeymapManager) {
    this._bindings = [];
    this._manager = manager;
  }

  /**
   * Adds an individual binding to this disposable.
   */
  addBinding(binding: IKeyBinding): void {
    this._bindings.push(binding);
  }

  /**
   * The number of items currently stored in this disposable.
   */
  get count(): number {
    return this._bindings.length;
  }

  /**
   * Boolean to determine whether this item has already been disposed.
   */
  get isDisposed(): boolean {
    return this._bindings === null;
  }

  /**
   * Dispose of the items.
   */
  dispose(): void {
    if (this._bindings !== null) {
      console.log('Disposing of : ' + this._bindings);
      this._manager.removeBindings(this._bindings);
      this._bindings = null;
    }

    this._manager = null;
  }

  private _bindings: IKeyBinding[];
  private _manager: IKeymapManager;
}


var MOZILLA_MODIFIERS: StringMap = { '59': ';', '61': '=', '224': 'meta', '173': 'minus' };
var IE_MODIFIERS: StringMap = { '186': ';', '187': '=', '189': 'minus' };

/**
 * Map of keycode to key character.
 *
 * **See also**
 * https://github.com/jupyter/notebook/blob/master/notebook/static/base/js/keyboard.js#L30
 *
 * We potentially have more than one Keyboard Manager in the app, so we 
 * don't want to store a copy of the keycodes list for each instance.
 */
var KEYCODES: StringMap = {
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
 * Modifier keys for sequences.
 */
var MODIFIER_KEYS: string[] = ['ctrl', 'alt', 'shift'];

/**
 * A convenience implementation of IKeymapManager
 */
export 
class KeymapManager implements IKeymapManager, IDisposable {
  /**
   * A signal emitted when the [[commandRequested]]
   */
  static commandRequestedSignal = new Signal<KeymapManager, string>();

  /**
   * Construct a new Keymap Manager.
   */
  constructor() {
    var br: string = browser[0];
    if (br === 'Firefox' || br === 'Opera' || br === 'Netscape') {
      this._keycodeModifications = MOZILLA_MODIFIERS;
    } else if (br === 'Safari' || br === 'Chrome' || br === "MSIE") {
      this._keycodeModifications = IE_MODIFIERS;
    }

    this._bindEvents();
  }

  /** 
   * A signal emitted when a command is requested.
   *
   * #### Notes
   * This is a pure delegate to the [[commandRequestedSignal]].
   */
  get commandRequested(): ISignal<KeymapManager, string> {
    return KeymapManager.commandRequestedSignal.bind(this);
  }

  /**
   * Returns whether this manager has already been disposed.
   */
  get isDisposed(): boolean {
    return this._scopeSequenceMap === undefined;
  }

  /**
   * Unbind the event handler and clean out the state.
   */
  dispose(): void {
    this._unbindEvents();
    this._scopeSequenceMap === undefined;
    this._scopeCommandMap === undefined;
  }

  /**
   * Registers the key sequence with the keymap manager.
   *
   * @param bindings - An array of objects conforming to IKeyBinding.
   *
   * @return - An IDisposable containing the bindings which were set.
   *
   * #### Notes
   * If there was an error setting one of the bindings, then it will
   * *not* be included in the disposable. An example of this could be
   * if it tries to set a keybinding that is already set. In that case
   * the existing binding remains, and will not be affected by the
   * disposable.
   */
  registerBindings(bindings: IKeyBinding[]): BindingDisposable {
    var disposable = new BindingDisposable(this);

    for (var i = 0; i < bindings.length; i++) {
      var bin = bindings[i];
      var scope = bin.selector || '*';
      var input = this._mapKeyFromUserString(bin.keys);

      if (scope in this._scopeSequenceMap) {
        if (this._scopeSequenceMap[scope][input] !== undefined) {
          console.warn("Sequence already set for scope: " + scope + " " + input);
          continue;
        }
      } else {
        this._scopeSequenceMap[scope] = {};
        this._scopeCommandMap[scope] = {};
      }
      this._scopeSequenceMap[scope][input] = bin.command;
      this._scopeCommandMap[scope][bin.command] = bin.keys;
      disposable.addBinding(bindings[i]);
    }

    return disposable;
  }

  /**
   * Removes previously set bindings, preferably through a disposable
   * returned from registerBindings.
   */
  removeBindings(bindings: IKeyBinding[]): void {
    for (var i = 0; i < bindings.length; i++) {
      var bin = bindings[i];
      var scope = bin.selector || '*';
      var input = this._mapKeyFromUserString(bin.keys);
      delete this._scopeSequenceMap[scope][input];
      delete this._scopeCommandMap[scope][bin.command];
    }
  }

  /**
   * Checks whether a given shortcut has been registered in a given scope.
   */
  hasShortcut(value: string, scope: string): boolean {
    var input = this._mapKeyFromUserString(value);
    return scope in this._scopeSequenceMap && input in this._scopeSequenceMap[scope];
  }

  /**
   * Given a command id and a scope, returns the registered key sequence
   * to trigger the command.
   */
  shortcutForCommand(id: string, scope:string): string {
    var map = this._scopeCommandMap[scope];
    if (map) {
      if (map.hasOwnProperty(id)) {
        return map[id];
      }
    }
  }

  /**
   * Handle the DOM events for the Keymap Manager
   *
   * @param event - The DOM event sent to the keymap manager.
   *
   * #### Notes
   * This method implements the DOM 'EventListener' interface and
   * is called in response to keydown events on document. It 
   * should not be called directly by user code.
   */
  handleEvent(event: Event) {
    switch (event.type) {
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
    }
  }

  private _evtKeyDown(event: KeyboardEvent): void {
    var stop = false;
    var key = <number>(event.keyCode);
    var mods = this._getModifierStringForEvent(event);
    var keyStr = this._getKeyChars(key);
    if (keyStr === undefined) {
      console.error('Keycode not found: ' + key.toString());
      return;
    }
    var joinedKey = mods + keyStr;
    var reduced = this._matchingSelectorMap(joinedKey);

    for (var prop in reduced) {
      var currElem = event.target as Element;
      while (currElem !== null && !matchesSelector(currElem, prop)) {
        currElem = currElem.parentElement; // TODO
      }
      if (currElem) {
        this.commandRequested.emit(reduced[prop][joinedKey]);
        stop = true;
      }
    }
    if (stop) {
      event.stopPropagation();
    }
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
    if (strCode in this._keycodeModifications) {
      return this._keycodeModifications[strCode];
    } else if (strCode in KEYCODES) { 
      return KEYCODES[strCode];
    }
    console.error('Unrecognised keycode: ' + code.toString());
  }

  private _getModifierStringForSequence(value: string): string {
    var lowerValue = value.toLowerCase();
    var result = '';
    for (var i = 0; i < MODIFIER_KEYS.length; i++) {
      result += lowerValue.indexOf(MODIFIER_KEYS[i]) > -1 ? '1' : '0';
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

  private _matchingSelectorMap(value: string): SelectorMap {
    var result: SelectorMap = {};

    for (var prop in this._scopeSequenceMap) {
      if (this._scopeSequenceMap.hasOwnProperty(prop)) {
        if (value in this._scopeSequenceMap[prop]) {
          if (!(prop in result)) {
            result[prop] = {};
          }
          result[prop][value] = this._scopeSequenceMap[prop][value];
        }
      }
    }
    return result;
  }

  private _bindEvents(): void {
    document.addEventListener("keydown", this);
  }

  private _unbindEvents(): void {
    document.removeEventListener("keydown", this);
  }

  private _keycodeModifications: StringMap = {};
  private _scopeSequenceMap: SelectorMap = {};
  private _scopeCommandMap: SelectorMap = {};
}

/**
 * Convenience type definition for string:string mappings
 */
type StringMap = { [s: string]: string; };
type SelectorMap = { [s: string]: StringMap };

/**
 * Cross-browser implementation of matches / matchesSelector.
 */
var protoMatchFunc: Function = (() => {
  var proto = Element.prototype as any;
  return (
    proto.matches ||
    proto.matchesSelector ||
    proto.mozMatchesSelector ||
    proto.msMatchesSelector ||
    proto.oMatchesSelector ||
    proto.webkitMatchesSelector ||
    (function(selector: string) {
      var elem = this as Element;
      var matches = elem.ownerDocument.querySelectorAll(selector);
      return Array.prototype.indexOf.call(matches, elem) !== -1;
    })
    );
})();

/**
 * Determines whether the element matches the css selector string.
 */
function matchesSelector(elem: Element, selector: string): boolean {
  return protoMatchFunc.call(elem, selector);
}


// http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
var browser: any = (function(): any {
  if (typeof navigator === 'undefined') {
    // navigator undefined in node
    return 'None';
  }
  var N = navigator.appName, ua = navigator.userAgent, tem: any;
  var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if (M && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) M[2] = tem[1];
  M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
  return M;
})();

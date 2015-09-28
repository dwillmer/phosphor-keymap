/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  calculateSpecificity, isSelectorValid
} from 'clear-cut';

import {
  DisposableDelegate, IDisposable
} from 'phosphor-disposable';

import {
  isModifierKeyCode, keystrokeForKeydownEvent, normalizeKeystroke
} from './keycodes';


/**
 * An object which represents a key binding.
 */
export
interface IKeyBinding {
  /**
   * The key sequence for the key binding.
   *
   * Each keystroke must adhere to the following format:
   *
   *   `[<modifier-1>+[<modifier-2>+[<modifier-n>+]]]<key>`
   *
   *   - Supported modifiers are `'ctrl'`, `'alt'`, `'shift'`, `'cmd'`.
   *   - The `'cmd'` modifier only works on OSX (browser limitation).
   *   - The modifiers may appear in any order.
   *   - The modifiers cannot appear in duplicate.
   *   - The primary key must be a valid key character.
   *   - The keystroke is case insensitive.
   *   - Mutliple keystrokes are separated by whitespace.
   *
   * #### Example
   * **Valid Key Sequences**
   * ``` typescript
   * 'a'
   * 'b'
   * 'd d'
   * 'ctrl+-'
   * 'ctrl+='
   * 'ctrl+alt+5'
   * 'shift+f11'
   * 'ctrl+k ctrl+t'
   * 'alt+cmd+y ctrl+4 alt+]'
   * ```
   *
   * **Invalid Key Sequences**
   * ```typescript
   * '%'
   * '$'
   * 'ctrl-a'
   * '+ctrl+a'
   * 'shift++o'
   * 'ctrl+a shift'
   * ```
   */
  sequence: string;

  /**
   * The handler function to invoke when the key sequence is matched.
   *
   * The handler should return `true` to prevent the default and stop
   * propagation of the key event. It should return `false` to allow
   * the continued processing of the event.
   */
  handler: () => boolean;
}


/**
 * A class which manages a collection of key bindings.
 */
export
class KeymapManager {
  /**
   * Construct a new key map.
   */
  contstructor() { }

  /**
   * Add key bindings to the key map.
   *
   * @param selector - The CSS selector for the key bindings.
   *
   * @param bindings - The key bindings to add to the key map.
   *
   * @returns A disposable which will remove the key bindings.
   *
   * #### Notes
   * If the selector is an invalid CSS selector, a warning will
   * be logged to the console and `undefined` will be returned.
   *
   * If the key sequence for a binding is invalid, or if a binding
   * has a null handler, a warning will be logged to the console
   * and that binding will be ignored.
   */
  add(selector: string, bindings: IKeyBinding[]): IDisposable {
    // Log a warning and bail if the selector is invalid.
    if (!isSelectorValid(selector)) {
      console.warn(`Invalid key binding selector: ${selector}`);
      return void 0;
    }

    // The newly created ex bindings for the valid key bindings.
    var newBindings: ExBinding[] = [];

    // Iterate over the bindings and covert them into ex bindings.
    for (var i = 0, n = bindings.length; i < n; ++i) {
      var binding = bindings[i];

      // If the binding does not have a handler, warn and continue.
      if (!binding.handler) {
        console.warn(`null handler for key binding: ${binding.sequence}`);
        continue;
      }

      // Trim the key sequence and split into individual keystrokes.
      var keystrokes = binding.sequence.trim().split(/\s+/);

      // Normalize each keystroke and re-join into a canoncial form.
      // If any of the keystrokes are invalid, warn and continue.
      try {
        var sequence = keystrokes.map(normalizeKeystroke).join(' ');
      } catch (e) {
        console.warn(`invalid key binding sequence: ${binding.sequence}`);
        continue;
      }

      // Create a new extended binding and add it to the arrays.
      var exb = new ExBinding(selector, sequence, binding.handler);
      this._bindings.push(exb);
      newBindings.push(exb);
    }

    // Return a disposable which will remove the new bindings.
    return new DisposableDelegate(() => this._removeBindings(newBindings));
  }

  /**
   * Process a `'keydown'` event and invoke the matching key bindings.
   *
   * @param event - The event object for a `'keydown'` event.
   *
   * #### Notes
   * This should be called by user code in response to a `'keydown'`
   * event. The keymap **does not** install its own event listeners,
   * which allows user code full control over the nodes for which
   * the keymap processes events.
   */
  processKeydownEvent(event: KeyboardEvent): void {
    // If the actual pressed key is a modifier key, prevent the default
    // and return. No bindings can be matched for *just* modifier keys.
    if (isModifierKeyCode(event.keyCode)) {
      event.preventDefault();
      return;
    }

    // Get the normalized keystroke and store it as a pending.
    this._keystrokes.push(keystrokeForKeydownEvent(event));

    // Convert the pending keystrokes to a sequence.
    var sequence = this._keystrokes.join(' ');

    // Find the exact and partial matches for the key sequence.
    var matches = findSequenceMatches(this._bindings, sequence);

    // If there are no exact match and not partial matches, clear
    // all pending state so the next key press starts from default.
    if (matches.exact.length === 0 && matches.partial.length === 0) {
      this._clearPendingState();
      return;
    }

    // If there are exact matches but no partial matches, the exact
    // matches can be dispatched immediately. The pending state is
    // reset so the next key press starts from default.
    if (matches.partial.length === 0) {
      this._clearPendingState();
      dispatchBindings(matches.exact, event);
      return;
    }

    // At this point, there are partial matches.

    // If there are exact matches and partial matches, the exact
    // matches are stored so they can be dispatched if the timer
    // expires before a more specific match is found.
    if (matches.exact.length > 0) {
      this._setExactData(matches.exact, event);
    }

    // Restart the timer for equal intervals between keystrokes.
    //
    // TODO - we may want to replay prevented defaults if match fails.
    event.preventDefault();
    this._startTimer();
  }

  /**
   * Remove an array of ex key bindings from the key map.
   */
  private _removeBindings(arr: ExBinding[]): void {
    this._bindings = this._bindings.filter(b => arr.indexOf(b) === -1);
  }

  /**
   * Start or restart the pending timer for the key map.
   */
  private _startTimer(): void {
    this._clearTimer();
    this._timer = setTimeout(() => {
      this._onPendingTimeout();
    }, this._partialTimeout);
  }

  /**
   * Clear the pending timer for the key map.
   */
  private _clearTimer(): void {
    if (this._timer !== 0) {
      clearTimeout(this._timer);
      this._timer = 0;
    }
  }

  /**
   * Clear the pending state for the keymap.
   */
  private _clearPendingState(): void {
    this._clearTimer();
    this._exactData = null;
    this._keystrokes.length = 0;
  }

  /**
   * Set the pending exact match data.
   */
  private _setExactData(exact: ExBinding[], event: KeyboardEvent): void {
    if (!this._exactData) {
      this._exactData = { exact: exact, event: event };
    } else {
      this._exactData.exact = exact;
      this._exactData.event = event;
    }
  }

  /**
   * Handle the partial timer timeout.
   *
   * This will reset the pending state and dispatch the exact matches.
   */
  private _onPendingTimeout(): void {
    this._timer = 0;
    var d = this._exactData;
    this._clearPendingState();
    if (d) dispatchBindings(d.exact, d.event);
  }

  private _timer = 0;
  private _partialTimeout = 1000;
  private _keystrokes: string[] = [];
  private _bindings: ExBinding[] = [];
  private _exactData: IExactData = null;
}


/**
 * An extended key bind object used by a keymap manager.
 */
class ExBinding {
  /**
   * A monotonically increasing binding identifier.
   *
   * The binding id is used to break sorting ties.
   */
  static idTick = 0;

  /**
   * A comparison function for extended bindings.
   *
   * This can be used to sort an array of bindings according to
   * highest CSS specificity. Ties are broken according to the
   * binding id, with newer bindings appearing first.
   */
  static compare(exA: ExBinding, exB: ExBinding): number {
    if (exA._specificity === exB._specificity) {
      return exB._id - exA._id;
    }
    return exB._specificity - exA._specificity;
  }

  /**
   * Construct a new extended key binding.
   *
   * @param selector - The valid CSS selector for the binding.
   *
   * @param sequence - The normalized key binding sequence.
   *
   * @param handler - The handler function for the binding.
   */
  constructor(selector: string, sequence: string, handler: () => boolean) {
    this._selector = selector;
    this._sequence = sequence;
    this._handler = handler;
    this._specificity = calculateSpecificity(selector);
  }

  /**
   * Create a public key binding object for this extended binding.
   */
  toBinding(): IKeyBinding {
    return { sequence: this._sequence, handler: this._handler };
  }

  /**
   * Test whether the binding is an exact match for a key sequence.
   */
  isExactMatch(sequence: string): boolean {
    return this._sequence === sequence;
  }

  /**
   * Test whether the binding is a partial match for a key sequence.
   */
  isPartialMatch(sequence: string): boolean {
    return this._sequence.indexOf(sequence) === 0;
  }

  /**
   * Test whether the binding selector matches an element.
   */
  isSelectorMatch(target: Element): boolean {
    return matchesSelector(target, this._selector);
  }

  /**
   * Invoke the handler for the binding and return its result.
   */
  invoke(): boolean {
    return this._handler.call(void 0);
  }

  private _sequence: string;
  private _selector: string;
  private _specificity: number;
  private _handler: () => boolean;
  private _id = ExBinding.idTick++;
}


/**
 * An object which holds pending exact match data.
 */
interface IExactData {
  /**
   * The exact match bindings.
   */
  exact: ExBinding[];

  /**
   * The keyboard event which triggered the exact match.
   */
  event: KeyboardEvent;
}


/**
 * An object which holds the results of a sequence match.
 */
interface IMatchResult {
  /**
   * The bindings which exactly match the key sequence.
   */
  exact: ExBinding[];

  /**
   * The bindings which partially match the key sequence.
   */
  partial: ExBinding[];
}


/**
 * Filter the bindings for those which match the given sequence.
 *
 * The result contains both exact matches and partial matches.
 */
function findSequenceMatches(bindings: ExBinding[], sequence: string): IMatchResult {
  var exact: ExBinding[] = [];
  var partial: ExBinding[] = [];
  var partialSequence = sequence + ' ';
  for (var i = 0, n = bindings.length; i < n; ++i) {
    var exb = bindings[i];
    if (exb.isExactMatch(sequence)) {
      exact.push(exb);
    } else if (exb.isPartialMatch(partialSequence)) {
      partial.push(exb);
    }
  }
  return { exact: exact, partial: partial };
}


/**
 * Filter the bindings for those with a matching selector.
 */
function findSelectorMatches(bindings: ExBinding[], target: Element): ExBinding[] {
  var matches = bindings.filter(exb => exb.isSelectorMatch(target));
  return matches.sort(ExBinding.compare);
}


/**
 * Dispatch the key bindings for the given keyboard event.
 *
 * As the dispatcher walks up the DOM, the bindings will be filtered
 * for matching selectors, and invoked in specificity order. If the
 * handler for a binding returns `true`, dispatch will terminate and
 * the event propagation will be stopped.
 */
function dispatchBindings(bindings: ExBinding[], event: KeyboardEvent): void {
  var target = event.target as Element;
  var current = event.currentTarget as Element;
  while (target) {
    var matches = findSelectorMatches(bindings, target);
    for (var i = 0, n = matches.length; i < n; ++i) {
      if (matches[i].invoke()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (target === current) {
      return;
    }
    target = target.parentElement;
  }
}


/**
 * Test whether an element matches a CSS selector.
 */
export
function matchesSelector(elem: Element, selector: string): boolean {
  return protoMatchFunc.call(elem, selector);
}


/**
 * A cross-browser CSS selector matching prototype function.
 *
 * The function must be called with the element as `this`.
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

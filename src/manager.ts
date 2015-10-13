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
  keystrokeForKeydownEvent, normalizeKeystroke
} from './keycodes';


/**
 * An object which represents a key binding.
 */
export
interface IKeyBinding {
  /**
   * The CSS selector for the key binding.
   *
   * This selector must match a node on the propagation path of the
   * keyboard event in order for the binding handler to be invoked.
   */
  selector: string;

  /**
   * The key sequence for the key binding.
   *
   * Each keystroke in the sequence must adhere to the format:
   * - TODO
   */
  sequence: string[];

  /**
   * The handler function to invoke when the key binding is matched.
   */
  handler: () => void;
}


/**
 * A class which manages a collection of key bindings.
 */
export
class KeymapManager {
  /**
   * Construct a new key map manager.
   */
  contstructor() { }

  /**
   * Add key bindings to the key map manager.
   *
   * @param bindings - The key bindings to add to the manager.
   *
   * @returns A disposable which removes the added key bindings.
   *
   * #### Notes
   * If a key binding is invalid, a warning will be logged to the
   * console and the offending key binding will be ignored.
   *
   * If multiple key bindings are registered for the same sequence,
   * the binding with the highest CSS specificity is executed first.
   * Ties in specificity are broken based on the order in which the
   * key bindings are added to the manager.
   *
   * Ambiguous key bindings are resolved with a timeout.
   */
  add(bindings: IKeyBinding[]): IDisposable {
    // Iterate over the bindings and convert to extended bindings.
    var exbArray: IExBinding[] = [];
    for (var i = 0, n = bindings.length; i < n; ++i) {
      var exb = createExBinding(bindings[i]);
      if (exb) exbArray.push(exb);
    }

    // Register the bindings with the manager.
    Array.prototype.push.apply(this._bindings, exbArray);

    // Return a disposable which will remove the registered bindings.
    return new DisposableDelegate(() => this._removeBindings(exbArray));
  }

  /**
   * Process a `'keydown'` event and invoke the matching bindings.
   *
   * @param event - The event object for a `'keydown'` event.
   *
   * #### Notes
   * This should be called in response to a `'keydown'` event in order
   * to invoke the handlers of the matching key bindings.
   *
   * The manager **does not** install its own key event listeners. This
   * allows user code full control over the nodes for which the keymap
   * processes events.
   */
  processKeydownEvent(event: KeyboardEvent): void {
    // Get the canonical keystroke for the keydown event. Bail
    // early if the event does not represent a valid keystroke.
    var keystroke = keystrokeForKeydownEvent(event);
    if (!keystroke) {
      return;
    }

    // Add the keystroke to the current key sequence.
    this._sequence.push(keystroke);

    // Find the exact and partial matches for the key sequence.
    var matches = findSequenceMatches(this._bindings, this._sequence);

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

    // If there are exact matches and partial matches, the exact
    // matches are stored so they can be dispatched if the timer
    // expires before a more specific match is found.
    if (matches.exact.length > 0) {
      this._exactData = { exact: matches.exact, event: event };
    }

    // Restart the timer to get equal intervals between keystrokes.
    //
    // TODO
    // - we may want to replay events if an exact match fails.
    event.preventDefault();
    event.stopPropagation();
    this._startTimer();
  }

  /**
   * Remove an array of ex bindings from the key map.
   */
  private _removeBindings(array: IExBinding[]): void {
    this._bindings = this._bindings.filter(exb => array.indexOf(exb) === -1);
  }

  /**
   * Start or restart the pending timer for the key map.
   */
  private _startTimer(): void {
    this._clearTimer();
    this._timer = setTimeout(() => {
      this._onPendingTimeout();
    }, 1000);
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
    this._sequence.length = 0;
  }

  /**
   * Handle the partial match timeout.
   */
  private _onPendingTimeout(): void {
    var data = this._exactData;
    this._timer = 0;
    this._exactData = null;
    this._sequence.length = 0;
    if (data) dispatchBindings(data.exact, data.event);
  }

  private _timer = 0;
  private _sequence: string[] = [];
  private _bindings: IExBinding[] = [];
  private _exactData: IExactData = null;
}


/**
 * An extended key binding object which holds extra data.
 */
interface IExBinding extends IKeyBinding {
  /**
   * The specificity of the CSS selector.
   */
  specificity: number;
}


/**
 * An object which holds pending exact match data.
 */
interface IExactData {
  /**
   * The exact match bindings.
   */
  exact: IExBinding[];

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
  exact: IExBinding[];

  /**
   * The bindings which partially match the key sequence.
   */
  partial: IExBinding[];
}


/**
 * Create an extended key binding from a user key binding.
 *
 * If the user key binding is invalid, a warning will be logged
 * to the console and `null` will be returned.
 */
function createExBinding(binding: IKeyBinding): IExBinding {
  if (!isSelectorValid(binding.selector)) {
    console.warn(`invalid key binding selector: ${binding.selector}`);
    return null;
  }
  if (binding.sequence.length === 0) {
    console.warn('empty key sequence for key binding');
    return null;
  }
  if (!binding.handler) {
    console.warn('null handler for key binding');
    return null;
  }
  try {
    var sequence = binding.sequence.map(normalizeKeystroke);
  } catch (e) {
    console.warn(`invalid key binding sequence: ${binding.sequence}`);
    return null;
  }
  return {
    sequence: sequence,
    handler: binding.handler,
    selector: binding.selector,
    specificity: calculateSpecificity(binding.selector),
  };
}


/**
 * An enum which describes the possible sequence matches.
 */
const enum SequenceMatch { None, Exact, Partial };


/**
 * Test whether an ex binding matches a key sequence.
 *
 * Returns a `SequenceMatch` value indicating the type of match.
 */
function matchSequence(exb: IExBinding, sequence: string[]): SequenceMatch {
  if (exb.sequence.length < sequence.length) {
    return SequenceMatch.None;
  }
  for (var i = 0, n = sequence.length; i < n; ++i) {
    if (exb.sequence[i] !== sequence[i]) {
      return SequenceMatch.None;
    }
  }
  if (exb.sequence.length > sequence.length) {
    return SequenceMatch.Partial;
  }
  return SequenceMatch.Exact;
}


/**
 * Find the extended bindings which match a key sequence.
 *
 * Returns a match result which contains the exact and partial matches.
 */
function findSequenceMatches(bindings: IExBinding[], sequence: string[]): IMatchResult {
  var exact: IExBinding[] = [];
  var partial: IExBinding[] = [];
  for (var i = 0, n = bindings.length; i < n; ++i) {
    var match = matchSequence(bindings[i], sequence);
    if (match === SequenceMatch.Exact) {
      exact.push(bindings[i]);
    } else if (match === SequenceMatch.Partial) {
      partial.push(bindings[i]);
    }
  }
  return { exact: exact, partial: partial };
}


/**
 * Find the best matching binding for the given target element.
 *
 * Returns `undefined` if no matching binding is found.
 */
function findBestMatch(bindings: IExBinding[], target: Element): IExBinding {
  var result: IExBinding = void 0;
  for (var i = 0, n = bindings.length; i < n; ++i) {
    var exb = bindings[i];
    if (!matchesSelector(target, exb.selector)) {
      continue;
    }
    if (!result || exb.specificity >= result.specificity) {
      result = exb;
    }
  }
  return result;
}


/**
 * Dispatch the key bindings for the given keyboard event.
 *
 * As the dispatcher walks up the DOM, the bindings will be filtered
 * for the best matching keybinding. If a match is found, the handler
 * is invoked and event propagation is stopped.
 */
function dispatchBindings(bindings: IExBinding[], event: KeyboardEvent): void {
  var target = event.target as Element;
  while (target) {
    var match = findBestMatch(bindings, target);
    if (match) {
      event.preventDefault();
      event.stopPropagation();
      match.handler.call(void 0);
      return;
    }
    if (target === event.currentTarget) {
      return;
    }
    target = target.parentElement;
  }
}


/**
 * Test whether an element matches a CSS selector.
 */
function matchesSelector(elem: Element, selector: string): boolean {
  return protoMatchFunc.call(elem, selector);
}


/**
 * A cross-browser CSS selector matching prototype function.
 *
 * This function must be called with an element as `this` context.
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

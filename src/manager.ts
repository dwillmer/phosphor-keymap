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
   * Each keystroke must adhere to the following format:
   *
   */
  sequence: string[];

  /**
   * The handler function to invoke when the key sequence is matched.
   *
   */
  handler: (arg: any) => void;
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
    // - we may want to replay prevented defaults if a match fails.
    // - we may want to stop propagation until a match fails.
    event.preventDefault();
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

  /**
   * A unique tie-breaking id number for the key binding.
   */
  id: number;
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
 * A monotonically increasing ex binding id number.
 */
var bindingId = 0;


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
    id: bindingId++,
    sequence: sequence,
    handler: binding.handler,
    selector: binding.selector,
    specificity: calculateSpecificity(binding.selector),
  };
}


/**
 * A comparison function for extended bindings.
 *
 * This can be used to sort an array of bindings according to the
 * highest CSS specificity. Ties are broken using the binding id,
 * with newer bindings appearing first.
 */
function exBindingCmp(first: IExBinding, second: IExBinding): number {
  if (first.specificity === second.specificity) {
    return second.id - first.id;
  }
  return second.specificity - first.specificity;
}


/**
 * An enum which describes the possible sequence matches.
 */
const enum SequenceMatch { None, Exact, Partial };


/**
 * Test whether an ex binding matches a key sequence.
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
 * Find the extended bindings with a matching CSS selector.
 *
 * The resulting array will be sorted in binding sort order.
 */
function findSelectorMatches(bindings: IExBinding[], target: Element): IExBinding[] {
  var result = bindings.filter(exb => matchesSelector(target, exb.selector));
  return result.sort(exBindingCmp);
}


/**
 * Dispatch the key bindings for the given keyboard event.
 *
 * As the dispatcher walks up the DOM, the bindings will be filtered
 * for matching selectors, and invoked in specificity order.
 *
 * // If the
 * // handler for a binding returns `true`, dispatch will terminate and
 * // the event propagation will be stopped.
 */
function dispatchBindings(bindings: IExBinding[], event: KeyboardEvent): void {
  var target = event.target as Element;
  var current = event.currentTarget as Element;
  while (target) {
    var matches = findSelectorMatches(bindings, target);
    for (var i = 0, n = matches.length; i < n; ++i) {
      matches[i].handler.call(void 0);
      return; // TODO
      // if (matches[i].invoke()) {
      //   event.preventDefault();
      //   event.stopPropagation();
      //   return;
      // }
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

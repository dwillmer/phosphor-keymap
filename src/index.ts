/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

export * from './keyboard';


/**
 * An object which represents a key binding.
 */
export
interface IKeyBinding {
  /**
   * The key sequence for the key binding.
   *
   * A key sequence is represented as an array of keystrokes, where
   * each keystroke is a combination of modifiers (optional) and a
   * primary key (required).
   *
   * Most key sequences will be an array of length `1`, which represent
   * a typical keyboard shortcut. Sequences of longer length are known
   * as "chords" and can be useful for modal input (ala Vim).
   *
   * Each keystroke in the sequence must adhere to the format:
   *
   *   `[<modifier 1> [<modifier 2> [<modifier N>]]] <primary key>`
   *
   * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
   * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
   * `Ctrl` on all other platforms.
   *
   * Each keystroke must conform to the following:
   *   - Modifiers and the primary key are case senstive.
   *   - The primary key must be a valid key for the layout.
   *   - Whitespace is used to separate modifiers and primary key.
   *   - Modifiers may appear in any order before the primary key.
   *   - Modifiers cannot appear in duplicate.
   *   - The `Cmd` modifier is only valid on Mac.
   *
   * If a keystroke is nonconforming, the key binding will be ignored.
   */
  sequence: string[];

  /**
   * The CSS selector for the key binding.
   *
   * The selector must match a node on the propagation path of the
   * keyboard event in order for the binding handler to be invoked.
   *
   * If the selector is invalid, the key binding will be ignored.
   */
  selector: string;

  /**
   * The command to invoke when the key binding is matched.
   */
  command: string;
}

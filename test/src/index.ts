/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import expect = require('expect.js');

import {
  DisposableDelegate
} from 'phosphor-disposable';

import {
  IKeyBinding, KeymapManager, normalizeKeystroke
} from '../../lib/index';


/**
 * Helper function to generate keyboard events for unit-tests.
 */
var genKeyboardEvent = function(options: any): KeyboardEvent {
  var keyEvent = <KeyboardEvent>document.createEvent("KeyboardEvent");
  var initMethod: any = typeof keyEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
  (<any>keyEvent)[initMethod](
    "keydown",
    options.bubbles || true,
    options.cancelable || true,
    window,
    options.ctrlKey || false,
    options.altKey || false,
    options.shiftKey || false,
    options.metaKey || false,
    options.keyCode,
    options.charCodeArgs || 0
  );
  return keyEvent;
}


describe('phosphor-keymap', () => {

  describe('KeymapManager', () => {

    describe('#keycodes mozilla', () => {

      it('should register and fire on a correct keyboard event', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Ctrl+;";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };
        var binding = {
          sequence: testInput,
          handler: handler
        };

        var disposable = keymap.add('*', [binding]);

        expect(id).to.be(0);

        var keyEvent = genKeyboardEvent({ keyCode: 59, ctrlKey: true });
        document.body.dispatchEvent(keyEvent);

        expect(id).to.be(1);

        var keyEventIncorrect = genKeyboardEvent({ keyCode: 45, ctrlKey: true });
        document.body.dispatchEvent(keyEventIncorrect);

        expect(id).to.be(1);

        disposable.dispose();

        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(1);

        document.removeEventListener('keydown', listener);
      });

      it('should not fire with different modifiers', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Ctrl+S";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 83, ctrlKey: true });
        document.body.dispatchEvent(keyEvent);

        expect(id).to.be(0);

        var disposable = keymap.add('*', [binding]);

        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(1);

        var keyEventAlt = genKeyboardEvent({ keyCode: 83, altKey: true });
        document.body.dispatchEvent(keyEventAlt);
        expect(id).to.be(1);

        var keyEventShift = genKeyboardEvent({ keyCode: 83, shiftKey: true });
        document.body.dispatchEvent(keyEventShift);
        expect(id).to.be(1);

        disposable.dispose();
        document.removeEventListener('keydown', listener);
      });  

      it('should fire with multiple events in a binding', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Ctrl+K Ctrl+L";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEventK = genKeyboardEvent({ keyCode: 75, ctrlKey: true });
        var keyEventL = genKeyboardEvent({ keyCode: 76, ctrlKey: true });

        var disposable = keymap.add('*', [binding]);

        document.body.dispatchEvent(keyEventK);
        expect(id).to.be(0);
        document.body.dispatchEvent(keyEventL);
        expect(id).to.be(1);

        document.body.dispatchEvent(keyEventL);
        expect(id).to.be(1);
        document.body.dispatchEvent(keyEventK);
        expect(id).to.be(1);

        disposable.dispose();
        document.removeEventListener('keydown', listener);
      });

      it('should not stop propagation if handler returns false', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Ctrl+Y";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return false;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 89, ctrlKey: true });
        var disposable = keymap.add('*', [binding]);

        expect(id).to.be(0);
        document.body.dispatchEvent(keyEvent);
        expect(id).to.be.greaterThan(0);

        disposable.dispose();
        document.removeEventListener('keydown', listener);

      });

      it('should not execute handler without matching selector', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Shift+P";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 80, shiftKey: true });
        var disposable = keymap.add('.myScope', [binding]);

        expect(id).to.be(0);
        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(0);

        disposable.dispose();
        document.removeEventListener('keydown', listener);

      });

      it('should not execute handler on modifier keycode', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Ctrl+P";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 17 });
        var disposable = keymap.add('*', [binding]);

        expect(id).to.be(0);
        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(0);

        disposable.dispose();
        document.removeEventListener('keydown', listener);

      });

      it('should not register invalid sequence', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Ctrl-U";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 85, ctrlKey: true });
        var disposable = keymap.add('*', [binding]);
        expect(id).to.be(0);
        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(0);

        disposable.dispose();
        document.removeEventListener('keydown', listener);

      });

      it('should not register invalid selector', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Alt+Z";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 90, altKey: true });
        var disposable = keymap.add('123', [binding]);
        expect(id).to.be(0);
        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(0);

        expect(disposable).to.be(undefined);
        document.removeEventListener('keydown', listener);

      });

      it('should register partial and exact matches', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var firstInput = "Ctrl+S";
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var firstBinding = {
          sequence: firstInput,
          handler: handler
        };

        var secondInput = "Ctrl+S Ctrl+D";
        var secondId = 0;
        var secondHandler = (): boolean => {
          secondId++;
          return true;
        };

        var secondBinding = {
          sequence: secondInput,
          handler: secondHandler
        };

        var firstEvent = genKeyboardEvent({ keyCode: 83, ctrlKey: true });
        var secondEvent = genKeyboardEvent({ keyCode: 68, ctrlKey: true });
        var disposable = keymap.add('*', [firstBinding, secondBinding]);

        expect(id).to.be(0);
        expect(secondId).to.be(0);
        document.body.dispatchEvent(firstEvent);
        expect(id).to.be(0);
        expect(secondId).to.be(0);
        document.body.dispatchEvent(secondEvent);
        expect(id).to.be(0);
        expect(secondId).to.be(1);

        disposable.dispose();
        document.removeEventListener('keydown', listener);

      });

      it('should do nothing with null handlers', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Shift+A";
        var id = 0;
        var handler: any = null;

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 65, altKey: true });
        var disposable = keymap.add('*', [binding]);
        expect(id).to.be(0);
        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(0);

        disposable.dispose();
        document.removeEventListener('keydown', listener);
      });

      it('should recognise permutations of modifiers', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Shift+alt+ctrl+T"
        var id = 0;
        var handler = (): boolean => {
          id++;
          return true;
        };

        var binding = {
          sequence: testInput,
          handler: handler
        };

        var keyEvent = genKeyboardEvent({ keyCode: 84, ctrlKey: true, altKey: true, shiftKey: true });
        var disposable = keymap.add('*', [binding]);

        expect(id).to.be(0);
        document.body.dispatchEvent(keyEvent);
        expect(id).to.be(1);

        var secondInput = "alt+cmd+shift+ctrl+Q";
        var secondId = 0;
        var secondHandler = (): boolean => {
          id++;
          return true;
        };

        var secondBinding = {
          sequence: secondInput,
          handler: secondHandler
        };

        var secondKeyEvent = genKeyboardEvent({ keyCode: 81, ctrlKey: true, altKey: true, shiftKey: true, metaKey: true });
        var secondDisposable = keymap.add('*', [secondBinding]);

        expect(secondId).to.be(0);
        document.body.dispatchEvent(secondKeyEvent);
        expect(secondId).to.be(0);

        disposable.dispose();
        secondDisposable.dispose();
        document.removeEventListener('keydown', listener);

      });

    });

  });

  describe('#keystrokes', () => {

    describe('normalizeKeystrokes', () => {

      it('should not register invalid keystrokes', () => {
        expect(() => normalizeKeystroke('ctrls+q')).to.throwError();
        expect(() => normalizeKeystroke('shiftxtrl+^')).to.throwError();
        expect(() => normalizeKeystroke('altcmd+d')).to.throwError();
        expect(() => normalizeKeystroke('ctrl+alt+ctrl+E')).to.throwError();
        expect(() => normalizeKeystroke('alt+ctrl+shift+alt+shift+Q')).to.throwError();
        expect(() => normalizeKeystroke('shift+ctrl+shift+x')).to.throwError();
        expect(() => normalizeKeystroke('cmd+shift+alt+cmd+X')).to.throwError();
        expect(normalizeKeystroke('i')).to.be('i');
        expect(() => normalizeKeystroke('+J')).to.throwError();
        expect(() => normalizeKeystroke('j+')).to.throwError();

      });

    });

  });

});

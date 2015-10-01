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
  IKeyBinding, KeymapManager
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

      it('should register and fire on correct keyboard event', () => {
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
        var keyEventL = genKeyboardEvent({ keyCode: 76, ctrlKey: true});

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

        var testInput = "Ctrl-Y";
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
        expect(id).to.be(1);

        disposable.dispose();
        document.removeEventListener('keydown', listener);

      });

      it('should not execute handler without matching selector', () => {
        var keymap = new KeymapManager();
        var listener = (event: KeyboardEvent) => {
          keymap.processKeydownEvent(event);
        };
        document.addEventListener('keydown', listener);

        var testInput = "Shift-P";
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

    });

  });


  //     it('should recognise permutations of modifiers', () => {
  //       var km = new KeymapManager();
  //       var testId = "test:id";
  //       var testInput = "Ctrl-Shift-x";
  //       var sequence = {
  //           keys: testInput,
  //           command: testId
  //       };

  //       var preRegistration = km.hasShortcut(testInput, '*');
  //       expect(preRegistration).to.be(false);

  //       var regSeq = km.registerBindings([sequence]);
  //       expect((<BindingDisposable>regSeq).count).to.be(1);

  //       var postRegistration = km.hasShortcut(testInput, '*');
  //       expect(postRegistration).to.be(true);

  //       var alternate = km.hasShortcut('Shift-Ctrl-X', '*');
  //       expect(alternate).to.be(true);

  //       var cas2 = "Ctrl-Alt-Shift-2";
  //       var sequence = {
  //           keys: cas2,
  //           command: testId
  //       };

  //       var preRegistration = km.hasShortcut(cas2, '*');
  //       expect(preRegistration).to.be(false);

  //       var sequenceDisp = km.registerBindings([sequence]);
  //       expect((<BindingDisposable>sequenceDisp).count).to.be(1);

  //       var postRegistration = km.hasShortcut(testInput, '*');
  //       expect(postRegistration).to.be(true);

  //       var alternate1 = km.hasShortcut('Alt-ctrl-shift-2', '*');
  //       expect(alternate1).to.be(true);

  //       var alternate2 = km.hasShortcut('Ctrl-Alt-Shift-23', '*');
  //       expect(alternate2).to.be(false);

  //       regSeq.dispose();
  //       sequenceDisp.dispose();
  //       km.dispose();

  //     });

  //   });

  //     });

});

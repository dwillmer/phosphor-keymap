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
KeymapManager, IKeySequence
} from '../../lib/index';


/**
 * Helper function to generate keyboard events for unit-tests.
 */
var genKeyboardEvent = function(options: any): KeyboardEvent {
  var keyEvent = <KeyboardEvent>document.createEvent("KeyboardEvent");
  var initMethod = typeof keyEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
  keyEvent[initMethod](
    "keydown",
    <boolean>(options.bubbles) || true,
    <boolean>(options.cancelable) || true,
    <Window>window,
    <boolean>(options.ctrlKey) || false,
    <boolean>(options.altKey) || false,
    <boolean>(options.shiftKey) || false,
    <boolean>(options.metaKey) || false,
    <number>(options.keyCode),
    <number>(options.charCodeArgs) || 0
  );
  return <KeyboardEvent>keyEvent;
}


describe('phosphor-keymap', () => {
  
  describe('KeymapManager', () => {

    describe('#keycodes mozilla', () => {

      it('should register 59 for semi-colon', () => {

        var options = {
            keycodeSetting: 'mozilla',
            manager: () => { console.error('Should not be called'); }
        };
        var km = new KeymapManager(options);

        var testId = 'test:id';
        var testInput = "Ctrl-;";
        var sequence = {
            input: testInput,
            id: testId
        };

        var preRegistration = km.hasShortcut(testInput);
        expect(preRegistration).to.be(false);

        km.registerSequence(sequence);

        var postRegistration = km.hasShortcut(testInput);
        expect(postRegistration).to.be(true);

        var id = '';
        var handler = (sender: any, value: string) => {
            id = value;
        };
        km.commandRequested.connect(handler, this);

        expect(id).to.be('');

        var keyEvent = genKeyboardEvent({ keyCode: 59, ctrlKey: true });
        document.dispatchEvent(keyEvent);

        expect(id).to.be(testId);

      });

    });

    describe('#modifiers mozilla', () => {

      it('should register permutations of ctrl-alt-shift', () => {

        var options = {
            keycodeSetting: 'mozilla',
            manager: () => { console.error('Should not be called'); }
        };
        var km = new KeymapManager(options);

        var testId = "test:id";
        var testInput = "Ctrl-Shift-x";
        var sequence = {
            input: testInput,
            id: testId
        };

        var preRegistration = km.hasShortcut(testInput);
        expect(preRegistration).to.be(false);

        var regSeq = km.registerSequence(sequence);
        expect(regSeq).to.be(true);

        var postRegistration = km.hasShortcut(testInput);
        expect(postRegistration).to.be(true);

        var alternate = km.hasShortcut('Shift-Ctrl-X');
        expect(alternate).to.be(true);

        var cas2 = "Ctrl-Alt-Shift-2";
        var sequence = {
            input: cas2,
            id: testId
        };

        var preRegistration = km.hasShortcut(cas2);
        expect(preRegistration).to.be(false);

        km.registerSequence(sequence);

        var postRegistration = km.hasShortcut(testInput);
        expect(postRegistration).to.be(true);

        var alternate1 = km.hasShortcut('Alt-ctrl-shift-2');
        expect(alternate1).to.be(true);

        var alternate2 = km.hasShortcut('Ctrl-Alt-Shift-23');
        expect(alternate2).to.be(false);

      });

    });

    describe('#registerSequence mozilla', () => {

      it('should not overwrite a key sequence', () => {

        var options = {
          keycodeSetting: 'mozilla',
          manager: () => { console.error('Should not be called'); }
        };
        var km = new KeymapManager(options);

        var testId = "test:id";
        var testInput = "Ctrl-Alt-L";
        var sequence = {
          input: testInput,
          id: testId
        };

        var preRegistration = km.hasShortcut(testInput);
        expect(preRegistration).to.be(false);

        var regSeq = km.registerSequence(sequence);
        expect(regSeq).to.be(true);

        var postRegistration = km.hasShortcut(testInput);
        expect(postRegistration).to.be(true);


      });

    });

  });

});

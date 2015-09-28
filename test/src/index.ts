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
  Keymap, IKeyBinding
} from '../../lib/index';


/**
 * Helper function to generate keyboard events for unit-tests.
 */
// var genKeyboardEvent = function(options: any): KeyboardEvent {
//   var keyEvent = <KeyboardEvent>document.createEvent("KeyboardEvent");
//   var initMethod: any = typeof keyEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
//   (<any>keyEvent)[initMethod](
//     "keydown",
//     options.bubbles || true,
//     options.cancelable || true,
//     window,
//     options.ctrlKey || false,
//     options.altKey || false,
//     options.shiftKey || false,
//     options.metaKey || false,
//     options.keyCode,
//     options.charCodeArgs || 0
//   );
//   return keyEvent;
// }


describe('phosphor-keymap', () => {

  it('should pass', () => {

  });
  // describe('KeymapManager', () => {

  //   describe('#keycodes mozilla', () => {

  //     it('should register and fire on keyboard event', () => {
  //       var km = new KeymapManager();
  //       var testId = 'test:id';
  //       var testInput = "Ctrl-;";
  //       var sequence = {
  //           keys: testInput,
  //           command: testId
  //       };

  //       var preRegistration = km.hasShortcut(testInput, '*');
  //       expect(preRegistration).to.be(false);

  //       var disposable = km.registerBindings([sequence]);
  //       expect((<BindingDisposable>disposable).count).to.be(1);

  //       var postRegistration = km.hasShortcut(testInput, '*');
  //       expect(postRegistration).to.be(true);

  //       var id = '';
  //       var handler = (sender: any, value: string) => {
  //         id = value;
  //       };
  //       km.commandRequested.connect(handler, this);

  //       expect(id).to.be('');

  //       var keyEvent = genKeyboardEvent({ keyCode: 59, ctrlKey: true });
  //       document.body.dispatchEvent(keyEvent);

  //       expect(id).to.be(testId);
  //       disposable.dispose();
  //       km.dispose();

  //     });

  //     it('should not emit with invalid scope', () => {
  //       var km = new KeymapManager();
  //       var testId = "test:id";
  //       var testInput = "Ctrl-Alt-D";
  //       var sequence = {
  //         keys: testInput,
  //         command: testId,
  //         selector: '.testScope'
  //       };

  //       var preRegistration = km.hasShortcut(testInput, '*');
  //       expect(preRegistration).to.be(false);

  //       var disposable = km.registerBindings([sequence]);
  //       expect((<BindingDisposable>disposable).count).to.be(1);

  //       var postRegistrationBad = km.hasShortcut(testInput, '*');
  //       expect(postRegistrationBad).to.be(false);

  //       var postRegistrationGood = km.hasShortcut(testInput, '.testScope');
  //       expect(postRegistrationGood).to.be(true);

  //       var id = '';
  //       var handler = (sender: any, value: string) => {
  //         id = value;
  //       };
  //       km.commandRequested.connect(handler, this);

  //       expect(id).to.be('');

  //       var keyEvent = genKeyboardEvent({ keyCode: 68, ctrlKey: true, altKey: true });
  //       document.body.dispatchEvent(keyEvent);
  //       expect(id).to.be('');

  //       disposable.dispose();
  //       km.dispose();

  //     });

  //     it('should not emit with invalid keycode', () => {
  //         var km = new KeymapManager();
  //         var testId = 'test:id';
  //         var testInput = 'Ctrl-L';
  //         var sequence = {
  //           keys: testInput,
  //           command: testId
  //         };

  //         var preRegistration = km.hasShortcut(testInput, '*');
  //         expect(preRegistration).to.be(false);

  //         var disposable = km.registerBindings([sequence]);
  //         expect((<BindingDisposable>disposable).count).to.be(1);

  //         var postRegistration = km.hasShortcut(testInput, '*');
  //         expect(postRegistration).to.be(true);

  //         var id = '';
  //         var handler = (sender: any, value: string) => {
  //           id = value;
  //         };
  //         km.commandRequested.connect(handler, this);

  //         expect(id).to.be('');

  //         var keyEvent = genKeyboardEvent({ keyCode: 1000, ctrlKey: true });
  //         document.body.dispatchEvent(keyEvent);

  //         expect(id).to.be('');
  //         disposable.dispose();
  //         km.dispose();

  //     });

  //   });

  //   describe('#modifiers mozilla', () => {

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

  //   describe('#registerBindings mozilla', () => {

  //     it('should not allow multiple commands per key binding', () => {
  //       var km = new KeymapManager();
  //       var testId = "test:id";
  //       var testInput = "Ctrl-Alt-L";
  //       var binding = {
  //         keys: testInput,
  //         command: testId
  //       };

  //       var preRegistration = km.hasShortcut(testInput, '*');
  //       expect(preRegistration).to.be(false);

  //       var regSeq = km.registerBindings([binding]);
  //       expect((<BindingDisposable>regSeq).count).to.be(1);

  //       var postRegistration = km.hasShortcut(testInput, '*');
  //       expect(postRegistration).to.be(true);

  //       var secondId = "second:id";
  //       var bindingRepeat = {
  //         keys: testInput,
  //         command: secondId
  //       };
  //       var regBindingRepeat = km.registerBindings([bindingRepeat]);
  //       expect((<BindingDisposable>regBindingRepeat).count).to.be(1);

  //       var id = '';
  //       var handler = (sender: any, value: string) => {
  //           id = value;
  //       };
  //       km.commandRequested.connect(handler, this);

  //       expect(id).to.be('');

  //       var keyEvent = genKeyboardEvent({keyCode: 76, ctrlKey: true, altKey: true});
  //       document.body.dispatchEvent(keyEvent);

  //       expect(id).to.be(testId);

  //       regSeq.dispose();
  //       regBindingRepeat.dispose();
  //       km.dispose();

  //     });

  //     it('should accept multiple keys in a single binding', () => {
  //       var km = new KeymapManager();
  //       var testId = "test:id";
  //       var testInput = "Ctrl-X Y";
  //       var binding = {
  //         keys: testInput,
  //         command: testId
  //       };

  //       var preRegistration = km.hasShortcut(testInput, '*');
  //       expect(preRegistration).to.be(false);

  //       var multiKeyBind = km.registerBindings([binding]);
  //       expect((<BindingDisposable>multiKeyBind).count).to.be(1);

  //       var postRegistration = km.hasShortcut(testInput, '*');
  //       expect(postRegistration).to.be(true);

  //       var exists = km.hasShortcut('Ctrl-X Y', '*');
  //       expect(exists).to.be(true);

  //       var exists2 = km.hasShortcut('Ctrl-x Ctrl-y', '*');
  //       expect(exists).to.be(true);

  //       multiKeyBind.dispose();
  //       km.dispose();

  //     });

  //     it('should fire on multiple keydown events', () => {
  //       var km = new KeymapManager();
  //       var testId = "test:id";
  //       var testInput = "Ctrl-f g";
  //       var binding = {
  //         keys: testInput,
  //         command: testId
  //       };

  //       var multiKeyBind = km.registerBindings([binding]);
  //       expect((<BindingDisposable>multiKeyBind).count).to.be(1);

  //       var id = '';
  //       var handler = (sender: any, value: string) => {
  //           id = value;
  //       };
  //       km.commandRequested.connect(handler, this);

  //       expect(id).to.be('');

  //       var keyEvent = genKeyboardEvent({ keyCode: 70, ctrlKey: true });
  //       var keyEventTwo = genKeyboardEvent({ keyCode: 71, ctrlKey: true });
  //       document.body.dispatchEvent(keyEvent);
  //       document.body.dispatchEvent(keyEventTwo);

  //       expect(id).to.be(testId);
  //       multiKeyBind.dispose();
  //       km.dispose();

  //     });

  //   });

  //   describe('#shortcutsForCommand', () => {

  //     it('should return the shortcuts for a given command', () => {
  //       var km = new KeymapManager();
  //       var firstId = "id:first";
  //       var firstInput = "Ctrl-F";
  //       var firstSeq = {
  //         keys: firstInput,
  //         command: firstId
  //       };

  //       var preRegistration = km.hasShortcut(firstInput, '*');
  //       expect(preRegistration).to.be(false);

  //       var regFirst = km.registerBindings([firstSeq]);
  //       expect((<BindingDisposable>regFirst).count).to.be(1);

  //       var secondId = "id:second";
  //       var secondInput = "Ctrl-s";
  //       var secondSeq = {
  //         keys: secondInput,
  //         command: secondId
  //       };

  //       var preRegistration = km.hasShortcut(secondInput, '*');
  //       expect(preRegistration).to.be(false);

  //       var regSecond = km.registerBindings([secondSeq]);
  //       expect((<BindingDisposable>regSecond).count).to.be(1);

  //       var firstResult = km.shortcutsForCommand(firstId, '*');
  //       expect(firstResult.length).to.be(1);
  //       expect(firstResult[0]).to.be(firstInput);

  //       var secondResult = km.shortcutsForCommand(secondId, '*');
  //       expect(secondResult.length).to.be(1);
  //       expect(secondResult[0]).to.be(secondInput);

  //       expect(regFirst.isDisposed).to.be(false);
  //       regFirst.dispose();
  //       expect(regFirst.isDisposed).to.be(true);
  //       regSecond.dispose();
  //       km.dispose();

  //     });

  //   });

  //   describe('#ie', () => {

  //     it('should not have any shortcuts set', () => {
  //       var km = new KeymapManager();
  //       var dummyReg = km.hasShortcut('Ctrl-X', '*');
  //       expect(dummyReg).to.be(false);
  //       km.dispose();

  //     });

  //   });

  // });

});

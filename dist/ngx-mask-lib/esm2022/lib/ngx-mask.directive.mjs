import { DOCUMENT } from '@angular/common';
import { Directive, EventEmitter, HostListener, Input, Output, inject, } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, } from '@angular/forms';
import { NGX_MASK_CONFIG, timeMasks, withoutValidation } from './ngx-mask.config';
import { NgxMaskService } from './ngx-mask.service';
import * as i0 from "@angular/core";
export class NgxMaskDirective {
    constructor() {
        // eslint-disable-next-line @angular-eslint/no-input-rename
        this.maskExpression = '';
        this.specialCharacters = [];
        this.patterns = {};
        this.prefix = '';
        this.suffix = '';
        this.thousandSeparator = ' ';
        this.decimalMarker = '.';
        this.dropSpecialCharacters = null;
        this.hiddenInput = null;
        this.showMaskTyped = null;
        this.placeHolderCharacter = null;
        this.shownMaskExpression = null;
        this.showTemplate = null;
        this.clearIfNotMatch = null;
        this.validation = null;
        this.separatorLimit = null;
        this.allowNegativeNumbers = null;
        this.leadZeroDateTime = null;
        this.leadZero = null;
        this.triggerOnMaskChange = null;
        this.apm = null;
        this.inputTransformFn = null;
        this.outputTransformFn = null;
        this.keepCharacterPositions = null;
        this.maskFilled = new EventEmitter();
        this._maskValue = '';
        this._position = null;
        this._maskExpressionArray = [];
        this._justPasted = false;
        this._isFocused = false;
        /**For IME composition event */
        this._isComposing = false;
        this.document = inject(DOCUMENT);
        this._maskService = inject(NgxMaskService, { self: true });
        this._config = inject(NGX_MASK_CONFIG);
        // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
        this.onChange = (_) => { };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onTouch = () => { };
    }
    ngOnChanges(changes) {
        const { maskExpression, specialCharacters, patterns, prefix, suffix, thousandSeparator, decimalMarker, dropSpecialCharacters, hiddenInput, showMaskTyped, placeHolderCharacter, shownMaskExpression, showTemplate, clearIfNotMatch, validation, separatorLimit, allowNegativeNumbers, leadZeroDateTime, leadZero, triggerOnMaskChange, apm, inputTransformFn, outputTransformFn, keepCharacterPositions, } = changes;
        if (maskExpression) {
            if (maskExpression.currentValue !== maskExpression.previousValue &&
                !maskExpression.firstChange) {
                this._maskService.maskChanged = true;
            }
            if (maskExpression.currentValue &&
                maskExpression.currentValue.split("||" /* MaskExpression.OR */).length > 1) {
                this._maskExpressionArray = maskExpression.currentValue
                    .split("||" /* MaskExpression.OR */)
                    .sort((a, b) => {
                    return a.length - b.length;
                });
                this._setMask();
            }
            else {
                this._maskExpressionArray = [];
                this._maskValue = maskExpression.currentValue || "" /* MaskExpression.EMPTY_STRING */;
                this._maskService.maskExpression = this._maskValue;
            }
        }
        if (specialCharacters) {
            if (!specialCharacters.currentValue || !Array.isArray(specialCharacters.currentValue)) {
                return;
            }
            else {
                this._maskService.specialCharacters = specialCharacters.currentValue || [];
            }
        }
        if (allowNegativeNumbers) {
            this._maskService.allowNegativeNumbers = allowNegativeNumbers.currentValue;
            if (this._maskService.allowNegativeNumbers) {
                this._maskService.specialCharacters = this._maskService.specialCharacters.filter((c) => c !== "-" /* MaskExpression.MINUS */);
            }
        }
        // Only overwrite the mask available patterns if a pattern has actually been passed in
        if (patterns && patterns.currentValue) {
            this._maskService.patterns = patterns.currentValue;
        }
        if (apm && apm.currentValue) {
            this._maskService.apm = apm.currentValue;
        }
        if (prefix) {
            this._maskService.prefix = prefix.currentValue;
        }
        if (suffix) {
            this._maskService.suffix = suffix.currentValue;
        }
        if (thousandSeparator) {
            this._maskService.thousandSeparator = thousandSeparator.currentValue;
        }
        if (decimalMarker) {
            this._maskService.decimalMarker = decimalMarker.currentValue;
        }
        if (dropSpecialCharacters) {
            this._maskService.dropSpecialCharacters = dropSpecialCharacters.currentValue;
        }
        if (hiddenInput) {
            this._maskService.hiddenInput = hiddenInput.currentValue;
        }
        if (showMaskTyped) {
            this._maskService.showMaskTyped = showMaskTyped.currentValue;
            if (showMaskTyped.previousValue === false &&
                showMaskTyped.currentValue === true &&
                this._isFocused) {
                requestAnimationFrame(() => {
                    this._maskService._elementRef?.nativeElement.click();
                });
            }
        }
        if (placeHolderCharacter) {
            this._maskService.placeHolderCharacter = placeHolderCharacter.currentValue;
        }
        if (shownMaskExpression) {
            this._maskService.shownMaskExpression = shownMaskExpression.currentValue;
        }
        if (showTemplate) {
            this._maskService.showTemplate = showTemplate.currentValue;
        }
        if (clearIfNotMatch) {
            this._maskService.clearIfNotMatch = clearIfNotMatch.currentValue;
        }
        if (validation) {
            this._maskService.validation = validation.currentValue;
        }
        if (separatorLimit) {
            this._maskService.separatorLimit = separatorLimit.currentValue;
        }
        if (leadZeroDateTime) {
            this._maskService.leadZeroDateTime = leadZeroDateTime.currentValue;
        }
        if (leadZero) {
            this._maskService.leadZero = leadZero.currentValue;
        }
        if (triggerOnMaskChange) {
            this._maskService.triggerOnMaskChange = triggerOnMaskChange.currentValue;
        }
        if (inputTransformFn) {
            this._maskService.inputTransformFn = inputTransformFn.currentValue;
        }
        if (outputTransformFn) {
            this._maskService.outputTransformFn = outputTransformFn.currentValue;
        }
        if (keepCharacterPositions) {
            this._maskService.keepCharacterPositions = keepCharacterPositions.currentValue;
        }
        this._applyMask();
    }
    // eslint-disable-next-line complexity
    validate({ value }) {
        if (!this._maskService.validation || !this._maskValue) {
            return null;
        }
        if (this._maskService.ipError) {
            return this._createValidationError(value);
        }
        if (this._maskService.cpfCnpjError) {
            return this._createValidationError(value);
        }
        if (this._maskValue.startsWith("separator" /* MaskExpression.SEPARATOR */)) {
            return null;
        }
        if (withoutValidation.includes(this._maskValue)) {
            return null;
        }
        if (this._maskService.clearIfNotMatch) {
            return null;
        }
        if (timeMasks.includes(this._maskValue)) {
            return this._validateTime(value);
        }
        if (value && value.toString().length >= 1) {
            let counterOfOpt = 0;
            if (this._maskValue.startsWith("percent" /* MaskExpression.PERCENT */)) {
                return null;
            }
            for (const key in this._maskService.patterns) {
                if (this._maskService.patterns[key]?.optional) {
                    if (this._maskValue.indexOf(key) !== this._maskValue.lastIndexOf(key)) {
                        const opt = this._maskValue
                            .split("" /* MaskExpression.EMPTY_STRING */)
                            .filter((i) => i === key)
                            .join("" /* MaskExpression.EMPTY_STRING */);
                        counterOfOpt += opt.length;
                    }
                    else if (this._maskValue.indexOf(key) !== -1) {
                        counterOfOpt++;
                    }
                    if (this._maskValue.indexOf(key) !== -1 &&
                        value.toString().length >= this._maskValue.indexOf(key)) {
                        return null;
                    }
                    if (counterOfOpt === this._maskValue.length) {
                        return null;
                    }
                }
            }
            if (this._maskValue.indexOf("{" /* MaskExpression.CURLY_BRACKETS_LEFT */) === 1 &&
                value.toString().length ===
                    this._maskValue.length +
                        Number((this._maskValue.split("{" /* MaskExpression.CURLY_BRACKETS_LEFT */)[1] ??
                            "" /* MaskExpression.EMPTY_STRING */).split("}" /* MaskExpression.CURLY_BRACKETS_RIGHT */)[0]) -
                        4) {
                return null;
            }
            else if ((this._maskValue.indexOf("*" /* MaskExpression.SYMBOL_STAR */) > 1 &&
                value.toString().length <
                    this._maskValue.indexOf("*" /* MaskExpression.SYMBOL_STAR */)) ||
                (this._maskValue.indexOf("?" /* MaskExpression.SYMBOL_QUESTION */) > 1 &&
                    value.toString().length <
                        this._maskValue.indexOf("?" /* MaskExpression.SYMBOL_QUESTION */)) ||
                this._maskValue.indexOf("{" /* MaskExpression.CURLY_BRACKETS_LEFT */) === 1) {
                return this._createValidationError(value);
            }
            if (this._maskValue.indexOf("*" /* MaskExpression.SYMBOL_STAR */) === -1 ||
                this._maskValue.indexOf("?" /* MaskExpression.SYMBOL_QUESTION */) === -1) {
                // eslint-disable-next-line no-param-reassign
                value = typeof value === 'number' ? String(value) : value;
                const array = this._maskValue.split('*');
                const length = this._maskService.dropSpecialCharacters
                    ? this._maskValue.length -
                        this._maskService.checkDropSpecialCharAmount(this._maskValue) -
                        counterOfOpt
                    : this.prefix
                        ? this._maskValue.length + this.prefix.length - counterOfOpt
                        : this._maskValue.length - counterOfOpt;
                if (array.length === 1) {
                    if (value.toString().length < length) {
                        return this._createValidationError(value);
                    }
                }
                if (array.length > 1) {
                    const lastIndexArray = array[array.length - 1];
                    if (lastIndexArray &&
                        this._maskService.specialCharacters.includes(lastIndexArray[0]) &&
                        String(value).includes(lastIndexArray[0] ?? '') &&
                        !this.dropSpecialCharacters) {
                        const special = value.split(lastIndexArray[0]);
                        return special[special.length - 1].length === lastIndexArray.length - 1
                            ? null
                            : this._createValidationError(value);
                    }
                    else if (((lastIndexArray &&
                        !this._maskService.specialCharacters.includes(lastIndexArray[0])) ||
                        !lastIndexArray ||
                        this._maskService.dropSpecialCharacters) &&
                        value.length >= length - 1) {
                        return null;
                    }
                    else {
                        return this._createValidationError(value);
                    }
                }
            }
            if (this._maskValue.indexOf("*" /* MaskExpression.SYMBOL_STAR */) === 1 ||
                this._maskValue.indexOf("?" /* MaskExpression.SYMBOL_QUESTION */) === 1) {
                return null;
            }
        }
        if (value) {
            this.maskFilled.emit();
            return null;
        }
        return null;
    }
    onPaste() {
        this._justPasted = true;
    }
    onFocus() {
        this._isFocused = true;
    }
    onModelChange(value) {
        // on form reset we need to update the actualValue
        if ((value === "" /* MaskExpression.EMPTY_STRING */ || value === null || value === undefined) &&
            this._maskService.actualValue) {
            this._maskService.actualValue = this._maskService.getActualValue("" /* MaskExpression.EMPTY_STRING */);
        }
    }
    onInput(e) {
        // If IME is composing text, we wait for the composed text.
        if (this._isComposing)
            return;
        const el = e.target;
        const transformedValue = this._maskService.inputTransformFn(el.value);
        if (el.type !== 'number') {
            if (typeof transformedValue === 'string' || typeof transformedValue === 'number') {
                el.value = transformedValue.toString();
                this._inputValue = el.value;
                this._setMask();
                if (!this._maskValue) {
                    this.onChange(el.value);
                    return;
                }
                let position = el.selectionStart === 1
                    ? el.selectionStart + this._maskService.prefix.length
                    : el.selectionStart;
                if (this.showMaskTyped &&
                    this.keepCharacterPositions &&
                    this._maskService.placeHolderCharacter.length === 1) {
                    const inputSymbol = el.value.slice(position - 1, position);
                    const prefixLength = this.prefix.length;
                    const checkSymbols = this._maskService._checkSymbolMask(inputSymbol, this._maskService.maskExpression[position - 1 - prefixLength] ??
                        "" /* MaskExpression.EMPTY_STRING */);
                    const checkSpecialCharacter = this._maskService._checkSymbolMask(inputSymbol, this._maskService.maskExpression[position + 1 - prefixLength] ??
                        "" /* MaskExpression.EMPTY_STRING */);
                    const selectRangeBackspace = this._maskService.selStart === this._maskService.selEnd;
                    const selStart = Number(this._maskService.selStart) - prefixLength;
                    const selEnd = Number(this._maskService.selEnd) - prefixLength;
                    if (this._code === "Backspace" /* MaskExpression.BACKSPACE */) {
                        if (!selectRangeBackspace) {
                            if (this._maskService.selStart === prefixLength) {
                                this._maskService.actualValue = `${this.prefix}${this._maskService.maskIsShown.slice(0, selEnd)}${this._inputValue.split(this.prefix).join('')}`;
                            }
                            else if (this._maskService.selStart ===
                                this._maskService.maskIsShown.length + prefixLength) {
                                this._maskService.actualValue = `${this._inputValue}${this._maskService.maskIsShown.slice(selStart, selEnd)}`;
                            }
                            else {
                                this._maskService.actualValue = `${this.prefix}${this._inputValue
                                    .split(this.prefix)
                                    .join('')
                                    .slice(0, selStart)}${this._maskService.maskIsShown.slice(selStart, selEnd)}${this._maskService.actualValue.slice(selEnd + prefixLength, this._maskService.maskIsShown.length + prefixLength)}${this.suffix}`;
                            }
                        }
                        else if (!this._maskService.specialCharacters.includes(this._maskService.maskExpression.slice(position - this.prefix.length, position + 1 - this.prefix.length)) &&
                            selectRangeBackspace) {
                            if (selStart === 1 && this.prefix) {
                                this._maskService.actualValue = `${this.prefix}${this._maskService.placeHolderCharacter}${el.value
                                    .split(this.prefix)
                                    .join('')
                                    .split(this.suffix)
                                    .join('')}${this.suffix}`;
                                position = position - 1;
                            }
                            else {
                                const part1 = el.value.substring(0, position);
                                const part2 = el.value.substring(position);
                                this._maskService.actualValue = `${part1}${this._maskService.placeHolderCharacter}${part2}`;
                            }
                        }
                    }
                    if (this._code !== "Backspace" /* MaskExpression.BACKSPACE */) {
                        if (!checkSymbols && !checkSpecialCharacter && selectRangeBackspace) {
                            position = Number(el.selectionStart) - 1;
                        }
                        else if (this._maskService.specialCharacters.includes(el.value.slice(position, position + 1)) &&
                            checkSpecialCharacter &&
                            !this._maskService.specialCharacters.includes(el.value.slice(position + 1, position + 2))) {
                            this._maskService.actualValue = `${el.value.slice(0, position - 1)}${el.value.slice(position, position + 1)}${inputSymbol}${el.value.slice(position + 2)}`;
                            position = position + 1;
                        }
                        else if (checkSymbols) {
                            if (el.value.length === 1 && position === 1) {
                                this._maskService.actualValue = `${this.prefix}${inputSymbol}${this._maskService.maskIsShown.slice(1, this._maskService.maskIsShown.length)}${this.suffix}`;
                            }
                            else {
                                this._maskService.actualValue = `${el.value.slice(0, position - 1)}${inputSymbol}${el.value
                                    .slice(position + 1)
                                    .split(this.suffix)
                                    .join('')}${this.suffix}`;
                            }
                        }
                        else if (this.prefix &&
                            el.value.length === 1 &&
                            position - prefixLength === 1 &&
                            this._maskService._checkSymbolMask(el.value, this._maskService.maskExpression[position - 1 - prefixLength] ??
                                "" /* MaskExpression.EMPTY_STRING */)) {
                            this._maskService.actualValue = `${this.prefix}${el.value}${this._maskService.maskIsShown.slice(1, this._maskService.maskIsShown.length)}${this.suffix}`;
                        }
                    }
                }
                let caretShift = 0;
                let backspaceShift = false;
                if (this._code === "Delete" /* MaskExpression.DELETE */ && "separator" /* MaskExpression.SEPARATOR */) {
                    this._maskService.deletedSpecialCharacter = true;
                }
                if (this._inputValue.length >= this._maskService.maskExpression.length - 1 &&
                    this._code !== "Backspace" /* MaskExpression.BACKSPACE */ &&
                    this._maskService.maskExpression === "d0/M0/0000" /* MaskExpression.DAYS_MONTHS_YEARS */ &&
                    position < 10) {
                    const inputSymbol = this._inputValue.slice(position - 1, position);
                    el.value =
                        this._inputValue.slice(0, position - 1) +
                            inputSymbol +
                            this._inputValue.slice(position + 1);
                }
                if (this._maskService.maskExpression === "d0/M0/0000" /* MaskExpression.DAYS_MONTHS_YEARS */ &&
                    this.leadZeroDateTime) {
                    if ((position < 3 && Number(el.value) > 31 && Number(el.value) < 40) ||
                        (position === 5 && Number(el.value.slice(3, 5)) > 12)) {
                        position = position + 2;
                    }
                }
                if (this._maskService.maskExpression === "Hh:m0:s0" /* MaskExpression.HOURS_MINUTES_SECONDS */ &&
                    this.apm) {
                    if (this._justPasted && el.value.slice(0, 2) === "00" /* MaskExpression.DOUBLE_ZERO */) {
                        el.value = el.value.slice(1, 2) + el.value.slice(2, el.value.length);
                    }
                    el.value =
                        el.value === "00" /* MaskExpression.DOUBLE_ZERO */
                            ? "0" /* MaskExpression.NUMBER_ZERO */
                            : el.value;
                }
                this._maskService.applyValueChanges(position, this._justPasted, this._code === "Backspace" /* MaskExpression.BACKSPACE */ || this._code === "Delete" /* MaskExpression.DELETE */, (shift, _backspaceShift) => {
                    this._justPasted = false;
                    caretShift = shift;
                    backspaceShift = _backspaceShift;
                });
                // only set the selection if the element is active
                if (this._getActiveElement() !== el) {
                    return;
                }
                if (this._maskService.plusOnePosition) {
                    position = position + 1;
                    this._maskService.plusOnePosition = false;
                }
                // update position after applyValueChanges to prevent cursor on wrong position when it has an array of maskExpression
                if (this._maskExpressionArray.length) {
                    if (this._code === "Backspace" /* MaskExpression.BACKSPACE */) {
                        position = this.specialCharacters.includes(this._inputValue.slice(position - 1, position))
                            ? position - 1
                            : position;
                    }
                    else {
                        position =
                            el.selectionStart === 1
                                ? el.selectionStart + this._maskService.prefix.length
                                : el.selectionStart;
                    }
                }
                this._position =
                    this._position === 1 && this._inputValue.length === 1 ? null : this._position;
                let positionToApply = this._position
                    ? this._inputValue.length + position + caretShift
                    : position +
                        (this._code === "Backspace" /* MaskExpression.BACKSPACE */ && !backspaceShift ? 0 : caretShift);
                if (positionToApply > this._getActualInputLength()) {
                    positionToApply =
                        el.value === this._maskService.decimalMarker && el.value.length === 1
                            ? this._getActualInputLength() + 1
                            : this._getActualInputLength();
                }
                if (positionToApply < 0) {
                    positionToApply = 0;
                }
                el.setSelectionRange(positionToApply, positionToApply);
                this._position = null;
            }
            else {
                console.warn('Ngx-mask writeValue work with string | number, your current value:', typeof transformedValue);
            }
        }
        else {
            if (!this._maskValue) {
                this.onChange(el.value);
                return;
            }
            this._maskService.applyValueChanges(el.value.length, this._justPasted, this._code === "Backspace" /* MaskExpression.BACKSPACE */ || this._code === "Delete" /* MaskExpression.DELETE */);
        }
    }
    // IME starts
    onCompositionStart() {
        this._isComposing = true;
    }
    // IME completes
    onCompositionEnd(e) {
        this._isComposing = false;
        this._justPasted = true;
        this.onInput(e);
    }
    onBlur(e) {
        if (this._maskValue) {
            const el = e.target;
            if (this.leadZero && el.value.length > 0 && typeof this.decimalMarker === 'string') {
                const maskExpression = this._maskService.maskExpression;
                const precision = Number(this._maskService.maskExpression.slice(maskExpression.length - 1, maskExpression.length));
                if (precision > 1) {
                    el.value = this.suffix ? el.value.split(this.suffix).join('') : el.value;
                    const decimalPart = el.value.split(this.decimalMarker)[1];
                    el.value = el.value.includes(this.decimalMarker)
                        ? el.value +
                            "0" /* MaskExpression.NUMBER_ZERO */.repeat(precision - decimalPart.length) +
                            this.suffix
                        : el.value +
                            this.decimalMarker +
                            "0" /* MaskExpression.NUMBER_ZERO */.repeat(precision) +
                            this.suffix;
                    this._maskService.actualValue = el.value;
                }
            }
            this._maskService.clearIfNotMatchFn();
        }
        this._isFocused = false;
        this.onTouch();
    }
    onClick(e) {
        if (!this._maskValue) {
            return;
        }
        const el = e.target;
        const posStart = 0;
        const posEnd = 0;
        if (el !== null &&
            el.selectionStart !== null &&
            el.selectionStart === el.selectionEnd &&
            el.selectionStart > this._maskService.prefix.length &&
            // eslint-disable-next-line
            e.keyCode !== 38) {
            if (this._maskService.showMaskTyped && !this.keepCharacterPositions) {
                // We are showing the mask in the input
                this._maskService.maskIsShown = this._maskService.showMaskInInput();
                if (el.setSelectionRange &&
                    this._maskService.prefix + this._maskService.maskIsShown === el.value) {
                    // the input ONLY contains the mask, so position the cursor at the start
                    el.focus();
                    el.setSelectionRange(posStart, posEnd);
                }
                else {
                    // the input contains some characters already
                    if (el.selectionStart > this._maskService.actualValue.length) {
                        // if the user clicked beyond our value's length, position the cursor at the end of our value
                        el.setSelectionRange(this._maskService.actualValue.length, this._maskService.actualValue.length);
                    }
                }
            }
        }
        const nextValue = el &&
            (el.value === this._maskService.prefix
                ? this._maskService.prefix + this._maskService.maskIsShown
                : el.value);
        /** Fix of cursor position jumping to end in most browsers no matter where cursor is inserted onFocus */
        if (el && el.value !== nextValue) {
            el.value = nextValue;
        }
        /** fix of cursor position with prefix when mouse click occur */
        if (el &&
            el.type !== 'number' &&
            (el.selectionStart || el.selectionEnd) <=
                this._maskService.prefix.length) {
            el.selectionStart = this._maskService.prefix.length;
            return;
        }
        /** select only inserted text */
        if (el && el.selectionEnd > this._getActualInputLength()) {
            el.selectionEnd = this._getActualInputLength();
        }
    }
    // eslint-disable-next-line complexity
    onKeyDown(e) {
        if (!this._maskValue) {
            return;
        }
        if (this._isComposing) {
            // User finalize their choice from IME composition, so trigger onInput() for the composed text.
            if (e.key === 'Enter')
                this.onCompositionEnd(e);
            return;
        }
        this._code = e.code ? e.code : e.key;
        const el = e.target;
        this._inputValue = el.value;
        this._setMask();
        if (el.type !== 'number') {
            if (e.key === "ArrowUp" /* MaskExpression.ARROW_UP */) {
                e.preventDefault();
            }
            if (e.key === "ArrowLeft" /* MaskExpression.ARROW_LEFT */ ||
                e.key === "Backspace" /* MaskExpression.BACKSPACE */ ||
                e.key === "Delete" /* MaskExpression.DELETE */) {
                if (e.key === "Backspace" /* MaskExpression.BACKSPACE */ && el.value.length === 0) {
                    el.selectionStart = el.selectionEnd;
                }
                if (e.key === "Backspace" /* MaskExpression.BACKSPACE */ && el.selectionStart !== 0) {
                    // If specialChars is false, (shouldn't ever happen) then set to the defaults
                    this.specialCharacters = this.specialCharacters?.length
                        ? this.specialCharacters
                        : this._config.specialCharacters;
                    if (this.prefix.length > 1 &&
                        el.selectionStart <= this.prefix.length) {
                        el.setSelectionRange(this.prefix.length, el.selectionEnd);
                    }
                    else {
                        if (this._inputValue.length !== el.selectionStart &&
                            el.selectionStart !== 1) {
                            while (this.specialCharacters.includes((this._inputValue[el.selectionStart - 1] ??
                                "" /* MaskExpression.EMPTY_STRING */).toString()) &&
                                ((this.prefix.length >= 1 &&
                                    el.selectionStart > this.prefix.length) ||
                                    this.prefix.length === 0)) {
                                el.setSelectionRange(el.selectionStart - 1, el.selectionEnd);
                            }
                        }
                    }
                }
                this.checkSelectionOnDeletion(el);
                if (this._maskService.prefix.length &&
                    el.selectionStart <= this._maskService.prefix.length &&
                    el.selectionEnd <= this._maskService.prefix.length) {
                    e.preventDefault();
                }
                const cursorStart = el.selectionStart;
                if (e.key === "Backspace" /* MaskExpression.BACKSPACE */ &&
                    !el.readOnly &&
                    cursorStart === 0 &&
                    el.selectionEnd === el.value.length &&
                    el.value.length !== 0) {
                    this._position = this._maskService.prefix ? this._maskService.prefix.length : 0;
                    this._maskService.applyMask(this._maskService.prefix, this._maskService.maskExpression, this._position);
                }
            }
            if (!!this.suffix &&
                this.suffix.length > 1 &&
                this._inputValue.length - this.suffix.length < el.selectionStart) {
                el.setSelectionRange(this._inputValue.length - this.suffix.length, this._inputValue.length);
            }
            else if ((e.code === 'KeyA' && e.ctrlKey) ||
                (e.code === 'KeyA' && e.metaKey) // Cmd + A (Mac)
            ) {
                el.setSelectionRange(0, this._getActualInputLength());
                e.preventDefault();
            }
            this._maskService.selStart = el.selectionStart;
            this._maskService.selEnd = el.selectionEnd;
        }
    }
    /** It writes the value in the input */
    async writeValue(controlValue) {
        if (typeof controlValue === 'object' && controlValue !== null && 'value' in controlValue) {
            if ('disable' in controlValue) {
                this.setDisabledState(Boolean(controlValue.disable));
            }
            // eslint-disable-next-line no-param-reassign
            controlValue = controlValue.value;
        }
        if (controlValue !== null) {
            // eslint-disable-next-line no-param-reassign
            controlValue = this.inputTransformFn
                ? this.inputTransformFn(controlValue)
                : controlValue;
        }
        if (typeof controlValue === 'string' ||
            typeof controlValue === 'number' ||
            controlValue === null ||
            controlValue === undefined) {
            if (controlValue === null || controlValue === undefined || controlValue === '') {
                this._maskService._currentValue = '';
                this._maskService._previousValue = '';
            }
            // eslint-disable-next-line no-param-reassign
            let inputValue = controlValue;
            if (typeof inputValue === 'number' ||
                this._maskValue.startsWith("separator" /* MaskExpression.SEPARATOR */)) {
                // eslint-disable-next-line no-param-reassign
                inputValue = String(inputValue);
                const localeDecimalMarker = this._maskService.currentLocaleDecimalMarker();
                if (!Array.isArray(this._maskService.decimalMarker)) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue =
                        this._maskService.decimalMarker !== localeDecimalMarker
                            ? inputValue.replace(localeDecimalMarker, this._maskService.decimalMarker)
                            : inputValue;
                }
                if (Array.isArray(this._maskService.decimalMarker) &&
                    this.decimalMarker === "." /* MaskExpression.DOT */) {
                    this._maskService.decimalMarker = "," /* MaskExpression.COMMA */;
                }
                if (this._maskService.leadZero &&
                    inputValue &&
                    this.maskExpression &&
                    this.dropSpecialCharacters !== false) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = this._maskService._checkPrecision(this._maskService.maskExpression, inputValue);
                }
                if (this._maskService.decimalMarker === "," /* MaskExpression.COMMA */) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = inputValue
                        .toString()
                        .replace("." /* MaskExpression.DOT */, "," /* MaskExpression.COMMA */);
                }
                if (this.maskExpression?.startsWith("separator" /* MaskExpression.SEPARATOR */) && this.leadZero) {
                    requestAnimationFrame(() => {
                        this._maskService.applyMask(inputValue?.toString() ?? '', this._maskService.maskExpression);
                    });
                }
                this._maskService.isNumberValue = true;
            }
            if (typeof inputValue !== 'string') {
                // eslint-disable-next-line no-param-reassign
                inputValue = '';
            }
            this._inputValue = inputValue;
            this._setMask();
            if ((inputValue && this._maskService.maskExpression) ||
                (this._maskService.maskExpression &&
                    (this._maskService.prefix || this._maskService.showMaskTyped))) {
                // Let the service we know we are writing value so that triggering onChange function won't happen during applyMask
                typeof this.inputTransformFn !== 'function'
                    ? (this._maskService.writingValue = true)
                    : '';
                this._maskService.formElementProperty = [
                    'value',
                    this._maskService.applyMask(inputValue, this._maskService.maskExpression),
                ];
                // Let the service know we've finished writing value
                typeof this.inputTransformFn !== 'function'
                    ? (this._maskService.writingValue = false)
                    : '';
            }
            else {
                this._maskService.formElementProperty = ['value', inputValue];
            }
            this._inputValue = inputValue;
        }
        else {
            console.warn('Ngx-mask writeValue work with string | number, your current value:', typeof controlValue);
        }
    }
    registerOnChange(fn) {
        this._maskService.onChange = this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouch = fn;
    }
    _getActiveElement(document = this.document) {
        const shadowRootEl = document?.activeElement?.shadowRoot;
        if (!shadowRootEl?.activeElement) {
            return document.activeElement;
        }
        else {
            return this._getActiveElement(shadowRootEl);
        }
    }
    checkSelectionOnDeletion(el) {
        el.selectionStart = Math.min(Math.max(this.prefix.length, el.selectionStart), this._inputValue.length - this.suffix.length);
        el.selectionEnd = Math.min(Math.max(this.prefix.length, el.selectionEnd), this._inputValue.length - this.suffix.length);
    }
    /** It disables the input element */
    setDisabledState(isDisabled) {
        this._maskService.formElementProperty = ['disabled', isDisabled];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _applyMask() {
        this._maskService.maskExpression = this._maskService._repeatPatternSymbols(this._maskValue || '');
        this._maskService.formElementProperty = [
            'value',
            this._maskService.applyMask(this._inputValue, this._maskService.maskExpression),
        ];
    }
    _validateTime(value) {
        const rowMaskLen = this._maskValue
            .split("" /* MaskExpression.EMPTY_STRING */)
            .filter((s) => s !== ':').length;
        if (!value) {
            return null; // Don't validate empty values to allow for optional form control
        }
        if ((+(value[value.length - 1] ?? -1) === 0 && value.length < rowMaskLen) ||
            value.length <= rowMaskLen - 2) {
            return this._createValidationError(value);
        }
        return null;
    }
    _getActualInputLength() {
        return (this._maskService.actualValue.length ||
            this._maskService.actualValue.length + this._maskService.prefix.length);
    }
    _createValidationError(actualValue) {
        return {
            mask: {
                requiredMask: this._maskValue,
                actualValue,
            },
        };
    }
    _setMask() {
        this._maskExpressionArray.some((mask) => {
            const specialChart = mask
                .split("" /* MaskExpression.EMPTY_STRING */)
                .some((char) => this._maskService.specialCharacters.includes(char));
            if ((specialChart && this._inputValue && !mask.includes("S" /* MaskExpression.LETTER_S */)) ||
                mask.includes("{" /* MaskExpression.CURLY_BRACKETS_LEFT */)) {
                const test = this._maskService.removeMask(this._inputValue)?.length <=
                    this._maskService.removeMask(mask)?.length;
                if (test) {
                    this._maskValue =
                        this.maskExpression =
                            this._maskService.maskExpression =
                                mask.includes("{" /* MaskExpression.CURLY_BRACKETS_LEFT */)
                                    ? this._maskService._repeatPatternSymbols(mask)
                                    : mask;
                    return test;
                }
                else {
                    const expression = this._maskExpressionArray[this._maskExpressionArray.length - 1] ??
                        "" /* MaskExpression.EMPTY_STRING */;
                    this._maskValue =
                        this.maskExpression =
                            this._maskService.maskExpression =
                                expression.includes("{" /* MaskExpression.CURLY_BRACKETS_LEFT */)
                                    ? this._maskService._repeatPatternSymbols(expression)
                                    : expression;
                }
            }
            else {
                const check = this._maskService
                    .removeMask(this._inputValue)
                    ?.split("" /* MaskExpression.EMPTY_STRING */)
                    .every((character, index) => {
                    const indexMask = mask.charAt(index);
                    return this._maskService._checkSymbolMask(character, indexMask);
                });
                if (check) {
                    this._maskValue = this.maskExpression = this._maskService.maskExpression = mask;
                    return check;
                }
            }
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.3.4", type: NgxMaskDirective, isStandalone: true, selector: "input[mask], textarea[mask]", inputs: { maskExpression: ["mask", "maskExpression"], specialCharacters: "specialCharacters", patterns: "patterns", prefix: "prefix", suffix: "suffix", thousandSeparator: "thousandSeparator", decimalMarker: "decimalMarker", dropSpecialCharacters: "dropSpecialCharacters", hiddenInput: "hiddenInput", showMaskTyped: "showMaskTyped", placeHolderCharacter: "placeHolderCharacter", shownMaskExpression: "shownMaskExpression", showTemplate: "showTemplate", clearIfNotMatch: "clearIfNotMatch", validation: "validation", separatorLimit: "separatorLimit", allowNegativeNumbers: "allowNegativeNumbers", leadZeroDateTime: "leadZeroDateTime", leadZero: "leadZero", triggerOnMaskChange: "triggerOnMaskChange", apm: "apm", inputTransformFn: "inputTransformFn", outputTransformFn: "outputTransformFn", keepCharacterPositions: "keepCharacterPositions" }, outputs: { maskFilled: "maskFilled" }, host: { listeners: { "paste": "onPaste()", "focus": "onFocus($event)", "ngModelChange": "onModelChange($event)", "input": "onInput($event)", "compositionstart": "onCompositionStart($event)", "compositionend": "onCompositionEnd($event)", "blur": "onBlur($event)", "click": "onClick($event)", "keydown": "onKeyDown($event)" } }, providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: NgxMaskDirective,
                multi: true,
            },
            {
                provide: NG_VALIDATORS,
                useExisting: NgxMaskDirective,
                multi: true,
            },
            NgxMaskService,
        ], exportAs: ["mask", "ngxMask"], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'input[mask], textarea[mask]',
                    standalone: true,
                    providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: NgxMaskDirective,
                            multi: true,
                        },
                        {
                            provide: NG_VALIDATORS,
                            useExisting: NgxMaskDirective,
                            multi: true,
                        },
                        NgxMaskService,
                    ],
                    exportAs: 'mask,ngxMask',
                }]
        }], propDecorators: { maskExpression: [{
                type: Input,
                args: ['mask']
            }], specialCharacters: [{
                type: Input
            }], patterns: [{
                type: Input
            }], prefix: [{
                type: Input
            }], suffix: [{
                type: Input
            }], thousandSeparator: [{
                type: Input
            }], decimalMarker: [{
                type: Input
            }], dropSpecialCharacters: [{
                type: Input
            }], hiddenInput: [{
                type: Input
            }], showMaskTyped: [{
                type: Input
            }], placeHolderCharacter: [{
                type: Input
            }], shownMaskExpression: [{
                type: Input
            }], showTemplate: [{
                type: Input
            }], clearIfNotMatch: [{
                type: Input
            }], validation: [{
                type: Input
            }], separatorLimit: [{
                type: Input
            }], allowNegativeNumbers: [{
                type: Input
            }], leadZeroDateTime: [{
                type: Input
            }], leadZero: [{
                type: Input
            }], triggerOnMaskChange: [{
                type: Input
            }], apm: [{
                type: Input
            }], inputTransformFn: [{
                type: Input
            }], outputTransformFn: [{
                type: Input
            }], keepCharacterPositions: [{
                type: Input
            }], maskFilled: [{
                type: Output
            }], onPaste: [{
                type: HostListener,
                args: ['paste']
            }], onFocus: [{
                type: HostListener,
                args: ['focus', ['$event']]
            }], onModelChange: [{
                type: HostListener,
                args: ['ngModelChange', ['$event']]
            }], onInput: [{
                type: HostListener,
                args: ['input', ['$event']]
            }], onCompositionStart: [{
                type: HostListener,
                args: ['compositionstart', ['$event']]
            }], onCompositionEnd: [{
                type: HostListener,
                args: ['compositionend', ['$event']]
            }], onBlur: [{
                type: HostListener,
                args: ['blur', ['$event']]
            }], onClick: [{
                type: HostListener,
                args: ['click', ['$event']]
            }], onKeyDown: [{
                type: HostListener,
                args: ['keydown', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LW1hc2suZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LW1hc2stbGliL3NyYy9saWIvbmd4LW1hc2suZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMzQyxPQUFPLEVBQ0gsU0FBUyxFQUNULFlBQVksRUFDWixZQUFZLEVBQ1osS0FBSyxFQUVMLE1BQU0sRUFFTixNQUFNLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUdILGFBQWEsRUFDYixpQkFBaUIsR0FHcEIsTUFBTSxnQkFBZ0IsQ0FBQztBQUd4QixPQUFPLEVBQVcsZUFBZSxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzNGLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQzs7QUFxQnBELE1BQU0sT0FBTyxnQkFBZ0I7SUFsQjdCO1FBbUJJLDJEQUEyRDtRQUNyQyxtQkFBYyxHQUE4QixFQUFFLENBQUM7UUFFckQsc0JBQWlCLEdBQWlDLEVBQUUsQ0FBQztRQUVyRCxhQUFRLEdBQXdCLEVBQUUsQ0FBQztRQUVuQyxXQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUUvQixXQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUUvQixzQkFBaUIsR0FBaUMsR0FBRyxDQUFDO1FBRXRELGtCQUFhLEdBQTZCLEdBQUcsQ0FBQztRQUU5QywwQkFBcUIsR0FBNEMsSUFBSSxDQUFDO1FBRXRFLGdCQUFXLEdBQWtDLElBQUksQ0FBQztRQUVsRCxrQkFBYSxHQUFvQyxJQUFJLENBQUM7UUFFdEQseUJBQW9CLEdBQTJDLElBQUksQ0FBQztRQUVwRSx3QkFBbUIsR0FBMEMsSUFBSSxDQUFDO1FBRWxFLGlCQUFZLEdBQW1DLElBQUksQ0FBQztRQUVwRCxvQkFBZSxHQUFzQyxJQUFJLENBQUM7UUFF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VSxnQkFBZ0I7c0JBQS9CLEtBQUs7Z0JBRVUsaUJBQWlCO3NCQUFoQyxLQUFLO2dCQUVVLHNCQUFzQjtzQkFBckMsS0FBSztnQkFFVyxVQUFVO3NCQUExQixNQUFNO2dCQW9UQSxPQUFPO3NCQURiLFlBQVk7dUJBQUMsT0FBTztnQkFLcUIsT0FBTztzQkFBaEQsWUFBWTt1QkFBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBSzFCLGFBQWE7c0JBRG5CLFlBQVk7dUJBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQWNsQyxPQUFPO3NCQURiLFlBQVk7dUJBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQXdQMUIsa0JBQWtCO3NCQUR4QixZQUFZO3VCQUFDLGtCQUFrQixFQUFFLENBQUMsUUFBUSxDQUFDO2dCQU9yQyxnQkFBZ0I7c0JBRHRCLFlBQVk7dUJBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBUW5DLE1BQU07c0JBRFosWUFBWTt1QkFBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBaUN6QixPQUFPO3NCQURiLFlBQVk7dUJBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQW9FMUIsU0FBUztzQkFEZixZQUFZO3VCQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERPQ1VNRU5UIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gICAgRGlyZWN0aXZlLFxuICAgIEV2ZW50RW1pdHRlcixcbiAgICBIb3N0TGlzdGVuZXIsXG4gICAgSW5wdXQsXG4gICAgT25DaGFuZ2VzLFxuICAgIE91dHB1dCxcbiAgICBTaW1wbGVDaGFuZ2VzLFxuICAgIGluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICAgIENvbnRyb2xWYWx1ZUFjY2Vzc29yLFxuICAgIEZvcm1Db250cm9sLFxuICAgIE5HX1ZBTElEQVRPUlMsXG4gICAgTkdfVkFMVUVfQUNDRVNTT1IsXG4gICAgVmFsaWRhdGlvbkVycm9ycyxcbiAgICBWYWxpZGF0b3IsXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcblxuaW1wb3J0IHsgQ3VzdG9tS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4vY3VzdG9tLWtleWJvYXJkLWV2ZW50JztcbmltcG9ydCB7IElDb25maWcsIE5HWF9NQVNLX0NPTkZJRywgdGltZU1hc2tzLCB3aXRob3V0VmFsaWRhdGlvbiB9IGZyb20gJy4vbmd4LW1hc2suY29uZmlnJztcbmltcG9ydCB7IE5neE1hc2tTZXJ2aWNlIH0gZnJvbSAnLi9uZ3gtbWFzay5zZXJ2aWNlJztcbmltcG9ydCB7IE1hc2tFeHByZXNzaW9uIH0gZnJvbSAnLi9uZ3gtbWFzay1leHByZXNzaW9uLmVudW0nO1xuXG5ARGlyZWN0aXZlKHtcbiAgICBzZWxlY3RvcjogJ2lucHV0W21hc2tdLCB0ZXh0YXJlYVttYXNrXScsXG4gICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgICBwcm92aWRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgcHJvdmlkZTogTkdfVkFMVUVfQUNDRVNTT1IsXG4gICAgICAgICAgICB1c2VFeGlzdGluZzogTmd4TWFza0RpcmVjdGl2ZSxcbiAgICAgICAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBwcm92aWRlOiBOR19WQUxJREFUT1JTLFxuICAgICAgICAgICAgdXNlRXhpc3Rpbmc6IE5neE1hc2tEaXJlY3RpdmUsXG4gICAgICAgICAgICBtdWx0aTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgTmd4TWFza1NlcnZpY2UsXG4gICAgXSxcbiAgICBleHBvcnRBczogJ21hc2ssbmd4TWFzaycsXG59KVxuZXhwb3J0IGNsYXNzIE5neE1hc2tEaXJlY3RpdmUgaW1wbGVtZW50cyBDb250cm9sVmFsdWVBY2Nlc3NvciwgT25DaGFuZ2VzLCBWYWxpZGF0b3Ige1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAYW5ndWxhci1lc2xpbnQvbm8taW5wdXQtcmVuYW1lXG4gICAgQElucHV0KCdtYXNrJykgcHVibGljIG1hc2tFeHByZXNzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsID0gJyc7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgc3BlY2lhbENoYXJhY3RlcnM6IElDb25maWdbJ3NwZWNpYWxDaGFyYWN0ZXJzJ10gPSBbXTtcblxuICAgIEBJbnB1dCgpIHB1YmxpYyBwYXR0ZXJuczogSUNvbmZpZ1sncGF0dGVybnMnXSA9IHt9O1xuXG4gICAgQElucHV0KCkgcHVibGljIHByZWZpeDogSUNvbmZpZ1sncHJlZml4J10gPSAnJztcblxuICAgIEBJbnB1dCgpIHB1YmxpYyBzdWZmaXg6IElDb25maWdbJ3N1ZmZpeCddID0gJyc7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgdGhvdXNhbmRTZXBhcmF0b3I6IElDb25maWdbJ3Rob3VzYW5kU2VwYXJhdG9yJ10gPSAnICc7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgZGVjaW1hbE1hcmtlcjogSUNvbmZpZ1snZGVjaW1hbE1hcmtlciddID0gJy4nO1xuXG4gICAgQElucHV0KCkgcHVibGljIGRyb3BTcGVjaWFsQ2hhcmFjdGVyczogSUNvbmZpZ1snZHJvcFNwZWNpYWxDaGFyYWN0ZXJzJ10gfCBudWxsID0gbnVsbDtcblxuICAgIEBJbnB1dCgpIHB1YmxpYyBoaWRkZW5JbnB1dDogSUNvbmZpZ1snaGlkZGVuSW5wdXQnXSB8IG51bGwgPSBudWxsO1xuXG4gICAgQElucHV0KCkgcHVibGljIHNob3dNYXNrVHlwZWQ6IElDb25maWdbJ3Nob3dNYXNrVHlwZWQnXSB8IG51bGwgPSBudWxsO1xuXG4gICAgQElucHV0KCkgcHVibGljIHBsYWNlSG9sZGVyQ2hhcmFjdGVyOiBJQ29uZmlnWydwbGFjZUhvbGRlckNoYXJhY3RlciddIHwgbnVsbCA9IG51bGw7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgc2hvd25NYXNrRXhwcmVzc2lvbjogSUNvbmZpZ1snc2hvd25NYXNrRXhwcmVzc2lvbiddIHwgbnVsbCA9IG51bGw7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgc2hvd1RlbXBsYXRlOiBJQ29uZmlnWydzaG93VGVtcGxhdGUnXSB8IG51bGwgPSBudWxsO1xuXG4gICAgQElucHV0KCkgcHVibGljIGNsZWFySWZOb3RNYXRjaDogSUNvbmZpZ1snY2xlYXJJZk5vdE1hdGNoJ10gfCBudWxsID0gbnVsbDtcblxuICAgIEBJbnB1dCgpIHB1YmxpYyB2YWxpZGF0aW9uOiBJQ29uZmlnWyd2YWxpZGF0aW9uJ10gfCBudWxsID0gbnVsbDtcblxuICAgIEBJbnB1dCgpIHB1YmxpYyBzZXBhcmF0b3JMaW1pdDogSUNvbmZpZ1snc2VwYXJhdG9yTGltaXQnXSB8IG51bGwgPSBudWxsO1xuXG4gICAgQElucHV0KCkgcHVibGljIGFsbG93TmVnYXRpdmVOdW1iZXJzOiBJQ29uZmlnWydhbGxvd05lZ2F0aXZlTnVtYmVycyddIHwgbnVsbCA9IG51bGw7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgbGVhZFplcm9EYXRlVGltZTogSUNvbmZpZ1snbGVhZFplcm9EYXRlVGltZSddIHwgbnVsbCA9IG51bGw7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgbGVhZFplcm86IElDb25maWdbJ2xlYWRaZXJvJ10gfCBudWxsID0gbnVsbDtcblxuICAgIEBJbnB1dCgpIHB1YmxpYyB0cmlnZ2VyT25NYXNrQ2hhbmdlOiBJQ29uZmlnWyd0cmlnZ2VyT25NYXNrQ2hhbmdlJ10gfCBudWxsID0gbnVsbDtcblxuICAgIEBJbnB1dCgpIHB1YmxpYyBhcG06IElDb25maWdbJ2FwbSddIHwgbnVsbCA9IG51bGw7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgaW5wdXRUcmFuc2Zvcm1GbjogSUNvbmZpZ1snaW5wdXRUcmFuc2Zvcm1GbiddIHwgbnVsbCA9IG51bGw7XG5cbiAgICBASW5wdXQoKSBwdWJsaWMgb3V0cHV0VHJhbnNmb3JtRm46IElDb25maWdbJ291dHB1dFRyYW5zZm9ybUZuJ10gfCBudWxsID0gbnVsbDtcblxuICAgIEBJbnB1dCgpIHB1YmxpYyBrZWVwQ2hhcmFjdGVyUG9zaXRpb25zOiBJQ29uZmlnWydrZWVwQ2hhcmFjdGVyUG9zaXRpb25zJ10gfCBudWxsID0gbnVsbDtcblxuICAgIEBPdXRwdXQoKSBwdWJsaWMgbWFza0ZpbGxlZDogSUNvbmZpZ1snbWFza0ZpbGxlZCddID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gICAgcHJpdmF0ZSBfbWFza1ZhbHVlID0gJyc7XG5cbiAgICBwcml2YXRlIF9pbnB1dFZhbHVlITogc3RyaW5nO1xuXG4gICAgcHJpdmF0ZSBfcG9zaXRpb246IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBfY29kZSE6IHN0cmluZztcblxuICAgIHByaXZhdGUgX21hc2tFeHByZXNzaW9uQXJyYXk6IHN0cmluZ1tdID0gW107XG5cbiAgICBwcml2YXRlIF9qdXN0UGFzdGVkID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIF9pc0ZvY3VzZWQgPSBmYWxzZTtcblxuICAgIC8qKkZvciBJTUUgY29tcG9zaXRpb24gZXZlbnQgKi9cbiAgICBwcml2YXRlIF9pc0NvbXBvc2luZyA9IGZhbHNlO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBkb2N1bWVudCA9IGluamVjdChET0NVTUVOVCk7XG5cbiAgICBwdWJsaWMgX21hc2tTZXJ2aWNlID0gaW5qZWN0KE5neE1hc2tTZXJ2aWNlLCB7IHNlbGY6IHRydWUgfSk7XG5cbiAgICBwcm90ZWN0ZWQgX2NvbmZpZyA9IGluamVjdDxJQ29uZmlnPihOR1hfTUFTS19DT05GSUcpO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvbiwgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIHB1YmxpYyBvbkNoYW5nZSA9IChfOiBhbnkpID0+IHt9O1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvblxuICAgIHB1YmxpYyBvblRvdWNoID0gKCkgPT4ge307XG5cbiAgICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBtYXNrRXhwcmVzc2lvbixcbiAgICAgICAgICAgIHNwZWNpYWxDaGFyYWN0ZXJzLFxuICAgICAgICAgICAgcGF0dGVybnMsXG4gICAgICAgICAgICBwcmVmaXgsXG4gICAgICAgICAgICBzdWZmaXgsXG4gICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRvcixcbiAgICAgICAgICAgIGRlY2ltYWxNYXJrZXIsXG4gICAgICAgICAgICBkcm9wU3BlY2lhbENoYXJhY3RlcnMsXG4gICAgICAgICAgICBoaWRkZW5JbnB1dCxcbiAgICAgICAgICAgIHNob3dNYXNrVHlwZWQsXG4gICAgICAgICAgICBwbGFjZUhvbGRlckNoYXJhY3RlcixcbiAgICAgICAgICAgIHNob3duTWFza0V4cHJlc3Npb24sXG4gICAgICAgICAgICBzaG93VGVtcGxhdGUsXG4gICAgICAgICAgICBjbGVhcklmTm90TWF0Y2gsXG4gICAgICAgICAgICB2YWxpZGF0aW9uLFxuICAgICAgICAgICAgc2VwYXJhdG9yTGltaXQsXG4gICAgICAgICAgICBhbGxvd05lZ2F0aXZlTnVtYmVycyxcbiAgICAgICAgICAgIGxlYWRaZXJvRGF0ZVRpbWUsXG4gICAgICAgICAgICBsZWFkWmVybyxcbiAgICAgICAgICAgIHRyaWdnZXJPbk1hc2tDaGFuZ2UsXG4gICAgICAgICAgICBhcG0sXG4gICAgICAgICAgICBpbnB1dFRyYW5zZm9ybUZuLFxuICAgICAgICAgICAgb3V0cHV0VHJhbnNmb3JtRm4sXG4gICAgICAgICAgICBrZWVwQ2hhcmFjdGVyUG9zaXRpb25zLFxuICAgICAgICB9ID0gY2hhbmdlcztcbiAgICAgICAgaWYgKG1hc2tFeHByZXNzaW9uKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlICE9PSBtYXNrRXhwcmVzc2lvbi5wcmV2aW91c1ZhbHVlICYmXG4gICAgICAgICAgICAgICAgIW1hc2tFeHByZXNzaW9uLmZpcnN0Q2hhbmdlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlICYmXG4gICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlLnNwbGl0KE1hc2tFeHByZXNzaW9uLk9SKS5sZW5ndGggPiAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5ID0gbWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChNYXNrRXhwcmVzc2lvbi5PUilcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0TWFzaygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1ZhbHVlID0gbWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlIHx8IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORztcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiA9IHRoaXMuX21hc2tWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BlY2lhbENoYXJhY3RlcnMpIHtcbiAgICAgICAgICAgIGlmICghc3BlY2lhbENoYXJhY3RlcnMuY3VycmVudFZhbHVlIHx8ICFBcnJheS5pc0FycmF5KHNwZWNpYWxDaGFyYWN0ZXJzLmN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnNwZWNpYWxDaGFyYWN0ZXJzID0gc3BlY2lhbENoYXJhY3RlcnMuY3VycmVudFZhbHVlIHx8IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd05lZ2F0aXZlTnVtYmVycykge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYWxsb3dOZWdhdGl2ZU51bWJlcnMgPSBhbGxvd05lZ2F0aXZlTnVtYmVycy5jdXJyZW50VmFsdWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWFza1NlcnZpY2UuYWxsb3dOZWdhdGl2ZU51bWJlcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5zcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuX21hc2tTZXJ2aWNlLnNwZWNpYWxDaGFyYWN0ZXJzLmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgKGM6IHN0cmluZykgPT4gYyAhPT0gTWFza0V4cHJlc3Npb24uTUlOVVNcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE9ubHkgb3ZlcndyaXRlIHRoZSBtYXNrIGF2YWlsYWJsZSBwYXR0ZXJucyBpZiBhIHBhdHRlcm4gaGFzIGFjdHVhbGx5IGJlZW4gcGFzc2VkIGluXG4gICAgICAgIGlmIChwYXR0ZXJucyAmJiBwYXR0ZXJucy5jdXJyZW50VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnBhdHRlcm5zID0gcGF0dGVybnMuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcG0gJiYgYXBtLmN1cnJlbnRWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYXBtID0gYXBtLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJlZml4KSB7XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXggPSBwcmVmaXguY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdWZmaXgpIHtcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnN1ZmZpeCA9IHN1ZmZpeC5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRob3VzYW5kU2VwYXJhdG9yKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS50aG91c2FuZFNlcGFyYXRvciA9IHRob3VzYW5kU2VwYXJhdG9yLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVjaW1hbE1hcmtlcikge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuZGVjaW1hbE1hcmtlciA9IGRlY2ltYWxNYXJrZXIuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkcm9wU3BlY2lhbENoYXJhY3RlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmRyb3BTcGVjaWFsQ2hhcmFjdGVycyA9IGRyb3BTcGVjaWFsQ2hhcmFjdGVycy5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhpZGRlbklucHV0KSB7XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5oaWRkZW5JbnB1dCA9IGhpZGRlbklucHV0LmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvd01hc2tUeXBlZCkge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2Uuc2hvd01hc2tUeXBlZCA9IHNob3dNYXNrVHlwZWQuY3VycmVudFZhbHVlO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHNob3dNYXNrVHlwZWQucHJldmlvdXNWYWx1ZSA9PT0gZmFsc2UgJiZcbiAgICAgICAgICAgICAgICBzaG93TWFza1R5cGVkLmN1cnJlbnRWYWx1ZSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgICAgIHRoaXMuX2lzRm9jdXNlZFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuX2VsZW1lbnRSZWY/Lm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGxhY2VIb2xkZXJDaGFyYWN0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnBsYWNlSG9sZGVyQ2hhcmFjdGVyID0gcGxhY2VIb2xkZXJDaGFyYWN0ZXIuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaG93bk1hc2tFeHByZXNzaW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5zaG93bk1hc2tFeHByZXNzaW9uID0gc2hvd25NYXNrRXhwcmVzc2lvbi5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNob3dUZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2Uuc2hvd1RlbXBsYXRlID0gc2hvd1RlbXBsYXRlLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2xlYXJJZk5vdE1hdGNoKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5jbGVhcklmTm90TWF0Y2ggPSBjbGVhcklmTm90TWF0Y2guY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWxpZGF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS52YWxpZGF0aW9uID0gdmFsaWRhdGlvbi5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlcGFyYXRvckxpbWl0KSB7XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5zZXBhcmF0b3JMaW1pdCA9IHNlcGFyYXRvckxpbWl0LmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVhZFplcm9EYXRlVGltZSkge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubGVhZFplcm9EYXRlVGltZSA9IGxlYWRaZXJvRGF0ZVRpbWUuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFkWmVybykge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubGVhZFplcm8gPSBsZWFkWmVyby5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyaWdnZXJPbk1hc2tDaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnRyaWdnZXJPbk1hc2tDaGFuZ2UgPSB0cmlnZ2VyT25NYXNrQ2hhbmdlLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXRUcmFuc2Zvcm1Gbikge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuaW5wdXRUcmFuc2Zvcm1GbiA9IGlucHV0VHJhbnNmb3JtRm4uY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvdXRwdXRUcmFuc2Zvcm1Gbikge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2Uub3V0cHV0VHJhbnNmb3JtRm4gPSBvdXRwdXRUcmFuc2Zvcm1Gbi5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtlZXBDaGFyYWN0ZXJQb3NpdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmtlZXBDaGFyYWN0ZXJQb3NpdGlvbnMgPSBrZWVwQ2hhcmFjdGVyUG9zaXRpb25zLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hcHBseU1hc2soKTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICAgIHB1YmxpYyB2YWxpZGF0ZSh7IHZhbHVlIH06IEZvcm1Db250cm9sKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwge1xuICAgICAgICBpZiAoIXRoaXMuX21hc2tTZXJ2aWNlLnZhbGlkYXRpb24gfHwgIXRoaXMuX21hc2tWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX21hc2tTZXJ2aWNlLmlwRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9tYXNrU2VydmljZS5jcGZDbnBqRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9tYXNrVmFsdWUuc3RhcnRzV2l0aChNYXNrRXhwcmVzc2lvbi5TRVBBUkFUT1IpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAod2l0aG91dFZhbGlkYXRpb24uaW5jbHVkZXModGhpcy5fbWFza1ZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX21hc2tTZXJ2aWNlLmNsZWFySWZOb3RNYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRpbWVNYXNrcy5pbmNsdWRlcyh0aGlzLl9tYXNrVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGVUaW1lKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgbGV0IGNvdW50ZXJPZk9wdCA9IDA7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWFza1ZhbHVlLnN0YXJ0c1dpdGgoTWFza0V4cHJlc3Npb24uUEVSQ0VOVCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuX21hc2tTZXJ2aWNlLnBhdHRlcm5zKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21hc2tTZXJ2aWNlLnBhdHRlcm5zW2tleV0/Lm9wdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihrZXkpICE9PSB0aGlzLl9tYXNrVmFsdWUubGFzdEluZGV4T2Yoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0OiBzdHJpbmcgPSB0aGlzLl9tYXNrVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGk6IHN0cmluZykgPT4gaSA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVyT2ZPcHQgKz0gb3B0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihrZXkpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlck9mT3B0Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1ZhbHVlLmluZGV4T2Yoa2V5KSAhPT0gLTEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoID49IHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKGtleSlcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY291bnRlck9mT3B0ID09PSB0aGlzLl9tYXNrVmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihNYXNrRXhwcmVzc2lvbi5DVVJMWV9CUkFDS0VUU19MRUZUKSA9PT0gMSAmJlxuICAgICAgICAgICAgICAgIHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoID09PVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUubGVuZ3RoICtcbiAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tWYWx1ZS5zcGxpdChNYXNrRXhwcmVzc2lvbi5DVVJMWV9CUkFDS0VUU19MRUZUKVsxXSA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApLnNwbGl0KE1hc2tFeHByZXNzaW9uLkNVUkxZX0JSQUNLRVRTX1JJR0hUKVswXVxuICAgICAgICAgICAgICAgICAgICAgICAgKSAtXG4gICAgICAgICAgICAgICAgICAgICAgICA0XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgKHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKE1hc2tFeHByZXNzaW9uLlNZTUJPTF9TVEFSKSA+IDEgJiZcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoTWFza0V4cHJlc3Npb24uU1lNQk9MX1NUQVIpKSB8fFxuICAgICAgICAgICAgICAgICh0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihNYXNrRXhwcmVzc2lvbi5TWU1CT0xfUVVFU1RJT04pID4gMSAmJlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA8XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihNYXNrRXhwcmVzc2lvbi5TWU1CT0xfUVVFU1RJT04pKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKE1hc2tFeHByZXNzaW9uLkNVUkxZX0JSQUNLRVRTX0xFRlQpID09PSAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlVmFsaWRhdGlvbkVycm9yKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihNYXNrRXhwcmVzc2lvbi5TWU1CT0xfU1RBUikgPT09IC0xIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoTWFza0V4cHJlc3Npb24uU1lNQk9MX1FVRVNUSU9OKSA9PT0gLTFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/IFN0cmluZyh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnJheSA9IHRoaXMuX21hc2tWYWx1ZS5zcGxpdCgnKicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxlbmd0aDogbnVtYmVyID0gdGhpcy5fbWFza1NlcnZpY2UuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzXG4gICAgICAgICAgICAgICAgICAgID8gdGhpcy5fbWFza1ZhbHVlLmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuY2hlY2tEcm9wU3BlY2lhbENoYXJBbW91bnQodGhpcy5fbWFza1ZhbHVlKSAtXG4gICAgICAgICAgICAgICAgICAgICAgY291bnRlck9mT3B0XG4gICAgICAgICAgICAgICAgICAgIDogdGhpcy5wcmVmaXhcbiAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuX21hc2tWYWx1ZS5sZW5ndGggKyB0aGlzLnByZWZpeC5sZW5ndGggLSBjb3VudGVyT2ZPcHRcbiAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuX21hc2tWYWx1ZS5sZW5ndGggLSBjb3VudGVyT2ZPcHQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJyYXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZVZhbGlkYXRpb25FcnJvcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFycmF5Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFzdEluZGV4QXJyYXkgPSBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4QXJyYXkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGxhc3RJbmRleEFycmF5WzBdIGFzIHN0cmluZykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0cmluZyh2YWx1ZSkuaW5jbHVkZXMobGFzdEluZGV4QXJyYXlbMF0gPz8gJycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGVjaWFsID0gdmFsdWUuc3BsaXQobGFzdEluZGV4QXJyYXlbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwZWNpYWxbc3BlY2lhbC5sZW5ndGggLSAxXS5sZW5ndGggPT09IGxhc3RJbmRleEFycmF5Lmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuX2NyZWF0ZVZhbGlkYXRpb25FcnJvcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAoKGxhc3RJbmRleEFycmF5ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIXRoaXMuX21hc2tTZXJ2aWNlLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXhBcnJheVswXSBhcyBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFsYXN0SW5kZXhBcnJheSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmRyb3BTcGVjaWFsQ2hhcmFjdGVycykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLmxlbmd0aCA+PSBsZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlVmFsaWRhdGlvbkVycm9yKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihNYXNrRXhwcmVzc2lvbi5TWU1CT0xfU1RBUikgPT09IDEgfHxcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZihNYXNrRXhwcmVzc2lvbi5TWU1CT0xfUVVFU1RJT04pID09PSAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMubWFza0ZpbGxlZC5lbWl0KCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBASG9zdExpc3RlbmVyKCdwYXN0ZScpXG4gICAgcHVibGljIG9uUGFzdGUoKSB7XG4gICAgICAgIHRoaXMuX2p1c3RQYXN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIEBIb3N0TGlzdGVuZXIoJ2ZvY3VzJywgWyckZXZlbnQnXSkgcHVibGljIG9uRm9jdXMoKSB7XG4gICAgICAgIHRoaXMuX2lzRm9jdXNlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgQEhvc3RMaXN0ZW5lcignbmdNb2RlbENoYW5nZScsIFsnJGV2ZW50J10pXG4gICAgcHVibGljIG9uTW9kZWxDaGFuZ2UodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwgfCBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgLy8gb24gZm9ybSByZXNldCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgYWN0dWFsVmFsdWVcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgKHZhbHVlID09PSBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgJiZcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUgPSB0aGlzLl9tYXNrU2VydmljZS5nZXRBY3R1YWxWYWx1ZShcbiAgICAgICAgICAgICAgICBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBASG9zdExpc3RlbmVyKCdpbnB1dCcsIFsnJGV2ZW50J10pXG4gICAgcHVibGljIG9uSW5wdXQoZTogQ3VzdG9tS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgICAgICAvLyBJZiBJTUUgaXMgY29tcG9zaW5nIHRleHQsIHdlIHdhaXQgZm9yIHRoZSBjb21wb3NlZCB0ZXh0LlxuICAgICAgICBpZiAodGhpcy5faXNDb21wb3NpbmcpIHJldHVybjtcbiAgICAgICAgY29uc3QgZWw6IEhUTUxJbnB1dEVsZW1lbnQgPSBlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gdGhpcy5fbWFza1NlcnZpY2UuaW5wdXRUcmFuc2Zvcm1GbihlbC52YWx1ZSk7XG4gICAgICAgIGlmIChlbC50eXBlICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0cmFuc2Zvcm1lZFZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdHJhbnNmb3JtZWRWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IHRyYW5zZm9ybWVkVmFsdWUudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2lucHV0VmFsdWUgPSBlbC52YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRNYXNrKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21hc2tWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2hhbmdlKGVsLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBwb3NpdGlvbjogbnVtYmVyID1cbiAgICAgICAgICAgICAgICAgICAgZWwuc2VsZWN0aW9uU3RhcnQgPT09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgID8gKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikgKyB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICA6IChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNYXNrVHlwZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5rZWVwQ2hhcmFjdGVyUG9zaXRpb25zICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnBsYWNlSG9sZGVyQ2hhcmFjdGVyLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnB1dFN5bWJvbCA9IGVsLnZhbHVlLnNsaWNlKHBvc2l0aW9uIC0gMSwgcG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSB0aGlzLnByZWZpeC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrU3ltYm9sczogYm9vbGVhbiA9IHRoaXMuX21hc2tTZXJ2aWNlLl9jaGVja1N5bWJvbE1hc2soXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFN5bWJvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uW3Bvc2l0aW9uIC0gMSAtIHByZWZpeExlbmd0aF0gPz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja1NwZWNpYWxDaGFyYWN0ZXI6IGJvb2xlYW4gPSB0aGlzLl9tYXNrU2VydmljZS5fY2hlY2tTeW1ib2xNYXNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRTeW1ib2wsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbltwb3NpdGlvbiArIDEgLSBwcmVmaXhMZW5ndGhdID8/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdFJhbmdlQmFja3NwYWNlOiBib29sZWFuID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnNlbFN0YXJ0ID09PSB0aGlzLl9tYXNrU2VydmljZS5zZWxFbmQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbFN0YXJ0ID0gTnVtYmVyKHRoaXMuX21hc2tTZXJ2aWNlLnNlbFN0YXJ0KSAtIHByZWZpeExlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsRW5kID0gTnVtYmVyKHRoaXMuX21hc2tTZXJ2aWNlLnNlbEVuZCkgLSBwcmVmaXhMZW5ndGg7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NvZGUgPT09IE1hc2tFeHByZXNzaW9uLkJBQ0tTUEFDRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxlY3RSYW5nZUJhY2tzcGFjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tYXNrU2VydmljZS5zZWxTdGFydCA9PT0gcHJlZml4TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlID0gYCR7dGhpcy5wcmVmaXh9JHt0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93bi5zbGljZSgwLCBzZWxFbmQpfSR7dGhpcy5faW5wdXRWYWx1ZS5zcGxpdCh0aGlzLnByZWZpeCkuam9pbignJyl9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5zZWxTdGFydCA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubWFza0lzU2hvd24ubGVuZ3RoICsgcHJlZml4TGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlID0gYCR7dGhpcy5faW5wdXRWYWx1ZX0ke3RoaXMuX21hc2tTZXJ2aWNlLm1hc2tJc1Nob3duLnNsaWNlKHNlbFN0YXJ0LCBzZWxFbmQpfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUgPSBgJHt0aGlzLnByZWZpeH0ke3RoaXMuX2lucHV0VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCh0aGlzLnByZWZpeClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKCcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9JHt0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93bi5zbGljZShzZWxTdGFydCwgc2VsRW5kKX0ke3RoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlLnNsaWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsRW5kICsgcHJlZml4TGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubWFza0lzU2hvd24ubGVuZ3RoICsgcHJlZml4TGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9JHt0aGlzLnN1ZmZpeH1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIXRoaXMuX21hc2tTZXJ2aWNlLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbi5zbGljZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uIC0gdGhpcy5wcmVmaXgubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gKyAxIC0gdGhpcy5wcmVmaXgubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0UmFuZ2VCYWNrc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxTdGFydCA9PT0gMSAmJiB0aGlzLnByZWZpeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZSA9IGAke3RoaXMucHJlZml4fSR7dGhpcy5fbWFza1NlcnZpY2UucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHtlbC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KHRoaXMucHJlZml4KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQodGhpcy5zdWZmaXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuam9pbignJyl9JHt0aGlzLnN1ZmZpeH1gO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnQxID0gZWwudmFsdWUuc3Vic3RyaW5nKDAsIHBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFydDIgPSBlbC52YWx1ZS5zdWJzdHJpbmcocG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZSA9IGAke3BhcnQxfSR7dGhpcy5fbWFza1NlcnZpY2UucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHtwYXJ0Mn1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY29kZSAhPT0gTWFza0V4cHJlc3Npb24uQkFDS1NQQUNFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrU3ltYm9scyAmJiAhY2hlY2tTcGVjaWFsQ2hhcmFjdGVyICYmIHNlbGVjdFJhbmdlQmFja3NwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSBOdW1iZXIoZWwuc2VsZWN0aW9uU3RhcnQpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2Uuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnZhbHVlLnNsaWNlKHBvc2l0aW9uLCBwb3NpdGlvbiArIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrU3BlY2lhbENoYXJhY3RlciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICF0aGlzLl9tYXNrU2VydmljZS5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUuc2xpY2UocG9zaXRpb24gKyAxLCBwb3NpdGlvbiArIDIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUgPSBgJHtlbC52YWx1ZS5zbGljZSgwLCBwb3NpdGlvbiAtIDEpfSR7ZWwudmFsdWUuc2xpY2UocG9zaXRpb24sIHBvc2l0aW9uICsgMSl9JHtpbnB1dFN5bWJvbH0ke2VsLnZhbHVlLnNsaWNlKHBvc2l0aW9uICsgMil9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hlY2tTeW1ib2xzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsLnZhbHVlLmxlbmd0aCA9PT0gMSAmJiBwb3NpdGlvbiA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZSA9IGAke3RoaXMucHJlZml4fSR7aW5wdXRTeW1ib2x9JHt0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93bi5zbGljZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93bi5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX0ke3RoaXMuc3VmZml4fWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUgPSBgJHtlbC52YWx1ZS5zbGljZSgwLCBwb3NpdGlvbiAtIDEpfSR7aW5wdXRTeW1ib2x9JHtlbC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKHBvc2l0aW9uICsgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCh0aGlzLnN1ZmZpeClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKCcnKX0ke3RoaXMuc3VmZml4fWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZWZpeCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnZhbHVlLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uIC0gcHJlZml4TGVuZ3RoID09PSAxICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuX2NoZWNrU3ltYm9sTWFzayhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uW3Bvc2l0aW9uIC0gMSAtIHByZWZpeExlbmd0aF0gPz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlID0gYCR7dGhpcy5wcmVmaXh9JHtlbC52YWx1ZX0ke3RoaXMuX21hc2tTZXJ2aWNlLm1hc2tJc1Nob3duLnNsaWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93bi5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfSR7dGhpcy5zdWZmaXh9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBjYXJldFNoaWZ0ID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgYmFja3NwYWNlU2hpZnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY29kZSA9PT0gTWFza0V4cHJlc3Npb24uREVMRVRFICYmIE1hc2tFeHByZXNzaW9uLlNFUEFSQVRPUikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5kZWxldGVkU3BlY2lhbENoYXJhY3RlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5wdXRWYWx1ZS5sZW5ndGggPj0gdGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24ubGVuZ3RoIC0gMSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb2RlICE9PSBNYXNrRXhwcmVzc2lvbi5CQUNLU1BBQ0UgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLkRBWVNfTU9OVEhTX1lFQVJTICYmXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uIDwgMTBcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRTeW1ib2wgPSB0aGlzLl9pbnB1dFZhbHVlLnNsaWNlKHBvc2l0aW9uIC0gMSwgcG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnB1dFZhbHVlLnNsaWNlKDAsIHBvc2l0aW9uIC0gMSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRTeW1ib2wgK1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5wdXRWYWx1ZS5zbGljZShwb3NpdGlvbiArIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5EQVlTX01PTlRIU19ZRUFSUyAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlYWRaZXJvRGF0ZVRpbWVcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHBvc2l0aW9uIDwgMyAmJiBOdW1iZXIoZWwudmFsdWUpID4gMzEgJiYgTnVtYmVyKGVsLnZhbHVlKSA8IDQwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHBvc2l0aW9uID09PSA1ICYmIE51bWJlcihlbC52YWx1ZS5zbGljZSgzLCA1KSkgPiAxMilcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uICsgMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5IT1VSU19NSU5VVEVTX1NFQ09ORFMgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcG1cbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2p1c3RQYXN0ZWQgJiYgZWwudmFsdWUuc2xpY2UoMCwgMikgPT09IE1hc2tFeHByZXNzaW9uLkRPVUJMRV9aRVJPKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IGVsLnZhbHVlLnNsaWNlKDEsIDIpICsgZWwudmFsdWUuc2xpY2UoMiwgZWwudmFsdWUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9PT0gTWFza0V4cHJlc3Npb24uRE9VQkxFX1pFUk9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBlbC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hcHBseVZhbHVlQ2hhbmdlcyhcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2p1c3RQYXN0ZWQsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvZGUgPT09IE1hc2tFeHByZXNzaW9uLkJBQ0tTUEFDRSB8fCB0aGlzLl9jb2RlID09PSBNYXNrRXhwcmVzc2lvbi5ERUxFVEUsXG4gICAgICAgICAgICAgICAgICAgIChzaGlmdDogbnVtYmVyLCBfYmFja3NwYWNlU2hpZnQ6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2p1c3RQYXN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmV0U2hpZnQgPSBzaGlmdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tzcGFjZVNoaWZ0ID0gX2JhY2tzcGFjZVNoaWZ0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IHNldCB0aGUgc2VsZWN0aW9uIGlmIHRoZSBlbGVtZW50IGlzIGFjdGl2ZVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9nZXRBY3RpdmVFbGVtZW50KCkgIT09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbWFza1NlcnZpY2UucGx1c09uZVBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5wbHVzT25lUG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHBvc2l0aW9uIGFmdGVyIGFwcGx5VmFsdWVDaGFuZ2VzIHRvIHByZXZlbnQgY3Vyc29yIG9uIHdyb25nIHBvc2l0aW9uIHdoZW4gaXQgaGFzIGFuIGFycmF5IG9mIG1hc2tFeHByZXNzaW9uXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jb2RlID09PSBNYXNrRXhwcmVzc2lvbi5CQUNLU1BBQ0UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnB1dFZhbHVlLnNsaWNlKHBvc2l0aW9uIC0gMSwgcG9zaXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBwb3NpdGlvbiAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNlbGVjdGlvblN0YXJ0ID09PSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikgKyB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9zaXRpb24gPVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wb3NpdGlvbiA9PT0gMSAmJiB0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCA9PT0gMSA/IG51bGwgOiB0aGlzLl9wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb25Ub0FwcGx5OiBudW1iZXIgPSB0aGlzLl9wb3NpdGlvblxuICAgICAgICAgICAgICAgICAgICA/IHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoICsgcG9zaXRpb24gKyBjYXJldFNoaWZ0XG4gICAgICAgICAgICAgICAgICAgIDogcG9zaXRpb24gK1xuICAgICAgICAgICAgICAgICAgICAgICh0aGlzLl9jb2RlID09PSBNYXNrRXhwcmVzc2lvbi5CQUNLU1BBQ0UgJiYgIWJhY2tzcGFjZVNoaWZ0ID8gMCA6IGNhcmV0U2hpZnQpO1xuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvblRvQXBwbHkgPiB0aGlzLl9nZXRBY3R1YWxJbnB1dExlbmd0aCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uVG9BcHBseSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9PT0gdGhpcy5fbWFza1NlcnZpY2UuZGVjaW1hbE1hcmtlciAmJiBlbC52YWx1ZS5sZW5ndGggPT09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuX2dldEFjdHVhbElucHV0TGVuZ3RoKCkgKyAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLl9nZXRBY3R1YWxJbnB1dExlbmd0aCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb25Ub0FwcGx5IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvblRvQXBwbHkgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZShwb3NpdGlvblRvQXBwbHksIHBvc2l0aW9uVG9BcHBseSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9zaXRpb24gPSBudWxsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICdOZ3gtbWFzayB3cml0ZVZhbHVlIHdvcmsgd2l0aCBzdHJpbmcgfCBudW1iZXIsIHlvdXIgY3VycmVudCB2YWx1ZTonLFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdHJhbnNmb3JtZWRWYWx1ZVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX21hc2tWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2UoZWwudmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5VmFsdWVDaGFuZ2VzKFxuICAgICAgICAgICAgICAgIGVsLnZhbHVlLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB0aGlzLl9qdXN0UGFzdGVkLFxuICAgICAgICAgICAgICAgIHRoaXMuX2NvZGUgPT09IE1hc2tFeHByZXNzaW9uLkJBQ0tTUEFDRSB8fCB0aGlzLl9jb2RlID09PSBNYXNrRXhwcmVzc2lvbi5ERUxFVEVcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJTUUgc3RhcnRzXG4gICAgQEhvc3RMaXN0ZW5lcignY29tcG9zaXRpb25zdGFydCcsIFsnJGV2ZW50J10pXG4gICAgcHVibGljIG9uQ29tcG9zaXRpb25TdGFydCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5faXNDb21wb3NpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIElNRSBjb21wbGV0ZXNcbiAgICBASG9zdExpc3RlbmVyKCdjb21wb3NpdGlvbmVuZCcsIFsnJGV2ZW50J10pXG4gICAgcHVibGljIG9uQ29tcG9zaXRpb25FbmQoZTogQ3VzdG9tS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9pc0NvbXBvc2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9qdXN0UGFzdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5vbklucHV0KGUpO1xuICAgIH1cblxuICAgIEBIb3N0TGlzdGVuZXIoJ2JsdXInLCBbJyRldmVudCddKVxuICAgIHB1YmxpYyBvbkJsdXIoZTogQ3VzdG9tS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fbWFza1ZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBlbDogSFRNTElucHV0RWxlbWVudCA9IGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAodGhpcy5sZWFkWmVybyAmJiBlbC52YWx1ZS5sZW5ndGggPiAwICYmIHR5cGVvZiB0aGlzLmRlY2ltYWxNYXJrZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFza0V4cHJlc3Npb24gPSB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVjaXNpb24gPSBOdW1iZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uLnNsaWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb24ubGVuZ3RoIC0gMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAocHJlY2lzaW9uID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IHRoaXMuc3VmZml4ID8gZWwudmFsdWUuc3BsaXQodGhpcy5zdWZmaXgpLmpvaW4oJycpIDogZWwudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlY2ltYWxQYXJ0ID0gZWwudmFsdWUuc3BsaXQodGhpcy5kZWNpbWFsTWFya2VyKVsxXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGVsLnZhbHVlID0gZWwudmFsdWUuaW5jbHVkZXModGhpcy5kZWNpbWFsTWFya2VyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBlbC52YWx1ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPLnJlcGVhdChwcmVjaXNpb24gLSBkZWNpbWFsUGFydC5sZW5ndGgpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWZmaXhcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZWwudmFsdWUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBNYXNrRXhwcmVzc2lvbi5OVU1CRVJfWkVSTy5yZXBlYXQocHJlY2lzaW9uKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VmZml4O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZSA9IGVsLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmNsZWFySWZOb3RNYXRjaEZuKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faXNGb2N1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25Ub3VjaCgpO1xuICAgIH1cblxuICAgIEBIb3N0TGlzdGVuZXIoJ2NsaWNrJywgWyckZXZlbnQnXSlcbiAgICBwdWJsaWMgb25DbGljayhlOiBNb3VzZUV2ZW50IHwgQ3VzdG9tS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuX21hc2tWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZWw6IEhUTUxJbnB1dEVsZW1lbnQgPSBlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgICBjb25zdCBwb3NTdGFydCA9IDA7XG4gICAgICAgIGNvbnN0IHBvc0VuZCA9IDA7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgZWwgIT09IG51bGwgJiZcbiAgICAgICAgICAgIGVsLnNlbGVjdGlvblN0YXJ0ICE9PSBudWxsICYmXG4gICAgICAgICAgICBlbC5zZWxlY3Rpb25TdGFydCA9PT0gZWwuc2VsZWN0aW9uRW5kICYmXG4gICAgICAgICAgICBlbC5zZWxlY3Rpb25TdGFydCA+IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGggJiZcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICAgICAgKGUgYXMgYW55KS5rZXlDb2RlICE9PSAzOFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tYXNrU2VydmljZS5zaG93TWFza1R5cGVkICYmICF0aGlzLmtlZXBDaGFyYWN0ZXJQb3NpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBhcmUgc2hvd2luZyB0aGUgbWFzayBpbiB0aGUgaW5wdXRcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93biA9IHRoaXMuX21hc2tTZXJ2aWNlLnNob3dNYXNrSW5JbnB1dCgpO1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UucHJlZml4ICsgdGhpcy5fbWFza1NlcnZpY2UubWFza0lzU2hvd24gPT09IGVsLnZhbHVlXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBpbnB1dCBPTkxZIGNvbnRhaW5zIHRoZSBtYXNrLCBzbyBwb3NpdGlvbiB0aGUgY3Vyc29yIGF0IHRoZSBzdGFydFxuICAgICAgICAgICAgICAgICAgICBlbC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZShwb3NTdGFydCwgcG9zRW5kKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgaW5wdXQgY29udGFpbnMgc29tZSBjaGFyYWN0ZXJzIGFscmVhZHlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsLnNlbGVjdGlvblN0YXJ0ID4gdGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdXNlciBjbGlja2VkIGJleW9uZCBvdXIgdmFsdWUncyBsZW5ndGgsIHBvc2l0aW9uIHRoZSBjdXJzb3IgYXQgdGhlIGVuZCBvZiBvdXIgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV4dFZhbHVlOiBzdHJpbmcgfCBudWxsID1cbiAgICAgICAgICAgIGVsICYmXG4gICAgICAgICAgICAoZWwudmFsdWUgPT09IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeFxuICAgICAgICAgICAgICAgID8gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4ICsgdGhpcy5fbWFza1NlcnZpY2UubWFza0lzU2hvd25cbiAgICAgICAgICAgICAgICA6IGVsLnZhbHVlKTtcblxuICAgICAgICAvKiogRml4IG9mIGN1cnNvciBwb3NpdGlvbiBqdW1waW5nIHRvIGVuZCBpbiBtb3N0IGJyb3dzZXJzIG5vIG1hdHRlciB3aGVyZSBjdXJzb3IgaXMgaW5zZXJ0ZWQgb25Gb2N1cyAqL1xuICAgICAgICBpZiAoZWwgJiYgZWwudmFsdWUgIT09IG5leHRWYWx1ZSkge1xuICAgICAgICAgICAgZWwudmFsdWUgPSBuZXh0VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgLyoqIGZpeCBvZiBjdXJzb3IgcG9zaXRpb24gd2l0aCBwcmVmaXggd2hlbiBtb3VzZSBjbGljayBvY2N1ciAqL1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBlbCAmJlxuICAgICAgICAgICAgZWwudHlwZSAhPT0gJ251bWJlcicgJiZcbiAgICAgICAgICAgICgoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSB8fCAoZWwuc2VsZWN0aW9uRW5kIGFzIG51bWJlcikpIDw9XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGVsLnNlbGVjdGlvblN0YXJ0ID0gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvKiogc2VsZWN0IG9ubHkgaW5zZXJ0ZWQgdGV4dCAqL1xuICAgICAgICBpZiAoZWwgJiYgKGVsLnNlbGVjdGlvbkVuZCBhcyBudW1iZXIpID4gdGhpcy5fZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKSkge1xuICAgICAgICAgICAgZWwuc2VsZWN0aW9uRW5kID0gdGhpcy5fZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gICAgQEhvc3RMaXN0ZW5lcigna2V5ZG93bicsIFsnJGV2ZW50J10pXG4gICAgcHVibGljIG9uS2V5RG93bihlOiBDdXN0b21LZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5fbWFza1ZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faXNDb21wb3NpbmcpIHtcbiAgICAgICAgICAgIC8vIFVzZXIgZmluYWxpemUgdGhlaXIgY2hvaWNlIGZyb20gSU1FIGNvbXBvc2l0aW9uLCBzbyB0cmlnZ2VyIG9uSW5wdXQoKSBmb3IgdGhlIGNvbXBvc2VkIHRleHQuXG4gICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHRoaXMub25Db21wb3NpdGlvbkVuZChlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvZGUgPSBlLmNvZGUgPyBlLmNvZGUgOiBlLmtleTtcbiAgICAgICAgY29uc3QgZWw6IEhUTUxJbnB1dEVsZW1lbnQgPSBlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgICB0aGlzLl9pbnB1dFZhbHVlID0gZWwudmFsdWU7XG4gICAgICAgIHRoaXMuX3NldE1hc2soKTtcblxuICAgICAgICBpZiAoZWwudHlwZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gTWFza0V4cHJlc3Npb24uQVJST1dfVVApIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgZS5rZXkgPT09IE1hc2tFeHByZXNzaW9uLkFSUk9XX0xFRlQgfHxcbiAgICAgICAgICAgICAgICBlLmtleSA9PT0gTWFza0V4cHJlc3Npb24uQkFDS1NQQUNFIHx8XG4gICAgICAgICAgICAgICAgZS5rZXkgPT09IE1hc2tFeHByZXNzaW9uLkRFTEVURVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSBNYXNrRXhwcmVzc2lvbi5CQUNLU1BBQ0UgJiYgZWwudmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnNlbGVjdGlvblN0YXJ0ID0gZWwuc2VsZWN0aW9uRW5kO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09IE1hc2tFeHByZXNzaW9uLkJBQ0tTUEFDRSAmJiAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBzcGVjaWFsQ2hhcnMgaXMgZmFsc2UsIChzaG91bGRuJ3QgZXZlciBoYXBwZW4pIHRoZW4gc2V0IHRvIHRoZSBkZWZhdWx0c1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzID0gdGhpcy5zcGVjaWFsQ2hhcmFjdGVycz8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuc3BlY2lhbENoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5fY29uZmlnLnNwZWNpYWxDaGFyYWN0ZXJzO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZWZpeC5sZW5ndGggPiAxICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSA8PSB0aGlzLnByZWZpeC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSh0aGlzLnByZWZpeC5sZW5ndGgsIGVsLnNlbGVjdGlvbkVuZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5wdXRWYWx1ZS5sZW5ndGggIT09IChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikgIT09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnB1dFZhbHVlWyhlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIC0gMV0gPz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgodGhpcy5wcmVmaXgubGVuZ3RoID49IDEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpID4gdGhpcy5wcmVmaXgubGVuZ3RoKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVmaXgubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIC0gMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNlbGVjdGlvbkVuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrU2VsZWN0aW9uT25EZWxldGlvbihlbCk7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgICAgIChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIDw9IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgKGVsLnNlbGVjdGlvbkVuZCBhcyBudW1iZXIpIDw9IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGhcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3JTdGFydDogbnVtYmVyIHwgbnVsbCA9IGVsLnNlbGVjdGlvblN0YXJ0O1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgZS5rZXkgPT09IE1hc2tFeHByZXNzaW9uLkJBQ0tTUEFDRSAmJlxuICAgICAgICAgICAgICAgICAgICAhZWwucmVhZE9ubHkgJiZcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yU3RhcnQgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgZWwuc2VsZWN0aW9uRW5kID09PSBlbC52YWx1ZS5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Bvc2l0aW9uID0gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4ID8gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aCA6IDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayhcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgISF0aGlzLnN1ZmZpeCAmJlxuICAgICAgICAgICAgICAgIHRoaXMuc3VmZml4Lmxlbmd0aCA+IDEgJiZcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCAtIHRoaXMuc3VmZml4Lmxlbmd0aCA8IChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5wdXRWYWx1ZS5sZW5ndGggLSB0aGlzLnN1ZmZpeC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgKGUuY29kZSA9PT0gJ0tleUEnICYmIGUuY3RybEtleSkgfHxcbiAgICAgICAgICAgICAgICAoZS5jb2RlID09PSAnS2V5QScgJiYgZS5tZXRhS2V5KSAvLyBDbWQgKyBBIChNYWMpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSgwLCB0aGlzLl9nZXRBY3R1YWxJbnB1dExlbmd0aCgpKTtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5zZWxTdGFydCA9IGVsLnNlbGVjdGlvblN0YXJ0O1xuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2Uuc2VsRW5kID0gZWwuc2VsZWN0aW9uRW5kO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIEl0IHdyaXRlcyB0aGUgdmFsdWUgaW4gdGhlIGlucHV0ICovXG4gICAgcHVibGljIGFzeW5jIHdyaXRlVmFsdWUoY29udHJvbFZhbHVlOiB1bmtub3duKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0eXBlb2YgY29udHJvbFZhbHVlID09PSAnb2JqZWN0JyAmJiBjb250cm9sVmFsdWUgIT09IG51bGwgJiYgJ3ZhbHVlJyBpbiBjb250cm9sVmFsdWUpIHtcbiAgICAgICAgICAgIGlmICgnZGlzYWJsZScgaW4gY29udHJvbFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREaXNhYmxlZFN0YXRlKEJvb2xlYW4oY29udHJvbFZhbHVlLmRpc2FibGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250cm9sVmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgY29udHJvbFZhbHVlID0gdGhpcy5pbnB1dFRyYW5zZm9ybUZuXG4gICAgICAgICAgICAgICAgPyB0aGlzLmlucHV0VHJhbnNmb3JtRm4oY29udHJvbFZhbHVlKVxuICAgICAgICAgICAgICAgIDogY29udHJvbFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIGNvbnRyb2xWYWx1ZSA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgICAgIHR5cGVvZiBjb250cm9sVmFsdWUgPT09ICdudW1iZXInIHx8XG4gICAgICAgICAgICBjb250cm9sVmFsdWUgPT09IG51bGwgfHxcbiAgICAgICAgICAgIGNvbnRyb2xWYWx1ZSA9PT0gdW5kZWZpbmVkXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGNvbnRyb2xWYWx1ZSA9PT0gbnVsbCB8fCBjb250cm9sVmFsdWUgPT09IHVuZGVmaW5lZCB8fCBjb250cm9sVmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuX2N1cnJlbnRWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLl9wcmV2aW91c1ZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgIGxldCBpbnB1dFZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkID0gY29udHJvbFZhbHVlO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHR5cGVvZiBpbnB1dFZhbHVlID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgICAgICAgIHRoaXMuX21hc2tWYWx1ZS5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlNFUEFSQVRPUilcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgPSBTdHJpbmcoaW5wdXRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbG9jYWxlRGVjaW1hbE1hcmtlciA9IHRoaXMuX21hc2tTZXJ2aWNlLmN1cnJlbnRMb2NhbGVEZWNpbWFsTWFya2VyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRoaXMuX21hc2tTZXJ2aWNlLmRlY2ltYWxNYXJrZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmRlY2ltYWxNYXJrZXIgIT09IGxvY2FsZURlY2ltYWxNYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGlucHV0VmFsdWUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbGVEZWNpbWFsTWFya2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmRlY2ltYWxNYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgQXJyYXkuaXNBcnJheSh0aGlzLl9tYXNrU2VydmljZS5kZWNpbWFsTWFya2VyKSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIgPT09IE1hc2tFeHByZXNzaW9uLkRPVFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5kZWNpbWFsTWFya2VyID0gTWFza0V4cHJlc3Npb24uQ09NTUE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubGVhZFplcm8gJiZcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzICE9PSBmYWxzZVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMuX21hc2tTZXJ2aWNlLl9jaGVja1ByZWNpc2lvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSBhcyBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21hc2tTZXJ2aWNlLmRlY2ltYWxNYXJrZXIgPT09IE1hc2tFeHByZXNzaW9uLkNPTU1BKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKE1hc2tFeHByZXNzaW9uLkRPVCwgTWFza0V4cHJlc3Npb24uQ09NTUEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXNrRXhwcmVzc2lvbj8uc3RhcnRzV2l0aChNYXNrRXhwcmVzc2lvbi5TRVBBUkFUT1IpICYmIHRoaXMubGVhZFplcm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlPy50b1N0cmluZygpID8/ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuaXNOdW1iZXJWYWx1ZSA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXRWYWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2lucHV0VmFsdWUgPSBpbnB1dFZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fc2V0TWFzaygpO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKGlucHV0VmFsdWUgJiYgdGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24pIHx8XG4gICAgICAgICAgICAgICAgKHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uICYmXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLl9tYXNrU2VydmljZS5wcmVmaXggfHwgdGhpcy5fbWFza1NlcnZpY2Uuc2hvd01hc2tUeXBlZCkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAvLyBMZXQgdGhlIHNlcnZpY2Ugd2Uga25vdyB3ZSBhcmUgd3JpdGluZyB2YWx1ZSBzbyB0aGF0IHRyaWdnZXJpbmcgb25DaGFuZ2UgZnVuY3Rpb24gd29uJ3QgaGFwcGVuIGR1cmluZyBhcHBseU1hc2tcbiAgICAgICAgICAgICAgICB0eXBlb2YgdGhpcy5pbnB1dFRyYW5zZm9ybUZuICE9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgID8gKHRoaXMuX21hc2tTZXJ2aWNlLndyaXRpbmdWYWx1ZSA9IHRydWUpXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuZm9ybUVsZW1lbnRQcm9wZXJ0eSA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3ZhbHVlJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYXBwbHlNYXNrKGlucHV0VmFsdWUsIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uKSxcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIC8vIExldCB0aGUgc2VydmljZSBrbm93IHdlJ3ZlIGZpbmlzaGVkIHdyaXRpbmcgdmFsdWVcbiAgICAgICAgICAgICAgICB0eXBlb2YgdGhpcy5pbnB1dFRyYW5zZm9ybUZuICE9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgID8gKHRoaXMuX21hc2tTZXJ2aWNlLndyaXRpbmdWYWx1ZSA9IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5mb3JtRWxlbWVudFByb3BlcnR5ID0gWyd2YWx1ZScsIGlucHV0VmFsdWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faW5wdXRWYWx1ZSA9IGlucHV0VmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgJ05neC1tYXNrIHdyaXRlVmFsdWUgd29yayB3aXRoIHN0cmluZyB8IG51bWJlciwgeW91ciBjdXJyZW50IHZhbHVlOicsXG4gICAgICAgICAgICAgICAgdHlwZW9mIGNvbnRyb2xWYWx1ZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZWdpc3Rlck9uQ2hhbmdlKGZuOiB0eXBlb2YgdGhpcy5vbkNoYW5nZSk6IHZvaWQge1xuICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5vbkNoYW5nZSA9IHRoaXMub25DaGFuZ2UgPSBmbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVnaXN0ZXJPblRvdWNoZWQoZm46IHR5cGVvZiB0aGlzLm9uVG91Y2gpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5vblRvdWNoID0gZm47XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0QWN0aXZlRWxlbWVudChkb2N1bWVudDogRG9jdW1lbnRPclNoYWRvd1Jvb3QgPSB0aGlzLmRvY3VtZW50KTogRWxlbWVudCB8IG51bGwge1xuICAgICAgICBjb25zdCBzaGFkb3dSb290RWwgPSBkb2N1bWVudD8uYWN0aXZlRWxlbWVudD8uc2hhZG93Um9vdDtcbiAgICAgICAgaWYgKCFzaGFkb3dSb290RWw/LmFjdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldEFjdGl2ZUVsZW1lbnQoc2hhZG93Um9vdEVsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBjaGVja1NlbGVjdGlvbk9uRGVsZXRpb24oZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgICAgICAgZWwuc2VsZWN0aW9uU3RhcnQgPSBNYXRoLm1pbihcbiAgICAgICAgICAgIE1hdGgubWF4KHRoaXMucHJlZml4Lmxlbmd0aCwgZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSxcbiAgICAgICAgICAgIHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoIC0gdGhpcy5zdWZmaXgubGVuZ3RoXG4gICAgICAgICk7XG4gICAgICAgIGVsLnNlbGVjdGlvbkVuZCA9IE1hdGgubWluKFxuICAgICAgICAgICAgTWF0aC5tYXgodGhpcy5wcmVmaXgubGVuZ3RoLCBlbC5zZWxlY3Rpb25FbmQgYXMgbnVtYmVyKSxcbiAgICAgICAgICAgIHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoIC0gdGhpcy5zdWZmaXgubGVuZ3RoXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqIEl0IGRpc2FibGVzIHRoZSBpbnB1dCBlbGVtZW50ICovXG4gICAgcHVibGljIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5mb3JtRWxlbWVudFByb3BlcnR5ID0gWydkaXNhYmxlZCcsIGlzRGlzYWJsZWRdO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgcHJpdmF0ZSBfYXBwbHlNYXNrKCk6IGFueSB7XG4gICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID0gdGhpcy5fbWFza1NlcnZpY2UuX3JlcGVhdFBhdHRlcm5TeW1ib2xzKFxuICAgICAgICAgICAgdGhpcy5fbWFza1ZhbHVlIHx8ICcnXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmZvcm1FbGVtZW50UHJvcGVydHkgPSBbXG4gICAgICAgICAgICAndmFsdWUnLFxuICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYXBwbHlNYXNrKHRoaXMuX2lucHV0VmFsdWUsIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uKSxcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF92YWxpZGF0ZVRpbWUodmFsdWU6IHN0cmluZyk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsIHtcbiAgICAgICAgY29uc3Qgcm93TWFza0xlbjogbnVtYmVyID0gdGhpcy5fbWFza1ZhbHVlXG4gICAgICAgICAgICAuc3BsaXQoTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgLmZpbHRlcigoczogc3RyaW5nKSA9PiBzICE9PSAnOicpLmxlbmd0aDtcbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIERvbid0IHZhbGlkYXRlIGVtcHR5IHZhbHVlcyB0byBhbGxvdyBmb3Igb3B0aW9uYWwgZm9ybSBjb250cm9sXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAoKyh2YWx1ZVt2YWx1ZS5sZW5ndGggLSAxXSA/PyAtMSkgPT09IDAgJiYgdmFsdWUubGVuZ3RoIDwgcm93TWFza0xlbikgfHxcbiAgICAgICAgICAgIHZhbHVlLmxlbmd0aCA8PSByb3dNYXNrTGVuIC0gMlxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZS5sZW5ndGggfHxcbiAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlLmxlbmd0aCArIHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGhcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVWYWxpZGF0aW9uRXJyb3IoYWN0dWFsVmFsdWU6IHN0cmluZyk6IFZhbGlkYXRpb25FcnJvcnMge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWFzazoge1xuICAgICAgICAgICAgICAgIHJlcXVpcmVkTWFzazogdGhpcy5fbWFza1ZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbFZhbHVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zZXRNYXNrKCkge1xuICAgICAgICB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5LnNvbWUoKG1hc2spOiBib29sZWFuIHwgdm9pZCA9PiB7XG4gICAgICAgICAgICBjb25zdCBzcGVjaWFsQ2hhcnQ6IGJvb2xlYW4gPSBtYXNrXG4gICAgICAgICAgICAgICAgLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORylcbiAgICAgICAgICAgICAgICAuc29tZSgoY2hhcikgPT4gdGhpcy5fbWFza1NlcnZpY2Uuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoY2hhcikpO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIChzcGVjaWFsQ2hhcnQgJiYgdGhpcy5faW5wdXRWYWx1ZSAmJiAhbWFzay5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5MRVRURVJfUykpIHx8XG4gICAgICAgICAgICAgICAgbWFzay5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5DVVJMWV9CUkFDS0VUU19MRUZUKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVzdCA9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnJlbW92ZU1hc2sodGhpcy5faW5wdXRWYWx1ZSk/Lmxlbmd0aCA8PVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5yZW1vdmVNYXNrKG1hc2spPy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1ZhbHVlID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24gPVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc2suaW5jbHVkZXMoTWFza0V4cHJlc3Npb24uQ1VSTFlfQlJBQ0tFVFNfTEVGVClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLl9tYXNrU2VydmljZS5fcmVwZWF0UGF0dGVyblN5bWJvbHMobWFzaylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBtYXNrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVzdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9uID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXlbdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheS5sZW5ndGggLSAxXSA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbi5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5DVVJMWV9CUkFDS0VUU19MRUZUKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuX21hc2tTZXJ2aWNlLl9yZXBlYXRQYXR0ZXJuU3ltYm9scyhleHByZXNzaW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGV4cHJlc3Npb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVjazogYm9vbGVhbiA9IHRoaXMuX21hc2tTZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVNYXNrKHRoaXMuX2lucHV0VmFsdWUpXG4gICAgICAgICAgICAgICAgICAgID8uc3BsaXQoTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgICAgICAgICAuZXZlcnkoKGNoYXJhY3RlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4TWFzayA9IG1hc2suY2hhckF0KGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXNrU2VydmljZS5fY2hlY2tTeW1ib2xNYXNrKGNoYXJhY3RlciwgaW5kZXhNYXNrKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGNoZWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tWYWx1ZSA9IHRoaXMubWFza0V4cHJlc3Npb24gPSB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiA9IG1hc2s7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGVjaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==
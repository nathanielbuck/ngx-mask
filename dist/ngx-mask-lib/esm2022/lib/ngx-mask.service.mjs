import { ElementRef, inject, Injectable, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NGX_MASK_CONFIG } from './ngx-mask.config';
import { NgxMaskApplierService } from './ngx-mask-applier.service';
import * as i0 from "@angular/core";
export class NgxMaskService extends NgxMaskApplierService {
    constructor() {
        super(...arguments);
        this.isNumberValue = false;
        this.maskIsShown = '';
        this.selStart = null;
        this.selEnd = null;
        /**
         * Whether we are currently in writeValue function, in this case when applying the mask we don't want to trigger onChange function,
         * since writeValue should be a one way only process of writing the DOM value based on the Angular model value.
         */
        this.writingValue = false;
        this.maskChanged = false;
        this._maskExpressionArray = [];
        this.triggerOnMaskChange = false;
        this._previousValue = '';
        this._currentValue = '';
        this._emitValue = false;
        // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
        this.onChange = (_) => { };
        this._elementRef = inject(ElementRef, { optional: true });
        this.document = inject(DOCUMENT);
        this._config = inject(NGX_MASK_CONFIG);
        this._renderer = inject(Renderer2, { optional: true });
    }
    // eslint-disable-next-line complexity
    applyMask(inputValue, maskExpression, position = 0, justPasted = false, backspaced = false, 
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
    cb = () => { }) {
        if (!maskExpression) {
            return inputValue !== this.actualValue ? this.actualValue : inputValue;
        }
        this.maskIsShown = this.showMaskTyped
            ? this.showMaskInInput()
            : "" /* MaskExpression.EMPTY_STRING */;
        if (this.maskExpression === "IP" /* MaskExpression.IP */ && this.showMaskTyped) {
            this.maskIsShown = this.showMaskInInput(inputValue || "#" /* MaskExpression.HASH */);
        }
        if (this.maskExpression === "CPF_CNPJ" /* MaskExpression.CPF_CNPJ */ && this.showMaskTyped) {
            this.maskIsShown = this.showMaskInInput(inputValue || "#" /* MaskExpression.HASH */);
        }
        if (!inputValue && this.showMaskTyped) {
            this.formControlResult(this.prefix);
            return `${this.prefix}${this.maskIsShown}${this.suffix}`;
        }
        const getSymbol = !!inputValue && typeof this.selStart === 'number'
            ? inputValue[this.selStart] ?? "" /* MaskExpression.EMPTY_STRING */
            : "" /* MaskExpression.EMPTY_STRING */;
        let newInputValue = '';
        if (this.hiddenInput !== undefined && !this.writingValue) {
            let actualResult = inputValue && inputValue.length === 1
                ? inputValue.split("" /* MaskExpression.EMPTY_STRING */)
                : this.actualValue.split("" /* MaskExpression.EMPTY_STRING */);
            // eslint-disable  @typescript-eslint/no-unused-expressions
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            if (typeof this.selStart === 'object' && typeof this.selEnd === 'object') {
                this.selStart = Number(this.selStart);
                this.selEnd = Number(this.selEnd);
            }
            else {
                inputValue !== "" /* MaskExpression.EMPTY_STRING */ && actualResult.length
                    ? typeof this.selStart === 'number' && typeof this.selEnd === 'number'
                        ? inputValue.length > actualResult.length
                            ? actualResult.splice(this.selStart, 0, getSymbol)
                            : inputValue.length < actualResult.length
                                ? actualResult.length - inputValue.length === 1
                                    ? backspaced
                                        ? actualResult.splice(this.selStart - 1, 1)
                                        : actualResult.splice(inputValue.length - 1, 1)
                                    : actualResult.splice(this.selStart, this.selEnd - this.selStart)
                                : null
                        : null
                    : (actualResult = []);
            }
            if (this.showMaskTyped) {
                if (!this.hiddenInput) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = this.removeMask(inputValue);
                }
            }
            // eslint-enable  @typescript-eslint/no-unused-expressions
            newInputValue =
                this.actualValue.length && actualResult.length <= inputValue.length
                    ? this.shiftTypedSymbols(actualResult.join("" /* MaskExpression.EMPTY_STRING */))
                    : inputValue;
        }
        if (justPasted && (this.hiddenInput || !this.hiddenInput)) {
            newInputValue = inputValue;
        }
        if (backspaced &&
            this.specialCharacters.indexOf(this.maskExpression[position] ?? "" /* MaskExpression.EMPTY_STRING */) !== -1 &&
            this.showMaskTyped &&
            !this.prefix) {
            newInputValue = this._currentValue;
        }
        if (this.deletedSpecialCharacter && position) {
            if (this.specialCharacters.includes(this.actualValue.slice(position, position + 1))) {
                // eslint-disable-next-line no-param-reassign
                position = position + 1;
            }
            else if (maskExpression.slice(position - 1, position + 1) !== "M0" /* MaskExpression.MONTHS */) {
                // eslint-disable-next-line no-param-reassign
                position = position - 2;
            }
            // eslint-disable-next-line no-param-reassign
            this.deletedSpecialCharacter = false;
        }
        if (this.showMaskTyped &&
            this.placeHolderCharacter.length === 1 &&
            !this.leadZeroDateTime) {
            // eslint-disable-next-line no-param-reassign
            inputValue = this.removeMask(inputValue);
        }
        if (this.maskChanged) {
            newInputValue = inputValue;
        }
        else {
            newInputValue =
                Boolean(newInputValue) && newInputValue.length ? newInputValue : inputValue;
        }
        if (this.showMaskTyped && this.keepCharacterPositions && this.actualValue && !justPasted) {
            const value = this.dropSpecialCharacters
                ? this.removeMask(this.actualValue)
                : this.actualValue;
            this.formControlResult(value);
            return this.actualValue
                ? this.actualValue
                : `${this.prefix}${this.maskIsShown}${this.suffix}`;
        }
        const result = super.applyMask(newInputValue, maskExpression, position, justPasted, backspaced, cb);
        this.actualValue = this.getActualValue(result);
        // handle some separator implications:
        // a.) adjust decimalMarker default (. -> ,) if thousandSeparator is a dot
        if (this.thousandSeparator === "." /* MaskExpression.DOT */ &&
            this.decimalMarker === "." /* MaskExpression.DOT */) {
            this.decimalMarker = "," /* MaskExpression.COMMA */;
        }
        // b) remove decimal marker from list of special characters to mask
        if (this.maskExpression.startsWith("separator" /* MaskExpression.SEPARATOR */) &&
            this.dropSpecialCharacters === true) {
            this.specialCharacters = this.specialCharacters.filter((item) => !this._compareOrIncludes(item, this.decimalMarker, this.thousandSeparator) //item !== this.decimalMarker, // !
            );
        }
        if (result || result === '') {
            this._previousValue = this._currentValue;
            this._currentValue = result;
            this._emitValue =
                this._previousValue !== this._currentValue ||
                    this.maskChanged ||
                    (this._previousValue === this._currentValue && justPasted);
        }
        this._emitValue
            ? this.writingValue
                ? requestAnimationFrame(() => this.formControlResult(result))
                : this.formControlResult(result)
            : '';
        if (!this.showMaskTyped || (this.showMaskTyped && this.hiddenInput)) {
            if (this.hiddenInput) {
                if (backspaced) {
                    return this.hideInput(result, this.maskExpression);
                }
                return `${this.hideInput(result, this.maskExpression)}${this.maskIsShown.slice(result.length)}`;
            }
            return result;
        }
        const resLen = result.length;
        const prefNmask = `${this.prefix}${this.maskIsShown}${this.suffix}`;
        if (this.maskExpression.includes("H" /* MaskExpression.HOURS */)) {
            const countSkipedSymbol = this._numberSkipedSymbols(result);
            return `${result}${prefNmask.slice(resLen + countSkipedSymbol)}`;
        }
        else if (this.maskExpression === "IP" /* MaskExpression.IP */ ||
            this.maskExpression === "CPF_CNPJ" /* MaskExpression.CPF_CNPJ */) {
            return `${result}${prefNmask}`;
        }
        return `${result}${prefNmask.slice(resLen)}`;
    }
    // get the number of characters that were shifted
    _numberSkipedSymbols(value) {
        const regex = /(^|\D)(\d\D)/g;
        let match = regex.exec(value);
        let countSkipedSymbol = 0;
        while (match != null) {
            countSkipedSymbol += 1;
            match = regex.exec(value);
        }
        return countSkipedSymbol;
    }
    applyValueChanges(position, justPasted, backspaced, 
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
    cb = () => { }) {
        const formElement = this._elementRef?.nativeElement;
        if (!formElement) {
            return;
        }
        formElement.value = this.applyMask(formElement.value, this.maskExpression, position, justPasted, backspaced, cb);
        if (formElement === this._getActiveElement()) {
            return;
        }
        this.clearIfNotMatchFn();
    }
    hideInput(inputValue, maskExpression) {
        return inputValue
            .split("" /* MaskExpression.EMPTY_STRING */)
            .map((curr, index) => {
            if (this.patterns &&
                this.patterns[maskExpression[index] ?? "" /* MaskExpression.EMPTY_STRING */] &&
                this.patterns[maskExpression[index] ?? "" /* MaskExpression.EMPTY_STRING */]?.symbol) {
                return this.patterns[maskExpression[index] ?? "" /* MaskExpression.EMPTY_STRING */]
                    ?.symbol;
            }
            return curr;
        })
            .join("" /* MaskExpression.EMPTY_STRING */);
    }
    // this function is not necessary, it checks result against maskExpression
    getActualValue(res) {
        const compare = res
            .split("" /* MaskExpression.EMPTY_STRING */)
            .filter((symbol, i) => {
            const maskChar = this.maskExpression[i] ?? "" /* MaskExpression.EMPTY_STRING */;
            return (this._checkSymbolMask(symbol, maskChar) ||
                (this.specialCharacters.includes(maskChar) && symbol === maskChar));
        });
        if (compare.join("" /* MaskExpression.EMPTY_STRING */) === res) {
            return compare.join("" /* MaskExpression.EMPTY_STRING */);
        }
        return res;
    }
    shiftTypedSymbols(inputValue) {
        let symbolToReplace = '';
        const newInputValue = (inputValue &&
            inputValue
                .split("" /* MaskExpression.EMPTY_STRING */)
                .map((currSymbol, index) => {
                if (this.specialCharacters.includes(inputValue[index + 1] ?? "" /* MaskExpression.EMPTY_STRING */) &&
                    inputValue[index + 1] !== this.maskExpression[index + 1]) {
                    symbolToReplace = currSymbol;
                    return inputValue[index + 1];
                }
                if (symbolToReplace.length) {
                    const replaceSymbol = symbolToReplace;
                    symbolToReplace = "" /* MaskExpression.EMPTY_STRING */;
                    return replaceSymbol;
                }
                return currSymbol;
            })) ||
            [];
        return newInputValue.join("" /* MaskExpression.EMPTY_STRING */);
    }
    /**
     * Convert number value to string
     * 3.1415 -> '3.1415'
     * 1e-7 -> '0.0000001'
     */
    numberToString(value) {
        if ((!value && value !== 0) ||
            (this.maskExpression.startsWith("separator" /* MaskExpression.SEPARATOR */) &&
                (this.leadZero || !this.dropSpecialCharacters)) ||
            (this.maskExpression.startsWith("separator" /* MaskExpression.SEPARATOR */) &&
                this.separatorLimit.length > 14 &&
                String(value).length > 14)) {
            return String(value);
        }
        return Number(value)
            .toLocaleString('fullwide', {
            useGrouping: false,
            maximumFractionDigits: 20,
        })
            .replace(`/${"-" /* MaskExpression.MINUS */}/`, "-" /* MaskExpression.MINUS */);
    }
    showMaskInInput(inputVal) {
        if (this.showMaskTyped && !!this.shownMaskExpression) {
            if (this.maskExpression.length !== this.shownMaskExpression.length) {
                throw new Error('Mask expression must match mask placeholder length');
            }
            else {
                return this.shownMaskExpression;
            }
        }
        else if (this.showMaskTyped) {
            if (inputVal) {
                if (this.maskExpression === "IP" /* MaskExpression.IP */) {
                    return this._checkForIp(inputVal);
                }
                if (this.maskExpression === "CPF_CNPJ" /* MaskExpression.CPF_CNPJ */) {
                    return this._checkForCpfCnpj(inputVal);
                }
            }
            if (this.placeHolderCharacter.length === this.maskExpression.length) {
                return this.placeHolderCharacter;
            }
            return this.maskExpression.replace(/\w/g, this.placeHolderCharacter);
        }
        return '';
    }
    clearIfNotMatchFn() {
        const formElement = this._elementRef?.nativeElement;
        if (!formElement) {
            return;
        }
        if (this.clearIfNotMatch &&
            this.prefix.length + this.maskExpression.length + this.suffix.length !==
                formElement.value.replace(this.placeHolderCharacter, "" /* MaskExpression.EMPTY_STRING */)
                    .length) {
            this.formElementProperty = ['value', "" /* MaskExpression.EMPTY_STRING */];
            this.applyMask('', this.maskExpression);
        }
    }
    set formElementProperty([name, value]) {
        if (!this._renderer || !this._elementRef) {
            return;
        }
        //[TODO]: andriikamaldinov1 find better solution
        Promise.resolve().then(() => this._renderer?.setProperty(this._elementRef?.nativeElement, name, value));
    }
    checkDropSpecialCharAmount(mask) {
        const chars = mask
            .split("" /* MaskExpression.EMPTY_STRING */)
            .filter((item) => this._findDropSpecialChar(item));
        return chars.length;
    }
    removeMask(inputValue) {
        return this._removeMask(this._removeSuffix(this._removePrefix(inputValue)), this.specialCharacters.concat('_').concat(this.placeHolderCharacter));
    }
    _checkForIp(inputVal) {
        if (inputVal === "#" /* MaskExpression.HASH */) {
            return `${this.placeHolderCharacter}.${this.placeHolderCharacter}.${this.placeHolderCharacter}.${this.placeHolderCharacter}`;
        }
        const arr = [];
        for (let i = 0; i < inputVal.length; i++) {
            const value = inputVal[i] ?? "" /* MaskExpression.EMPTY_STRING */;
            if (!value) {
                continue;
            }
            if (value.match('\\d')) {
                arr.push(value);
            }
        }
        if (arr.length <= 3) {
            return `${this.placeHolderCharacter}.${this.placeHolderCharacter}.${this.placeHolderCharacter}`;
        }
        if (arr.length > 3 && arr.length <= 6) {
            return `${this.placeHolderCharacter}.${this.placeHolderCharacter}`;
        }
        if (arr.length > 6 && arr.length <= 9) {
            return this.placeHolderCharacter;
        }
        if (arr.length > 9 && arr.length <= 12) {
            return '';
        }
        return '';
    }
    _checkForCpfCnpj(inputVal) {
        const cpf = `${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `-${this.placeHolderCharacter}${this.placeHolderCharacter}`;
        const cnpj = `${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `/${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `-${this.placeHolderCharacter}${this.placeHolderCharacter}`;
        if (inputVal === "#" /* MaskExpression.HASH */) {
            return cpf;
        }
        const arr = [];
        for (let i = 0; i < inputVal.length; i++) {
            const value = inputVal[i] ?? "" /* MaskExpression.EMPTY_STRING */;
            if (!value) {
                continue;
            }
            if (value.match('\\d')) {
                arr.push(value);
            }
        }
        if (arr.length <= 3) {
            return cpf.slice(arr.length, cpf.length);
        }
        if (arr.length > 3 && arr.length <= 6) {
            return cpf.slice(arr.length + 1, cpf.length);
        }
        if (arr.length > 6 && arr.length <= 9) {
            return cpf.slice(arr.length + 2, cpf.length);
        }
        if (arr.length > 9 && arr.length < 11) {
            return cpf.slice(arr.length + 3, cpf.length);
        }
        if (arr.length === 11) {
            return '';
        }
        if (arr.length === 12) {
            if (inputVal.length === 17) {
                return cnpj.slice(16, cnpj.length);
            }
            return cnpj.slice(15, cnpj.length);
        }
        if (arr.length > 12 && arr.length <= 14) {
            return cnpj.slice(arr.length + 4, cnpj.length);
        }
        return '';
    }
    /**
     * Recursively determine the current active element by navigating the Shadow DOM until the Active Element is found.
     */
    _getActiveElement(document = this.document) {
        const shadowRootEl = document?.activeElement?.shadowRoot;
        if (!shadowRootEl?.activeElement) {
            return document.activeElement;
        }
        else {
            return this._getActiveElement(shadowRootEl);
        }
    }
    /**
     * Propogates the input value back to the Angular model by triggering the onChange function. It won't do this if writingValue
     * is true. If that is true it means we are currently in the writeValue function, which is supposed to only update the actual
     * DOM element based on the Angular model value. It should be a one way process, i.e. writeValue should not be modifying the Angular
     * model value too. Therefore, we don't trigger onChange in this scenario.
     * @param inputValue the current form input value
     */
    formControlResult(inputValue) {
        if (this.writingValue || (!this.triggerOnMaskChange && this.maskChanged)) {
            this.maskChanged
                ? this.onChange(this.outputTransformFn(this._toNumber(this._checkSymbols(this._removeSuffix(this._removePrefix(inputValue))))))
                : '';
            this.maskChanged = false;
            return;
        }
        if (Array.isArray(this.dropSpecialCharacters)) {
            this.onChange(this.outputTransformFn(this._toNumber(this._checkSymbols(this._removeMask(this._removeSuffix(this._removePrefix(inputValue)), this.dropSpecialCharacters)))));
        }
        else if (this.dropSpecialCharacters ||
            (!this.dropSpecialCharacters && this.prefix === inputValue)) {
            this.onChange(this.outputTransformFn(this._toNumber(this._checkSymbols(this._removeSuffix(this._removePrefix(inputValue))))));
        }
        else {
            this.onChange(this.outputTransformFn(this._toNumber(inputValue)));
        }
    }
    _toNumber(value) {
        if (!this.isNumberValue || value === "" /* MaskExpression.EMPTY_STRING */) {
            return value;
        }
        if (this.maskExpression.startsWith("separator" /* MaskExpression.SEPARATOR */) &&
            (this.leadZero || !this.dropSpecialCharacters)) {
            return value;
        }
        if (String(value).length > 16 && this.separatorLimit.length > 14) {
            return String(value);
        }
        const num = Number(value);
        if (this.maskExpression.startsWith("separator" /* MaskExpression.SEPARATOR */) && Number.isNaN(num)) {
            const val = String(value).replace(',', '.');
            return Number(val);
        }
        return Number.isNaN(num) ? value : num;
    }
    _removeMask(value, specialCharactersForRemove) {
        if (this.maskExpression.startsWith("percent" /* MaskExpression.PERCENT */) &&
            value.includes("." /* MaskExpression.DOT */)) {
            return value;
        }
        return value
            ? value.replace(this._regExpForRemove(specialCharactersForRemove), "" /* MaskExpression.EMPTY_STRING */)
            : value;
    }
    _removePrefix(value) {
        if (!this.prefix) {
            return value;
        }
        return value ? value.replace(this.prefix, "" /* MaskExpression.EMPTY_STRING */) : value;
    }
    _removeSuffix(value) {
        if (!this.suffix) {
            return value;
        }
        return value ? value.replace(this.suffix, "" /* MaskExpression.EMPTY_STRING */) : value;
    }
    _retrieveSeparatorValue(result) {
        let specialCharacters = Array.isArray(this.dropSpecialCharacters)
            ? this.specialCharacters.filter((v) => {
                return this.dropSpecialCharacters.includes(v);
            })
            : this.specialCharacters;
        if (!this.deletedSpecialCharacter &&
            this._checkPatternForSpace() &&
            result.includes(" " /* MaskExpression.WHITE_SPACE */) &&
            this.maskExpression.includes("*" /* MaskExpression.SYMBOL_STAR */)) {
            specialCharacters = specialCharacters.filter((char) => char !== " " /* MaskExpression.WHITE_SPACE */);
        }
        return this._removeMask(result, specialCharacters);
    }
    _regExpForRemove(specialCharactersForRemove) {
        return new RegExp(specialCharactersForRemove.map((item) => `\\${item}`).join('|'), 'gi');
    }
    _replaceDecimalMarkerToDot(value) {
        const markers = Array.isArray(this.decimalMarker)
            ? this.decimalMarker
            : [this.decimalMarker];
        return value.replace(this._regExpForRemove(markers), "." /* MaskExpression.DOT */);
    }
    _checkSymbols(result) {
        if (result === "" /* MaskExpression.EMPTY_STRING */) {
            return result;
        }
        if (this.maskExpression.startsWith("percent" /* MaskExpression.PERCENT */) &&
            this.decimalMarker === "," /* MaskExpression.COMMA */) {
            // eslint-disable-next-line no-param-reassign
            result = result.replace("," /* MaskExpression.COMMA */, "." /* MaskExpression.DOT */);
        }
        const separatorPrecision = this._retrieveSeparatorPrecision(this.maskExpression);
        const separatorValue = this._replaceDecimalMarkerToDot(this._retrieveSeparatorValue(result));
        if (!this.isNumberValue) {
            return separatorValue;
        }
        if (separatorPrecision) {
            if (result === this.decimalMarker) {
                return null;
            }
            if (this.separatorLimit.length > 14) {
                return String(separatorValue);
            }
            return this._checkPrecision(this.maskExpression, separatorValue);
        }
        else {
            return separatorValue;
        }
    }
    _checkPatternForSpace() {
        for (const key in this.patterns) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.patterns[key] && this.patterns[key]?.hasOwnProperty('pattern')) {
                const patternString = this.patterns[key]?.pattern.toString();
                const pattern = this.patterns[key]?.pattern;
                if (patternString?.includes(" " /* MaskExpression.WHITE_SPACE */) &&
                    pattern?.test(this.maskExpression)) {
                    return true;
                }
            }
        }
        return false;
    }
    // TODO should think about helpers or separting decimal precision to own property
    _retrieveSeparatorPrecision(maskExpretion) {
        const matcher = maskExpretion.match(new RegExp(`^separator\\.([^d]*)`));
        return matcher ? Number(matcher[1]) : null;
    }
    _checkPrecision(separatorExpression, separatorValue) {
        const separatorPrecision = separatorExpression.slice(10, 11);
        if (separatorExpression.indexOf('2') > 0 ||
            (this.leadZero && Number(separatorPrecision) > 0)) {
            if (this.decimalMarker === "," /* MaskExpression.COMMA */ && this.leadZero) {
                // eslint-disable-next-line no-param-reassign
                separatorValue = separatorValue.replace(',', '.');
            }
            return this.leadZero
                ? Number(separatorValue).toFixed(Number(separatorPrecision))
                : Number(separatorValue).toFixed(2);
        }
        return this.numberToString(separatorValue);
    }
    _repeatPatternSymbols(maskExp) {
        return ((maskExp.match(/{[0-9]+}/) &&
            maskExp
                .split("" /* MaskExpression.EMPTY_STRING */)
                .reduce((accum, currVal, index) => {
                this._start =
                    currVal === "{" /* MaskExpression.CURLY_BRACKETS_LEFT */ ? index : this._start;
                if (currVal !== "}" /* MaskExpression.CURLY_BRACKETS_RIGHT */) {
                    return this._findSpecialChar(currVal) ? accum + currVal : accum;
                }
                this._end = index;
                const repeatNumber = Number(maskExp.slice(this._start + 1, this._end));
                const replaceWith = new Array(repeatNumber + 1).join(maskExp[this._start - 1]);
                if (maskExp.slice(0, this._start).length > 1 &&
                    maskExp.includes("S" /* MaskExpression.LETTER_S */)) {
                    const symbols = maskExp.slice(0, this._start - 1);
                    return symbols.includes("{" /* MaskExpression.CURLY_BRACKETS_LEFT */)
                        ? accum + replaceWith
                        : symbols + accum + replaceWith;
                }
                else {
                    return accum + replaceWith;
                }
            }, '')) ||
            maskExp);
    }
    currentLocaleDecimalMarker() {
        return (1.1).toLocaleString().substring(1, 2);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskService, deps: null, target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskService }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskService, decorators: [{
            type: Injectable
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LW1hc2suc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1tYXNrLWxpYi9zcmMvbGliL25neC1tYXNrLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMxRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFM0MsT0FBTyxFQUFFLGVBQWUsRUFBVyxNQUFNLG1CQUFtQixDQUFDO0FBQzdELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDOztBQUluRSxNQUFNLE9BQU8sY0FBZSxTQUFRLHFCQUFxQjtJQUR6RDs7UUFFVyxrQkFBYSxHQUFHLEtBQUssQ0FBQztRQUV0QixnQkFBVyxHQUFHLEVBQUUsQ0FBQztRQUVqQixhQUFRLEdBQWtCLElBQUksQ0FBQztRQUUvQixXQUFNLEdBQWtCLElBQUksQ0FBQztRQUVwQzs7O1dBR0c7UUFDSSxpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUVyQixnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQix5QkFBb0IsR0FBYSxFQUFFLENBQUM7UUFFcEMsd0JBQW1CLEdBQUcsS0FBSyxDQUFDO1FBRTVCLG1CQUFjLEdBQUcsRUFBRSxDQUFDO1FBRXBCLGtCQUFhLEdBQUcsRUFBRSxDQUFDO1FBRWxCLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFNM0Isb0dBQW9HO1FBQzdGLGFBQVEsR0FBRyxDQUFDLENBQU0sRUFBRSxFQUFFLEdBQUUsQ0FBQyxDQUFDO1FBRWpCLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXBELGFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFMUIsWUFBTyxHQUFH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QUFDLENBQUMsY0FBYyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDOzhHQWx2QlEsY0FBYztrSEFBZCxjQUFjOzsyRkFBZCxjQUFjO2tCQUQxQixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRWxlbWVudFJlZiwgaW5qZWN0LCBJbmplY3RhYmxlLCBSZW5kZXJlcjIgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IERPQ1VNRU5UIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuaW1wb3J0IHsgTkdYX01BU0tfQ09ORklHLCBJQ29uZmlnIH0gZnJvbSAnLi9uZ3gtbWFzay5jb25maWcnO1xuaW1wb3J0IHsgTmd4TWFza0FwcGxpZXJTZXJ2aWNlIH0gZnJvbSAnLi9uZ3gtbWFzay1hcHBsaWVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFza0V4cHJlc3Npb24gfSBmcm9tICcuL25neC1tYXNrLWV4cHJlc3Npb24uZW51bSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBOZ3hNYXNrU2VydmljZSBleHRlbmRzIE5neE1hc2tBcHBsaWVyU2VydmljZSB7XG4gICAgcHVibGljIGlzTnVtYmVyVmFsdWUgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBtYXNrSXNTaG93biA9ICcnO1xuXG4gICAgcHVibGljIHNlbFN0YXJ0OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgIHB1YmxpYyBzZWxFbmQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB3ZSBhcmUgY3VycmVudGx5IGluIHdyaXRlVmFsdWUgZnVuY3Rpb24sIGluIHRoaXMgY2FzZSB3aGVuIGFwcGx5aW5nIHRoZSBtYXNrIHdlIGRvbid0IHdhbnQgdG8gdHJpZ2dlciBvbkNoYW5nZSBmdW5jdGlvbixcbiAgICAgKiBzaW5jZSB3cml0ZVZhbHVlIHNob3VsZCBiZSBhIG9uZSB3YXkgb25seSBwcm9jZXNzIG9mIHdyaXRpbmcgdGhlIERPTSB2YWx1ZSBiYXNlZCBvbiB0aGUgQW5ndWxhciBtb2RlbCB2YWx1ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgd3JpdGluZ1ZhbHVlID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgbWFza0NoYW5nZWQgPSBmYWxzZTtcbiAgICBwdWJsaWMgX21hc2tFeHByZXNzaW9uQXJyYXk6IHN0cmluZ1tdID0gW107XG5cbiAgICBwdWJsaWMgdHJpZ2dlck9uTWFza0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgcHVibGljIF9wcmV2aW91c1ZhbHVlID0gJyc7XG5cbiAgICBwdWJsaWMgX2N1cnJlbnRWYWx1ZSA9ICcnO1xuXG4gICAgcHJpdmF0ZSBfZW1pdFZhbHVlID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIF9zdGFydCE6IG51bWJlcjtcblxuICAgIHByaXZhdGUgX2VuZCE6IG51bWJlcjtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb24sIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICBwdWJsaWMgb25DaGFuZ2UgPSAoXzogYW55KSA9PiB7fTtcblxuICAgIHB1YmxpYyByZWFkb25seSBfZWxlbWVudFJlZiA9IGluamVjdChFbGVtZW50UmVmLCB7IG9wdGlvbmFsOiB0cnVlIH0pO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBkb2N1bWVudCA9IGluamVjdChET0NVTUVOVCk7XG5cbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgX2NvbmZpZyA9IGluamVjdDxJQ29uZmlnPihOR1hfTUFTS19DT05GSUcpO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBfcmVuZGVyZXIgPSBpbmplY3QoUmVuZGVyZXIyLCB7IG9wdGlvbmFsOiB0cnVlIH0pO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgICBwdWJsaWMgb3ZlcnJpZGUgYXBwbHlNYXNrKFxuICAgICAgICBpbnB1dFZhbHVlOiBzdHJpbmcsXG4gICAgICAgIG1hc2tFeHByZXNzaW9uOiBzdHJpbmcsXG4gICAgICAgIHBvc2l0aW9uID0gMCxcbiAgICAgICAganVzdFBhc3RlZCA9IGZhbHNlLFxuICAgICAgICBiYWNrc3BhY2VkID0gZmFsc2UsXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb24sIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgICAgY2I6ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55ID0gKCkgPT4ge31cbiAgICApOiBzdHJpbmcge1xuICAgICAgICBpZiAoIW1hc2tFeHByZXNzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZSAhPT0gdGhpcy5hY3R1YWxWYWx1ZSA/IHRoaXMuYWN0dWFsVmFsdWUgOiBpbnB1dFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFza0lzU2hvd24gPSB0aGlzLnNob3dNYXNrVHlwZWRcbiAgICAgICAgICAgID8gdGhpcy5zaG93TWFza0luSW5wdXQoKVxuICAgICAgICAgICAgOiBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkc7XG4gICAgICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5JUCAmJiB0aGlzLnNob3dNYXNrVHlwZWQpIHtcbiAgICAgICAgICAgIHRoaXMubWFza0lzU2hvd24gPSB0aGlzLnNob3dNYXNrSW5JbnB1dChpbnB1dFZhbHVlIHx8IE1hc2tFeHByZXNzaW9uLkhBU0gpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5DUEZfQ05QSiAmJiB0aGlzLnNob3dNYXNrVHlwZWQpIHtcbiAgICAgICAgICAgIHRoaXMubWFza0lzU2hvd24gPSB0aGlzLnNob3dNYXNrSW5JbnB1dChpbnB1dFZhbHVlIHx8IE1hc2tFeHByZXNzaW9uLkhBU0gpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaW5wdXRWYWx1ZSAmJiB0aGlzLnNob3dNYXNrVHlwZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybUNvbnRyb2xSZXN1bHQodGhpcy5wcmVmaXgpO1xuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMucHJlZml4fSR7dGhpcy5tYXNrSXNTaG93bn0ke3RoaXMuc3VmZml4fWA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBnZXRTeW1ib2w6IHN0cmluZyA9XG4gICAgICAgICAgICAhIWlucHV0VmFsdWUgJiYgdHlwZW9mIHRoaXMuc2VsU3RhcnQgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgPyBpbnB1dFZhbHVlW3RoaXMuc2VsU3RhcnRdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICAgIDogTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICBsZXQgbmV3SW5wdXRWYWx1ZSA9ICcnO1xuICAgICAgICBpZiAodGhpcy5oaWRkZW5JbnB1dCAhPT0gdW5kZWZpbmVkICYmICF0aGlzLndyaXRpbmdWYWx1ZSkge1xuICAgICAgICAgICAgbGV0IGFjdHVhbFJlc3VsdDogc3RyaW5nW10gPVxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgJiYgaW5wdXRWYWx1ZS5sZW5ndGggPT09IDFcbiAgICAgICAgICAgICAgICAgICAgPyBpbnB1dFZhbHVlLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORylcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmFjdHVhbFZhbHVlLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORyk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZSAgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC1leHByZXNzaW9uc1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5zZWxTdGFydCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHRoaXMuc2VsRW5kID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsU3RhcnQgPSBOdW1iZXIodGhpcy5zZWxTdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxFbmQgPSBOdW1iZXIodGhpcy5zZWxFbmQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlICE9PSBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcgJiYgYWN0dWFsUmVzdWx0Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICA/IHR5cGVvZiB0aGlzLnNlbFN0YXJ0ID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgdGhpcy5zZWxFbmQgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGlucHV0VmFsdWUubGVuZ3RoID4gYWN0dWFsUmVzdWx0Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWN0dWFsUmVzdWx0LnNwbGljZSh0aGlzLnNlbFN0YXJ0LCAwLCBnZXRTeW1ib2wpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbnB1dFZhbHVlLmxlbmd0aCA8IGFjdHVhbFJlc3VsdC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWN0dWFsUmVzdWx0Lmxlbmd0aCAtIGlucHV0VmFsdWUubGVuZ3RoID09PSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBiYWNrc3BhY2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWN0dWFsUmVzdWx0LnNwbGljZSh0aGlzLnNlbFN0YXJ0IC0gMSwgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBhY3R1YWxSZXN1bHQuc3BsaWNlKGlucHV0VmFsdWUubGVuZ3RoIC0gMSwgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGFjdHVhbFJlc3VsdC5zcGxpY2UodGhpcy5zZWxTdGFydCwgdGhpcy5zZWxFbmQgLSB0aGlzLnNlbFN0YXJ0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgOiAoYWN0dWFsUmVzdWx0ID0gW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc2hvd01hc2tUeXBlZCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oaWRkZW5JbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMucmVtb3ZlTWFzayhpbnB1dFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlc2xpbnQtZW5hYmxlICBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLWV4cHJlc3Npb25zXG4gICAgICAgICAgICBuZXdJbnB1dFZhbHVlID1cbiAgICAgICAgICAgICAgICB0aGlzLmFjdHVhbFZhbHVlLmxlbmd0aCAmJiBhY3R1YWxSZXN1bHQubGVuZ3RoIDw9IGlucHV0VmFsdWUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgID8gdGhpcy5zaGlmdFR5cGVkU3ltYm9scyhhY3R1YWxSZXN1bHQuam9pbihNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpKVxuICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGp1c3RQYXN0ZWQgJiYgKHRoaXMuaGlkZGVuSW5wdXQgfHwgIXRoaXMuaGlkZGVuSW5wdXQpKSB7XG4gICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gaW5wdXRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBiYWNrc3BhY2VkICYmXG4gICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbltwb3NpdGlvbl0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICApICE9PSAtMSAmJlxuICAgICAgICAgICAgdGhpcy5zaG93TWFza1R5cGVkICYmXG4gICAgICAgICAgICAhdGhpcy5wcmVmaXhcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gdGhpcy5fY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRlbGV0ZWRTcGVjaWFsQ2hhcmFjdGVyICYmIHBvc2l0aW9uKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyh0aGlzLmFjdHVhbFZhbHVlLnNsaWNlKHBvc2l0aW9uLCBwb3NpdGlvbiArIDEpKSkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXNrRXhwcmVzc2lvbi5zbGljZShwb3NpdGlvbiAtIDEsIHBvc2l0aW9uICsgMSkgIT09IE1hc2tFeHByZXNzaW9uLk1PTlRIUykge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gLSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZWRTcGVjaWFsQ2hhcmFjdGVyID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5zaG93TWFza1R5cGVkICYmXG4gICAgICAgICAgICB0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICAgICAgIXRoaXMubGVhZFplcm9EYXRlVGltZVxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMucmVtb3ZlTWFzayhpbnB1dFZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm1hc2tDaGFuZ2VkKSB7XG4gICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gaW5wdXRWYWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld0lucHV0VmFsdWUgPVxuICAgICAgICAgICAgICAgIEJvb2xlYW4obmV3SW5wdXRWYWx1ZSkgJiYgbmV3SW5wdXRWYWx1ZS5sZW5ndGggPyBuZXdJbnB1dFZhbHVlIDogaW5wdXRWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNob3dNYXNrVHlwZWQgJiYgdGhpcy5rZWVwQ2hhcmFjdGVyUG9zaXRpb25zICYmIHRoaXMuYWN0dWFsVmFsdWUgJiYgIWp1c3RQYXN0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICA/IHRoaXMucmVtb3ZlTWFzayh0aGlzLmFjdHVhbFZhbHVlKVxuICAgICAgICAgICAgICAgIDogdGhpcy5hY3R1YWxWYWx1ZTtcbiAgICAgICAgICAgIHRoaXMuZm9ybUNvbnRyb2xSZXN1bHQodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0dWFsVmFsdWVcbiAgICAgICAgICAgICAgICA/IHRoaXMuYWN0dWFsVmFsdWVcbiAgICAgICAgICAgICAgICA6IGAke3RoaXMucHJlZml4fSR7dGhpcy5tYXNrSXNTaG93bn0ke3RoaXMuc3VmZml4fWA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHQ6IHN0cmluZyA9IHN1cGVyLmFwcGx5TWFzayhcbiAgICAgICAgICAgIG5ld0lucHV0VmFsdWUsXG4gICAgICAgICAgICBtYXNrRXhwcmVzc2lvbixcbiAgICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgICAganVzdFBhc3RlZCxcbiAgICAgICAgICAgIGJhY2tzcGFjZWQsXG4gICAgICAgICAgICBjYlxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuYWN0dWFsVmFsdWUgPSB0aGlzLmdldEFjdHVhbFZhbHVlKHJlc3VsdCk7XG4gICAgICAgIC8vIGhhbmRsZSBzb21lIHNlcGFyYXRvciBpbXBsaWNhdGlvbnM6XG4gICAgICAgIC8vIGEuKSBhZGp1c3QgZGVjaW1hbE1hcmtlciBkZWZhdWx0ICguIC0+ICwpIGlmIHRob3VzYW5kU2VwYXJhdG9yIGlzIGEgZG90XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMudGhvdXNhbmRTZXBhcmF0b3IgPT09IE1hc2tFeHByZXNzaW9uLkRPVCAmJlxuICAgICAgICAgICAgdGhpcy5kZWNpbWFsTWFya2VyID09PSBNYXNrRXhwcmVzc2lvbi5ET1RcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIgPSBNYXNrRXhwcmVzc2lvbi5DT01NQTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGIpIHJlbW92ZSBkZWNpbWFsIG1hcmtlciBmcm9tIGxpc3Qgb2Ygc3BlY2lhbCBjaGFyYWN0ZXJzIHRvIG1hc2tcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlNFUEFSQVRPUikgJiZcbiAgICAgICAgICAgIHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzID09PSB0cnVlXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5zcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuZmlsdGVyKFxuICAgICAgICAgICAgICAgIChpdGVtOiBzdHJpbmcpID0+XG4gICAgICAgICAgICAgICAgICAgICF0aGlzLl9jb21wYXJlT3JJbmNsdWRlcyhpdGVtLCB0aGlzLmRlY2ltYWxNYXJrZXIsIHRoaXMudGhvdXNhbmRTZXBhcmF0b3IpIC8vaXRlbSAhPT0gdGhpcy5kZWNpbWFsTWFya2VyLCAvLyAhXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3VsdCB8fCByZXN1bHQgPT09ICcnKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmV2aW91c1ZhbHVlID0gdGhpcy5fY3VycmVudFZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudFZhbHVlID0gcmVzdWx0O1xuICAgICAgICAgICAgdGhpcy5fZW1pdFZhbHVlID1cbiAgICAgICAgICAgICAgICB0aGlzLl9wcmV2aW91c1ZhbHVlICE9PSB0aGlzLl9jdXJyZW50VmFsdWUgfHxcbiAgICAgICAgICAgICAgICB0aGlzLm1hc2tDaGFuZ2VkIHx8XG4gICAgICAgICAgICAgICAgKHRoaXMuX3ByZXZpb3VzVmFsdWUgPT09IHRoaXMuX2N1cnJlbnRWYWx1ZSAmJiBqdXN0UGFzdGVkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9lbWl0VmFsdWVcbiAgICAgICAgICAgID8gdGhpcy53cml0aW5nVmFsdWVcbiAgICAgICAgICAgICAgICA/IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLmZvcm1Db250cm9sUmVzdWx0KHJlc3VsdCkpXG4gICAgICAgICAgICAgICAgOiB0aGlzLmZvcm1Db250cm9sUmVzdWx0KHJlc3VsdClcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGlmICghdGhpcy5zaG93TWFza1R5cGVkIHx8ICh0aGlzLnNob3dNYXNrVHlwZWQgJiYgdGhpcy5oaWRkZW5JbnB1dCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhpZGRlbklucHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGJhY2tzcGFjZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGlkZUlucHV0KHJlc3VsdCwgdGhpcy5tYXNrRXhwcmVzc2lvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLmhpZGVJbnB1dChyZXN1bHQsIHRoaXMubWFza0V4cHJlc3Npb24pfSR7dGhpcy5tYXNrSXNTaG93bi5zbGljZShyZXN1bHQubGVuZ3RoKX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXNMZW46IG51bWJlciA9IHJlc3VsdC5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHByZWZObWFzazogc3RyaW5nID0gYCR7dGhpcy5wcmVmaXh9JHt0aGlzLm1hc2tJc1Nob3dufSR7dGhpcy5zdWZmaXh9YDtcblxuICAgICAgICBpZiAodGhpcy5tYXNrRXhwcmVzc2lvbi5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5IT1VSUykpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvdW50U2tpcGVkU3ltYm9sID0gdGhpcy5fbnVtYmVyU2tpcGVkU3ltYm9scyhyZXN1bHQpO1xuICAgICAgICAgICAgcmV0dXJuIGAke3Jlc3VsdH0ke3ByZWZObWFzay5zbGljZShyZXNMZW4gKyBjb3VudFNraXBlZFN5bWJvbCl9YDtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLklQIHx8XG4gICAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5DUEZfQ05QSlxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtyZXN1bHR9JHtwcmVmTm1hc2t9YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7cmVzdWx0fSR7cHJlZk5tYXNrLnNsaWNlKHJlc0xlbil9YDtcbiAgICB9XG5cbiAgICAvLyBnZXQgdGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgd2VyZSBzaGlmdGVkXG4gICAgcHJpdmF0ZSBfbnVtYmVyU2tpcGVkU3ltYm9scyh2YWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgcmVnZXggPSAvKF58XFxEKShcXGRcXEQpL2c7XG4gICAgICAgIGxldCBtYXRjaCA9IHJlZ2V4LmV4ZWModmFsdWUpO1xuICAgICAgICBsZXQgY291bnRTa2lwZWRTeW1ib2wgPSAwO1xuICAgICAgICB3aGlsZSAobWF0Y2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgY291bnRTa2lwZWRTeW1ib2wgKz0gMTtcbiAgICAgICAgICAgIG1hdGNoID0gcmVnZXguZXhlYyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvdW50U2tpcGVkU3ltYm9sO1xuICAgIH1cblxuICAgIHB1YmxpYyBhcHBseVZhbHVlQ2hhbmdlcyhcbiAgICAgICAgcG9zaXRpb246IG51bWJlcixcbiAgICAgICAganVzdFBhc3RlZDogYm9vbGVhbixcbiAgICAgICAgYmFja3NwYWNlZDogYm9vbGVhbixcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvbiwgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgICBjYjogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkgPSAoKSA9PiB7fVxuICAgICk6IHZvaWQge1xuICAgICAgICBjb25zdCBmb3JtRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWY/Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGlmICghZm9ybUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1FbGVtZW50LnZhbHVlID0gdGhpcy5hcHBseU1hc2soXG4gICAgICAgICAgICBmb3JtRWxlbWVudC52YWx1ZSxcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24sXG4gICAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICAgIGp1c3RQYXN0ZWQsXG4gICAgICAgICAgICBiYWNrc3BhY2VkLFxuICAgICAgICAgICAgY2JcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGZvcm1FbGVtZW50ID09PSB0aGlzLl9nZXRBY3RpdmVFbGVtZW50KCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFySWZOb3RNYXRjaEZuKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGhpZGVJbnB1dChpbnB1dFZhbHVlOiBzdHJpbmcsIG1hc2tFeHByZXNzaW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZVxuICAgICAgICAgICAgLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORylcbiAgICAgICAgICAgIC5tYXAoKGN1cnI6IHN0cmluZywgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXR0ZXJucyAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhdHRlcm5zW21hc2tFeHByZXNzaW9uW2luZGV4XSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkddICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGF0dGVybnNbbWFza0V4cHJlc3Npb25baW5kZXhdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR10/LnN5bWJvbFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltpbmRleF0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXVxuICAgICAgICAgICAgICAgICAgICAgICAgPy5zeW1ib2w7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORyk7XG4gICAgfVxuXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBub3QgbmVjZXNzYXJ5LCBpdCBjaGVja3MgcmVzdWx0IGFnYWluc3QgbWFza0V4cHJlc3Npb25cbiAgICBwdWJsaWMgZ2V0QWN0dWFsVmFsdWUocmVzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBjb21wYXJlOiBzdHJpbmdbXSA9IHJlc1xuICAgICAgICAgICAgLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORylcbiAgICAgICAgICAgIC5maWx0ZXIoKHN5bWJvbDogc3RyaW5nLCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXNrQ2hhciA9IHRoaXMubWFza0V4cHJlc3Npb25baV0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9sTWFzayhzeW1ib2wsIG1hc2tDaGFyKSB8fFxuICAgICAgICAgICAgICAgICAgICAodGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhtYXNrQ2hhcikgJiYgc3ltYm9sID09PSBtYXNrQ2hhcilcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIGlmIChjb21wYXJlLmpvaW4oTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKSA9PT0gcmVzKSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcGFyZS5qb2luKE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2hpZnRUeXBlZFN5bWJvbHMoaW5wdXRWYWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IHN5bWJvbFRvUmVwbGFjZSA9ICcnO1xuICAgICAgICBjb25zdCBuZXdJbnB1dFZhbHVlOiAoc3RyaW5nIHwgdW5kZWZpbmVkKVtdID1cbiAgICAgICAgICAgIChpbnB1dFZhbHVlICYmXG4gICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChjdXJyU3ltYm9sOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlW2luZGV4ICsgMV0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbaW5kZXggKyAxXSAhPT0gdGhpcy5tYXNrRXhwcmVzc2lvbltpbmRleCArIDFdXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW1ib2xUb1JlcGxhY2UgPSBjdXJyU3ltYm9sO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dFZhbHVlW2luZGV4ICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3ltYm9sVG9SZXBsYWNlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VTeW1ib2w6IHN0cmluZyA9IHN5bWJvbFRvUmVwbGFjZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW1ib2xUb1JlcGxhY2UgPSBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VTeW1ib2w7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VyclN5bWJvbDtcbiAgICAgICAgICAgICAgICAgICAgfSkpIHx8XG4gICAgICAgICAgICBbXTtcbiAgICAgICAgcmV0dXJuIG5ld0lucHV0VmFsdWUuam9pbihNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgbnVtYmVyIHZhbHVlIHRvIHN0cmluZ1xuICAgICAqIDMuMTQxNSAtPiAnMy4xNDE1J1xuICAgICAqIDFlLTcgLT4gJzAuMDAwMDAwMSdcbiAgICAgKi9cbiAgICBwdWJsaWMgbnVtYmVyVG9TdHJpbmcodmFsdWU6IG51bWJlciB8IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHx8XG4gICAgICAgICAgICAodGhpcy5tYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlNFUEFSQVRPUikgJiZcbiAgICAgICAgICAgICAgICAodGhpcy5sZWFkWmVybyB8fCAhdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMpKSB8fFxuICAgICAgICAgICAgKHRoaXMubWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChNYXNrRXhwcmVzc2lvbi5TRVBBUkFUT1IpICYmXG4gICAgICAgICAgICAgICAgdGhpcy5zZXBhcmF0b3JMaW1pdC5sZW5ndGggPiAxNCAmJlxuICAgICAgICAgICAgICAgIFN0cmluZyh2YWx1ZSkubGVuZ3RoID4gMTQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE51bWJlcih2YWx1ZSlcbiAgICAgICAgICAgIC50b0xvY2FsZVN0cmluZygnZnVsbHdpZGUnLCB7XG4gICAgICAgICAgICAgICAgdXNlR3JvdXBpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMjAsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnJlcGxhY2UoYC8ke01hc2tFeHByZXNzaW9uLk1JTlVTfS9gLCBNYXNrRXhwcmVzc2lvbi5NSU5VUyk7XG4gICAgfVxuXG4gICAgcHVibGljIHNob3dNYXNrSW5JbnB1dChpbnB1dFZhbD86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmICh0aGlzLnNob3dNYXNrVHlwZWQgJiYgISF0aGlzLnNob3duTWFza0V4cHJlc3Npb24pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uLmxlbmd0aCAhPT0gdGhpcy5zaG93bk1hc2tFeHByZXNzaW9uLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWFzayBleHByZXNzaW9uIG11c3QgbWF0Y2ggbWFzayBwbGFjZWhvbGRlciBsZW5ndGgnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2hvd25NYXNrRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNob3dNYXNrVHlwZWQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dFZhbCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5JUCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2tGb3JJcChpbnB1dFZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5DUEZfQ05QSikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2tGb3JDcGZDbnBqKGlucHV0VmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlci5sZW5ndGggPT09IHRoaXMubWFza0V4cHJlc3Npb24ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXNrRXhwcmVzc2lvbi5yZXBsYWNlKC9cXHcvZywgdGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbGVhcklmTm90TWF0Y2hGbigpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZm9ybUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmPy5uYXRpdmVFbGVtZW50O1xuICAgICAgICBpZiAoIWZvcm1FbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5jbGVhcklmTm90TWF0Y2ggJiZcbiAgICAgICAgICAgIHRoaXMucHJlZml4Lmxlbmd0aCArIHRoaXMubWFza0V4cHJlc3Npb24ubGVuZ3RoICsgdGhpcy5zdWZmaXgubGVuZ3RoICE9PVxuICAgICAgICAgICAgICAgIGZvcm1FbGVtZW50LnZhbHVlLnJlcGxhY2UodGhpcy5wbGFjZUhvbGRlckNoYXJhY3RlciwgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgICAgICAgICAubGVuZ3RoXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5mb3JtRWxlbWVudFByb3BlcnR5ID0gWyd2YWx1ZScsIE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR107XG4gICAgICAgICAgICB0aGlzLmFwcGx5TWFzaygnJywgdGhpcy5tYXNrRXhwcmVzc2lvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGZvcm1FbGVtZW50UHJvcGVydHkoW25hbWUsIHZhbHVlXTogW3N0cmluZywgc3RyaW5nIHwgYm9vbGVhbl0pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlciB8fCAhdGhpcy5fZWxlbWVudFJlZikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vW1RPRE9dOiBhbmRyaWlrYW1hbGRpbm92MSBmaW5kIGJldHRlciBzb2x1dGlvblxuICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlcj8uc2V0UHJvcGVydHkodGhpcy5fZWxlbWVudFJlZj8ubmF0aXZlRWxlbWVudCwgbmFtZSwgdmFsdWUpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHVibGljIGNoZWNrRHJvcFNwZWNpYWxDaGFyQW1vdW50KG1hc2s6IHN0cmluZyk6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IGNoYXJzOiBzdHJpbmdbXSA9IG1hc2tcbiAgICAgICAgICAgIC5zcGxpdChNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtOiBzdHJpbmcpID0+IHRoaXMuX2ZpbmREcm9wU3BlY2lhbENoYXIoaXRlbSkpO1xuICAgICAgICByZXR1cm4gY2hhcnMubGVuZ3RoO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVNYXNrKGlucHV0VmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZW1vdmVNYXNrKFxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlU3VmZml4KHRoaXMuX3JlbW92ZVByZWZpeChpbnB1dFZhbHVlKSksXG4gICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmNvbmNhdCgnXycpLmNvbmNhdCh0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NoZWNrRm9ySXAoaW5wdXRWYWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmIChpbnB1dFZhbCA9PT0gTWFza0V4cHJlc3Npb24uSEFTSCkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9LiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0uJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfS4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhcnI6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRWYWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5wdXRWYWxbaV0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoKCdcXFxcZCcpKSB7XG4gICAgICAgICAgICAgICAgYXJyLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoIDw9IDMpIHtcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfS4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9LiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID4gMyAmJiBhcnIubGVuZ3RoIDw9IDYpIHtcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfS4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA+IDYgJiYgYXJyLmxlbmd0aCA8PSA5KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wbGFjZUhvbGRlckNoYXJhY3RlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA+IDkgJiYgYXJyLmxlbmd0aCA8PSAxMikge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jaGVja0ZvckNwZkNucGooaW5wdXRWYWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGNwZiA9XG4gICAgICAgICAgICBgJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YCArXG4gICAgICAgICAgICBgLiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWAgK1xuICAgICAgICAgICAgYC4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcbiAgICAgICAgICAgIGAtJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gO1xuICAgICAgICBjb25zdCBjbnBqID1cbiAgICAgICAgICAgIGAke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWAgK1xuICAgICAgICAgICAgYC4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcbiAgICAgICAgICAgIGAuJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YCArXG4gICAgICAgICAgICBgLyR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcbiAgICAgICAgICAgIGAtJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gO1xuXG4gICAgICAgIGlmIChpbnB1dFZhbCA9PT0gTWFza0V4cHJlc3Npb24uSEFTSCkge1xuICAgICAgICAgICAgcmV0dXJuIGNwZjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhcnI6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRWYWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5wdXRWYWxbaV0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoKCdcXFxcZCcpKSB7XG4gICAgICAgICAgICAgICAgYXJyLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoIDw9IDMpIHtcbiAgICAgICAgICAgIHJldHVybiBjcGYuc2xpY2UoYXJyLmxlbmd0aCwgY3BmLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyci5sZW5ndGggPiAzICYmIGFyci5sZW5ndGggPD0gNikge1xuICAgICAgICAgICAgcmV0dXJuIGNwZi5zbGljZShhcnIubGVuZ3RoICsgMSwgY3BmLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyci5sZW5ndGggPiA2ICYmIGFyci5sZW5ndGggPD0gOSkge1xuICAgICAgICAgICAgcmV0dXJuIGNwZi5zbGljZShhcnIubGVuZ3RoICsgMiwgY3BmLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyci5sZW5ndGggPiA5ICYmIGFyci5sZW5ndGggPCAxMSkge1xuICAgICAgICAgICAgcmV0dXJuIGNwZi5zbGljZShhcnIubGVuZ3RoICsgMywgY3BmLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT09IDExKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT09IDEyKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXRWYWwubGVuZ3RoID09PSAxNykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbnBqLnNsaWNlKDE2LCBjbnBqLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY25wai5zbGljZSgxNSwgY25wai5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID4gMTIgJiYgYXJyLmxlbmd0aCA8PSAxNCkge1xuICAgICAgICAgICAgcmV0dXJuIGNucGouc2xpY2UoYXJyLmxlbmd0aCArIDQsIGNucGoubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjdXJzaXZlbHkgZGV0ZXJtaW5lIHRoZSBjdXJyZW50IGFjdGl2ZSBlbGVtZW50IGJ5IG5hdmlnYXRpbmcgdGhlIFNoYWRvdyBET00gdW50aWwgdGhlIEFjdGl2ZSBFbGVtZW50IGlzIGZvdW5kLlxuICAgICAqL1xuICAgIHByaXZhdGUgX2dldEFjdGl2ZUVsZW1lbnQoZG9jdW1lbnQ6IERvY3VtZW50T3JTaGFkb3dSb290ID0gdGhpcy5kb2N1bWVudCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICAgICAgY29uc3Qgc2hhZG93Um9vdEVsID0gZG9jdW1lbnQ/LmFjdGl2ZUVsZW1lbnQ/LnNoYWRvd1Jvb3Q7XG4gICAgICAgIGlmICghc2hhZG93Um9vdEVsPy5hY3RpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXRBY3RpdmVFbGVtZW50KHNoYWRvd1Jvb3RFbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9wb2dhdGVzIHRoZSBpbnB1dCB2YWx1ZSBiYWNrIHRvIHRoZSBBbmd1bGFyIG1vZGVsIGJ5IHRyaWdnZXJpbmcgdGhlIG9uQ2hhbmdlIGZ1bmN0aW9uLiBJdCB3b24ndCBkbyB0aGlzIGlmIHdyaXRpbmdWYWx1ZVxuICAgICAqIGlzIHRydWUuIElmIHRoYXQgaXMgdHJ1ZSBpdCBtZWFucyB3ZSBhcmUgY3VycmVudGx5IGluIHRoZSB3cml0ZVZhbHVlIGZ1bmN0aW9uLCB3aGljaCBpcyBzdXBwb3NlZCB0byBvbmx5IHVwZGF0ZSB0aGUgYWN0dWFsXG4gICAgICogRE9NIGVsZW1lbnQgYmFzZWQgb24gdGhlIEFuZ3VsYXIgbW9kZWwgdmFsdWUuIEl0IHNob3VsZCBiZSBhIG9uZSB3YXkgcHJvY2VzcywgaS5lLiB3cml0ZVZhbHVlIHNob3VsZCBub3QgYmUgbW9kaWZ5aW5nIHRoZSBBbmd1bGFyXG4gICAgICogbW9kZWwgdmFsdWUgdG9vLiBUaGVyZWZvcmUsIHdlIGRvbid0IHRyaWdnZXIgb25DaGFuZ2UgaW4gdGhpcyBzY2VuYXJpby5cbiAgICAgKiBAcGFyYW0gaW5wdXRWYWx1ZSB0aGUgY3VycmVudCBmb3JtIGlucHV0IHZhbHVlXG4gICAgICovXG4gICAgcHJpdmF0ZSBmb3JtQ29udHJvbFJlc3VsdChpbnB1dFZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMud3JpdGluZ1ZhbHVlIHx8ICghdGhpcy50cmlnZ2VyT25NYXNrQ2hhbmdlICYmIHRoaXMubWFza0NoYW5nZWQpKSB7XG4gICAgICAgICAgICB0aGlzLm1hc2tDaGFuZ2VkXG4gICAgICAgICAgICAgICAgPyB0aGlzLm9uQ2hhbmdlKFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0VHJhbnNmb3JtRm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3RvTnVtYmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xzKHRoaXMuX3JlbW92ZVN1ZmZpeCh0aGlzLl9yZW1vdmVQcmVmaXgoaW5wdXRWYWx1ZSkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICB0aGlzLm1hc2tDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMpKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ2hhbmdlKFxuICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0VHJhbnNmb3JtRm4oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RvTnVtYmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZU1hc2soXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZVN1ZmZpeCh0aGlzLl9yZW1vdmVQcmVmaXgoaW5wdXRWYWx1ZSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICB0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVycyB8fFxuICAgICAgICAgICAgKCF0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVycyAmJiB0aGlzLnByZWZpeCA9PT0gaW5wdXRWYWx1ZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ2hhbmdlKFxuICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0VHJhbnNmb3JtRm4oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RvTnVtYmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xzKHRoaXMuX3JlbW92ZVN1ZmZpeCh0aGlzLl9yZW1vdmVQcmVmaXgoaW5wdXRWYWx1ZSkpKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25DaGFuZ2UodGhpcy5vdXRwdXRUcmFuc2Zvcm1Gbih0aGlzLl90b051bWJlcihpbnB1dFZhbHVlKSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfdG9OdW1iZXIodmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzTnVtYmVyVmFsdWUgfHwgdmFsdWUgPT09IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChNYXNrRXhwcmVzc2lvbi5TRVBBUkFUT1IpICYmXG4gICAgICAgICAgICAodGhpcy5sZWFkWmVybyB8fCAhdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChTdHJpbmcodmFsdWUpLmxlbmd0aCA+IDE2ICYmIHRoaXMuc2VwYXJhdG9yTGltaXQubGVuZ3RoID4gMTQpIHtcbiAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG51bSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoTWFza0V4cHJlc3Npb24uU0VQQVJBVE9SKSAmJiBOdW1iZXIuaXNOYU4obnVtKSkge1xuICAgICAgICAgICAgY29uc3QgdmFsID0gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKCcsJywgJy4nKTtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIodmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBOdW1iZXIuaXNOYU4obnVtKSA/IHZhbHVlIDogbnVtO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlbW92ZU1hc2sodmFsdWU6IHN0cmluZywgc3BlY2lhbENoYXJhY3RlcnNGb3JSZW1vdmU6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlBFUkNFTlQpICYmXG4gICAgICAgICAgICB2YWx1ZS5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5ET1QpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICA/IHZhbHVlLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICB0aGlzLl9yZWdFeHBGb3JSZW1vdmUoc3BlY2lhbENoYXJhY3RlcnNGb3JSZW1vdmUpLFxuICAgICAgICAgICAgICAgICAgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIDogdmFsdWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVtb3ZlUHJlZml4KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIXRoaXMucHJlZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlID8gdmFsdWUucmVwbGFjZSh0aGlzLnByZWZpeCwgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlbW92ZVN1ZmZpeCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCF0aGlzLnN1ZmZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZSA/IHZhbHVlLnJlcGxhY2UodGhpcy5zdWZmaXgsIE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORykgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXRyaWV2ZVNlcGFyYXRvclZhbHVlKHJlc3VsdDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IHNwZWNpYWxDaGFyYWN0ZXJzID0gQXJyYXkuaXNBcnJheSh0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVycylcbiAgICAgICAgICAgID8gdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5maWx0ZXIoKHYpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMgYXMgc3RyaW5nW10pLmluY2x1ZGVzKHYpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5kZWxldGVkU3BlY2lhbENoYXJhY3RlciAmJlxuICAgICAgICAgICAgdGhpcy5fY2hlY2tQYXR0ZXJuRm9yU3BhY2UoKSAmJlxuICAgICAgICAgICAgcmVzdWx0LmluY2x1ZGVzKE1hc2tFeHByZXNzaW9uLldISVRFX1NQQUNFKSAmJlxuICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbi5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5TWU1CT0xfU1RBUilcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBzcGVjaWFsQ2hhcmFjdGVycyA9IHNwZWNpYWxDaGFyYWN0ZXJzLmZpbHRlcihcbiAgICAgICAgICAgICAgICAoY2hhcikgPT4gY2hhciAhPT0gTWFza0V4cHJlc3Npb24uV0hJVEVfU1BBQ0VcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbW92ZU1hc2socmVzdWx0LCBzcGVjaWFsQ2hhcmFjdGVycyBhcyBzdHJpbmdbXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVnRXhwRm9yUmVtb3ZlKHNwZWNpYWxDaGFyYWN0ZXJzRm9yUmVtb3ZlOiBzdHJpbmdbXSk6IFJlZ0V4cCB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgc3BlY2lhbENoYXJhY3RlcnNGb3JSZW1vdmUubWFwKChpdGVtOiBzdHJpbmcpID0+IGBcXFxcJHtpdGVtfWApLmpvaW4oJ3wnKSxcbiAgICAgICAgICAgICdnaSdcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXBsYWNlRGVjaW1hbE1hcmtlclRvRG90KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBtYXJrZXJzID0gQXJyYXkuaXNBcnJheSh0aGlzLmRlY2ltYWxNYXJrZXIpXG4gICAgICAgICAgICA/IHRoaXMuZGVjaW1hbE1hcmtlclxuICAgICAgICAgICAgOiBbdGhpcy5kZWNpbWFsTWFya2VyXTtcblxuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZSh0aGlzLl9yZWdFeHBGb3JSZW1vdmUobWFya2VycyksIE1hc2tFeHByZXNzaW9uLkRPVCk7XG4gICAgfVxuXG4gICAgcHVibGljIF9jaGVja1N5bWJvbHMocmVzdWx0OiBzdHJpbmcpOiBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsIHtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlBFUkNFTlQpICYmXG4gICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIgPT09IE1hc2tFeHByZXNzaW9uLkNPTU1BXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShNYXNrRXhwcmVzc2lvbi5DT01NQSwgTWFza0V4cHJlc3Npb24uRE9UKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZXBhcmF0b3JQcmVjaXNpb246IG51bWJlciB8IG51bGwgPSB0aGlzLl9yZXRyaWV2ZVNlcGFyYXRvclByZWNpc2lvbihcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb25cbiAgICAgICAgKTtcbiAgICAgICAgY29uc3Qgc2VwYXJhdG9yVmFsdWU6IHN0cmluZyA9IHRoaXMuX3JlcGxhY2VEZWNpbWFsTWFya2VyVG9Eb3QoXG4gICAgICAgICAgICB0aGlzLl9yZXRyaWV2ZVNlcGFyYXRvclZhbHVlKHJlc3VsdClcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXRoaXMuaXNOdW1iZXJWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlcGFyYXRvclZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZXBhcmF0b3JQcmVjaXNpb24pIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHRoaXMuZGVjaW1hbE1hcmtlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc2VwYXJhdG9yTGltaXQubGVuZ3RoID4gMTQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKHNlcGFyYXRvclZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jaGVja1ByZWNpc2lvbih0aGlzLm1hc2tFeHByZXNzaW9uLCBzZXBhcmF0b3JWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc2VwYXJhdG9yVmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9jaGVja1BhdHRlcm5Gb3JTcGFjZSgpOiBib29sZWFuIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5wYXR0ZXJucykge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvdHlwZS1idWlsdGluc1xuICAgICAgICAgICAgaWYgKHRoaXMucGF0dGVybnNba2V5XSAmJiB0aGlzLnBhdHRlcm5zW2tleV0/Lmhhc093blByb3BlcnR5KCdwYXR0ZXJuJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXR0ZXJuU3RyaW5nID0gdGhpcy5wYXR0ZXJuc1trZXldPy5wYXR0ZXJuLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IHRoaXMucGF0dGVybnNba2V5XT8ucGF0dGVybjtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIChwYXR0ZXJuU3RyaW5nPy5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5XSElURV9TUEFDRSkgYXMgYm9vbGVhbikgJiZcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybj8udGVzdCh0aGlzLm1hc2tFeHByZXNzaW9uKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBUT0RPIHNob3VsZCB0aGluayBhYm91dCBoZWxwZXJzIG9yIHNlcGFydGluZyBkZWNpbWFsIHByZWNpc2lvbiB0byBvd24gcHJvcGVydHlcbiAgICBwcml2YXRlIF9yZXRyaWV2ZVNlcGFyYXRvclByZWNpc2lvbihtYXNrRXhwcmV0aW9uOiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHtcbiAgICAgICAgY29uc3QgbWF0Y2hlcjogUmVnRXhwTWF0Y2hBcnJheSB8IG51bGwgPSBtYXNrRXhwcmV0aW9uLm1hdGNoKFxuICAgICAgICAgICAgbmV3IFJlZ0V4cChgXnNlcGFyYXRvclxcXFwuKFteZF0qKWApXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBtYXRjaGVyID8gTnVtYmVyKG1hdGNoZXJbMV0pIDogbnVsbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgX2NoZWNrUHJlY2lzaW9uKHNlcGFyYXRvckV4cHJlc3Npb246IHN0cmluZywgc2VwYXJhdG9yVmFsdWU6IHN0cmluZyk6IG51bWJlciB8IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHNlcGFyYXRvclByZWNpc2lvbiA9IHNlcGFyYXRvckV4cHJlc3Npb24uc2xpY2UoMTAsIDExKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgc2VwYXJhdG9yRXhwcmVzc2lvbi5pbmRleE9mKCcyJykgPiAwIHx8XG4gICAgICAgICAgICAodGhpcy5sZWFkWmVybyAmJiBOdW1iZXIoc2VwYXJhdG9yUHJlY2lzaW9uKSA+IDApXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGVjaW1hbE1hcmtlciA9PT0gTWFza0V4cHJlc3Npb24uQ09NTUEgJiYgdGhpcy5sZWFkWmVybykge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIHNlcGFyYXRvclZhbHVlID0gc2VwYXJhdG9yVmFsdWUucmVwbGFjZSgnLCcsICcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZWFkWmVyb1xuICAgICAgICAgICAgICAgID8gTnVtYmVyKHNlcGFyYXRvclZhbHVlKS50b0ZpeGVkKE51bWJlcihzZXBhcmF0b3JQcmVjaXNpb24pKVxuICAgICAgICAgICAgICAgIDogTnVtYmVyKHNlcGFyYXRvclZhbHVlKS50b0ZpeGVkKDIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm51bWJlclRvU3RyaW5nKHNlcGFyYXRvclZhbHVlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgX3JlcGVhdFBhdHRlcm5TeW1ib2xzKG1hc2tFeHA6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAobWFza0V4cC5tYXRjaCgve1swLTldK30vKSAmJlxuICAgICAgICAgICAgICAgIG1hc2tFeHBcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORylcbiAgICAgICAgICAgICAgICAgICAgLnJlZHVjZSgoYWNjdW06IHN0cmluZywgY3VyclZhbDogc3RyaW5nLCBpbmRleDogbnVtYmVyKTogc3RyaW5nID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyVmFsID09PSBNYXNrRXhwcmVzc2lvbi5DVVJMWV9CUkFDS0VUU19MRUZUID8gaW5kZXggOiB0aGlzLl9zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyVmFsICE9PSBNYXNrRXhwcmVzc2lvbi5DVVJMWV9CUkFDS0VUU19SSUdIVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kU3BlY2lhbENoYXIoY3VyclZhbCkgPyBhY2N1bSArIGN1cnJWYWwgOiBhY2N1bTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2VuZCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwZWF0TnVtYmVyID0gTnVtYmVyKG1hc2tFeHAuc2xpY2UodGhpcy5fc3RhcnQgKyAxLCB0aGlzLl9lbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VXaXRoOiBzdHJpbmcgPSBuZXcgQXJyYXkocmVwZWF0TnVtYmVyICsgMSkuam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNrRXhwW3RoaXMuX3N0YXJ0IC0gMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cC5zbGljZSgwLCB0aGlzLl9zdGFydCkubGVuZ3RoID4gMSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHAuaW5jbHVkZXMoTWFza0V4cHJlc3Npb24uTEVUVEVSX1MpXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzeW1ib2xzID0gbWFza0V4cC5zbGljZSgwLCB0aGlzLl9zdGFydCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzeW1ib2xzLmluY2x1ZGVzKE1hc2tFeHByZXNzaW9uLkNVUkxZX0JSQUNLRVRTX0xFRlQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWNjdW0gKyByZXBsYWNlV2l0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHN5bWJvbHMgKyBhY2N1bSArIHJlcGxhY2VXaXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjdW0gKyByZXBsYWNlV2l0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgJycpKSB8fFxuICAgICAgICAgICAgbWFza0V4cFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHB1YmxpYyBjdXJyZW50TG9jYWxlRGVjaW1hbE1hcmtlcigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gKDEuMSkudG9Mb2NhbGVTdHJpbmcoKS5zdWJzdHJpbmcoMSwgMik7XG4gICAgfVxufVxuIl19
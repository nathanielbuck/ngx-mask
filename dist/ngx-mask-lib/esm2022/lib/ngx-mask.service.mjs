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
            return this.prefix + this.maskIsShown + this.suffix;
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
            this.showMaskTyped) {
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
                : this.prefix + this.maskIsShown + this.suffix;
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
        this._emitValue ? this.formControlResult(result) : '';
        if (!this.showMaskTyped || (this.showMaskTyped && this.hiddenInput)) {
            if (this.hiddenInput) {
                if (backspaced) {
                    return this.hideInput(result, this.maskExpression);
                }
                return (this.hideInput(result, this.maskExpression) +
                    this.maskIsShown.slice(result.length));
            }
            return result;
        }
        const resLen = result.length;
        const prefNmask = this.prefix + this.maskIsShown + this.suffix;
        if (this.maskExpression.includes("H" /* MaskExpression.HOURS */)) {
            const countSkipedSymbol = this._numberSkipedSymbols(result);
            return result + prefNmask.slice(resLen + countSkipedSymbol);
        }
        else if (this.maskExpression === "IP" /* MaskExpression.IP */ ||
            this.maskExpression === "CPF_CNPJ" /* MaskExpression.CPF_CNPJ */) {
            return result + prefNmask;
        }
        return result + prefNmask.slice(resLen);
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgxMaskService, deps: null, target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgxMaskService }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgxMaskService, decorators: [{
            type: Injectable
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LW1hc2suc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1tYXNrLWxpYi9zcmMvbGliL25neC1tYXNrLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMxRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFM0MsT0FBTyxFQUFFLGVBQWUsRUFBVyxNQUFNLG1CQUFtQixDQUFDO0FBQzdELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDOztBQUluRSxNQUFNLE9BQU8sY0FBZSxTQUFRLHFCQUFxQjtJQUR6RDs7UUFFVyxrQkFBYSxHQUFHLEtBQUssQ0FBQztRQUV0QixnQkFBVyxHQUFHLEVBQUUsQ0FBQztRQUVqQixhQUFRLEdBQWtCLElBQUksQ0FBQztRQUUvQixXQUFNLEdBQWtCLElBQUksQ0FBQztRQUVwQzs7O1dBR0c7UUFDSSxpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUVyQixnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQix5QkFBb0IsR0FBYSxFQUFFLENBQUM7UUFFcEMsd0JBQW1CLEdBQUcsS0FBSyxDQUFDO1FBRTVCLG1CQUFjLEdBQUcsRUFBRSxDQUFDO1FBRXBCLGtCQUFhLEdBQUcsRUFBRSxDQUFDO1FBRWxCLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFNM0Isb0dBQW9HO1FBQzdGLGFBQVEsR0FBRyxDQUFDLENBQU0sRUFBRSxFQUFFLEdBQUUsQ0FBQyxDQUFDO1FBRWpCLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXBELGFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFMUIsWUFBTyxHQUFH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LENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sV0FBVyxHQUFXLElBQUksS0FBSyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ3hELE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUMzQixDQUFDO2dCQUNGLElBQ0ksT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDO29CQUN4QyxPQUFPLENBQUMsUUFBUSxtQ0FBeUIsRUFDM0M7b0JBQ0UsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsT0FBTyxPQUFPLENBQUMsUUFBUSw4Q0FBb0M7d0JBQ3ZELENBQUMsQ0FBQyxLQUFLLEdBQUcsV0FBVzt3QkFDckIsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLEdBQUcsV0FBVyxDQUFDO2lCQUN2QztxQkFBTTtvQkFDSCxPQUFPLEtBQUssR0FBRyxXQUFXLENBQUM7aUJBQzlCO1lBQ0wsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2YsT0FBTyxDQUNWLENBQUM7SUFDTixDQUFDO0lBRU0sMEJBQTBCO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7K0dBaHZCUSxjQUFjO21IQUFkLGNBQWM7OzRGQUFkLGNBQWM7a0JBRDFCLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbGVtZW50UmVmLCBpbmplY3QsIEluamVjdGFibGUsIFJlbmRlcmVyMiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRE9DVU1FTlQgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5pbXBvcnQgeyBOR1hfTUFTS19DT05GSUcsIElDb25maWcgfSBmcm9tICcuL25neC1tYXNrLmNvbmZpZyc7XG5pbXBvcnQgeyBOZ3hNYXNrQXBwbGllclNlcnZpY2UgfSBmcm9tICcuL25neC1tYXNrLWFwcGxpZXIuc2VydmljZSc7XG5pbXBvcnQgeyBNYXNrRXhwcmVzc2lvbiB9IGZyb20gJy4vbmd4LW1hc2stZXhwcmVzc2lvbi5lbnVtJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE5neE1hc2tTZXJ2aWNlIGV4dGVuZHMgTmd4TWFza0FwcGxpZXJTZXJ2aWNlIHtcbiAgICBwdWJsaWMgaXNOdW1iZXJWYWx1ZSA9IGZhbHNlO1xuXG4gICAgcHVibGljIG1hc2tJc1Nob3duID0gJyc7XG5cbiAgICBwdWJsaWMgc2VsU3RhcnQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgcHVibGljIHNlbEVuZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHdlIGFyZSBjdXJyZW50bHkgaW4gd3JpdGVWYWx1ZSBmdW5jdGlvbiwgaW4gdGhpcyBjYXNlIHdoZW4gYXBwbHlpbmcgdGhlIG1hc2sgd2UgZG9uJ3Qgd2FudCB0byB0cmlnZ2VyIG9uQ2hhbmdlIGZ1bmN0aW9uLFxuICAgICAqIHNpbmNlIHdyaXRlVmFsdWUgc2hvdWxkIGJlIGEgb25lIHdheSBvbmx5IHByb2Nlc3Mgb2Ygd3JpdGluZyB0aGUgRE9NIHZhbHVlIGJhc2VkIG9uIHRoZSBBbmd1bGFyIG1vZGVsIHZhbHVlLlxuICAgICAqL1xuICAgIHB1YmxpYyB3cml0aW5nVmFsdWUgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBtYXNrQ2hhbmdlZCA9IGZhbHNlO1xuICAgIHB1YmxpYyBfbWFza0V4cHJlc3Npb25BcnJheTogc3RyaW5nW10gPSBbXTtcblxuICAgIHB1YmxpYyB0cmlnZ2VyT25NYXNrQ2hhbmdlID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgX3ByZXZpb3VzVmFsdWUgPSAnJztcblxuICAgIHB1YmxpYyBfY3VycmVudFZhbHVlID0gJyc7XG5cbiAgICBwcml2YXRlIF9lbWl0VmFsdWUgPSBmYWxzZTtcblxuICAgIHByaXZhdGUgX3N0YXJ0ITogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSBfZW5kITogbnVtYmVyO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvbiwgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIHB1YmxpYyBvbkNoYW5nZSA9IChfOiBhbnkpID0+IHt9O1xuXG4gICAgcHVibGljIHJlYWRvbmx5IF9lbGVtZW50UmVmID0gaW5qZWN0KEVsZW1lbnRSZWYsIHsgb3B0aW9uYWw6IHRydWUgfSk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50ID0gaW5qZWN0KERPQ1VNRU5UKTtcblxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBfY29uZmlnID0gaW5qZWN0PElDb25maWc+KE5HWF9NQVNLX0NPTkZJRyk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF9yZW5kZXJlciA9IGluamVjdChSZW5kZXJlcjIsIHsgb3B0aW9uYWw6IHRydWUgfSk7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICAgIHB1YmxpYyBvdmVycmlkZSBhcHBseU1hc2soXG4gICAgICAgIGlucHV0VmFsdWU6IHN0cmluZyxcbiAgICAgICAgbWFza0V4cHJlc3Npb246IHN0cmluZyxcbiAgICAgICAgcG9zaXRpb24gPSAwLFxuICAgICAgICBqdXN0UGFzdGVkID0gZmFsc2UsXG4gICAgICAgIGJhY2tzcGFjZWQgPSBmYWxzZSxcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvbiwgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgICBjYjogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkgPSAoKSA9PiB7fVxuICAgICk6IHN0cmluZyB7XG4gICAgICAgIGlmICghbWFza0V4cHJlc3Npb24pIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dFZhbHVlICE9PSB0aGlzLmFjdHVhbFZhbHVlID8gdGhpcy5hY3R1YWxWYWx1ZSA6IGlucHV0VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXNrSXNTaG93biA9IHRoaXMuc2hvd01hc2tUeXBlZFxuICAgICAgICAgICAgPyB0aGlzLnNob3dNYXNrSW5JbnB1dCgpXG4gICAgICAgICAgICA6IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORztcbiAgICAgICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLklQICYmIHRoaXMuc2hvd01hc2tUeXBlZCkge1xuICAgICAgICAgICAgdGhpcy5tYXNrSXNTaG93biA9IHRoaXMuc2hvd01hc2tJbklucHV0KGlucHV0VmFsdWUgfHwgTWFza0V4cHJlc3Npb24uSEFTSCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLkNQRl9DTlBKICYmIHRoaXMuc2hvd01hc2tUeXBlZCkge1xuICAgICAgICAgICAgdGhpcy5tYXNrSXNTaG93biA9IHRoaXMuc2hvd01hc2tJbklucHV0KGlucHV0VmFsdWUgfHwgTWFza0V4cHJlc3Npb24uSEFTSCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpbnB1dFZhbHVlICYmIHRoaXMuc2hvd01hc2tUeXBlZCkge1xuICAgICAgICAgICAgdGhpcy5mb3JtQ29udHJvbFJlc3VsdCh0aGlzLnByZWZpeCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcmVmaXggKyB0aGlzLm1hc2tJc1Nob3duICsgdGhpcy5zdWZmaXg7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBnZXRTeW1ib2w6IHN0cmluZyA9XG4gICAgICAgICAgICAhIWlucHV0VmFsdWUgJiYgdHlwZW9mIHRoaXMuc2VsU3RhcnQgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgPyBpbnB1dFZhbHVlW3RoaXMuc2VsU3RhcnRdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICAgIDogTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICBsZXQgbmV3SW5wdXRWYWx1ZSA9ICcnO1xuICAgICAgICBpZiAodGhpcy5oaWRkZW5JbnB1dCAhPT0gdW5kZWZpbmVkICYmICF0aGlzLndyaXRpbmdWYWx1ZSkge1xuICAgICAgICAgICAgbGV0IGFjdHVhbFJlc3VsdDogc3RyaW5nW10gPVxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgJiYgaW5wdXRWYWx1ZS5sZW5ndGggPT09IDFcbiAgICAgICAgICAgICAgICAgICAgPyBpbnB1dFZhbHVlLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORylcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmFjdHVhbFZhbHVlLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORyk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZSAgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC1leHByZXNzaW9uc1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5zZWxTdGFydCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHRoaXMuc2VsRW5kID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsU3RhcnQgPSBOdW1iZXIodGhpcy5zZWxTdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxFbmQgPSBOdW1iZXIodGhpcy5zZWxFbmQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlICE9PSBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcgJiYgYWN0dWFsUmVzdWx0Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICA/IHR5cGVvZiB0aGlzLnNlbFN0YXJ0ID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgdGhpcy5zZWxFbmQgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGlucHV0VmFsdWUubGVuZ3RoID4gYWN0dWFsUmVzdWx0Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWN0dWFsUmVzdWx0LnNwbGljZSh0aGlzLnNlbFN0YXJ0LCAwLCBnZXRTeW1ib2wpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbnB1dFZhbHVlLmxlbmd0aCA8IGFjdHVhbFJlc3VsdC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGFjdHVhbFJlc3VsdC5sZW5ndGggLSBpbnB1dFZhbHVlLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGJhY2tzcGFjZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWN0dWFsUmVzdWx0LnNwbGljZSh0aGlzLnNlbFN0YXJ0IC0gMSwgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogYWN0dWFsUmVzdWx0LnNwbGljZShpbnB1dFZhbHVlLmxlbmd0aCAtIDEsIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogYWN0dWFsUmVzdWx0LnNwbGljZSh0aGlzLnNlbFN0YXJ0LCB0aGlzLnNlbEVuZCAtIHRoaXMuc2VsU3RhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgOiAoYWN0dWFsUmVzdWx0ID0gW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc2hvd01hc2tUeXBlZCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oaWRkZW5JbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMucmVtb3ZlTWFzayhpbnB1dFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlc2xpbnQtZW5hYmxlICBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLWV4cHJlc3Npb25zXG4gICAgICAgICAgICBuZXdJbnB1dFZhbHVlID1cbiAgICAgICAgICAgICAgICB0aGlzLmFjdHVhbFZhbHVlLmxlbmd0aCAmJiBhY3R1YWxSZXN1bHQubGVuZ3RoIDw9IGlucHV0VmFsdWUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgID8gdGhpcy5zaGlmdFR5cGVkU3ltYm9scyhhY3R1YWxSZXN1bHQuam9pbihNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpKVxuICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGp1c3RQYXN0ZWQgJiYgKHRoaXMuaGlkZGVuSW5wdXQgfHwgIXRoaXMuaGlkZGVuSW5wdXQpKSB7XG4gICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gaW5wdXRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBiYWNrc3BhY2VkICYmXG4gICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbltwb3NpdGlvbl0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICApICE9PSAtMSAmJlxuICAgICAgICAgICAgdGhpcy5zaG93TWFza1R5cGVkXG4gICAgICAgICkge1xuICAgICAgICAgICAgbmV3SW5wdXRWYWx1ZSA9IHRoaXMuX2N1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZWxldGVkU3BlY2lhbENoYXJhY3RlciAmJiBwb3NpdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXModGhpcy5hY3R1YWxWYWx1ZS5zbGljZShwb3NpdGlvbiwgcG9zaXRpb24gKyAxKSkpIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWFza0V4cHJlc3Npb24uc2xpY2UocG9zaXRpb24gLSAxLCBwb3NpdGlvbiArIDEpICE9PSBNYXNrRXhwcmVzc2lvbi5NT05USFMpIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIC0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgdGhpcy5kZWxldGVkU3BlY2lhbENoYXJhY3RlciA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuc2hvd01hc2tUeXBlZCAmJlxuICAgICAgICAgICAgdGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlci5sZW5ndGggPT09IDEgJiZcbiAgICAgICAgICAgICF0aGlzLmxlYWRaZXJvRGF0ZVRpbWVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLnJlbW92ZU1hc2soaW5wdXRWYWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5tYXNrQ2hhbmdlZCkge1xuICAgICAgICAgICAgbmV3SW5wdXRWYWx1ZSA9IGlucHV0VmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdJbnB1dFZhbHVlID1cbiAgICAgICAgICAgICAgICBCb29sZWFuKG5ld0lucHV0VmFsdWUpICYmIG5ld0lucHV0VmFsdWUubGVuZ3RoID8gbmV3SW5wdXRWYWx1ZSA6IGlucHV0VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zaG93TWFza1R5cGVkICYmIHRoaXMua2VlcENoYXJhY3RlclBvc2l0aW9ucyAmJiB0aGlzLmFjdHVhbFZhbHVlICYmICFqdXN0UGFzdGVkKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzXG4gICAgICAgICAgICAgICAgPyB0aGlzLnJlbW92ZU1hc2sodGhpcy5hY3R1YWxWYWx1ZSlcbiAgICAgICAgICAgICAgICA6IHRoaXMuYWN0dWFsVmFsdWU7XG4gICAgICAgICAgICB0aGlzLmZvcm1Db250cm9sUmVzdWx0KHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdHVhbFZhbHVlXG4gICAgICAgICAgICAgICAgPyB0aGlzLmFjdHVhbFZhbHVlXG4gICAgICAgICAgICAgICAgOiB0aGlzLnByZWZpeCArIHRoaXMubWFza0lzU2hvd24gKyB0aGlzLnN1ZmZpeDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nID0gc3VwZXIuYXBwbHlNYXNrKFxuICAgICAgICAgICAgbmV3SW5wdXRWYWx1ZSxcbiAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uLFxuICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICBqdXN0UGFzdGVkLFxuICAgICAgICAgICAgYmFja3NwYWNlZCxcbiAgICAgICAgICAgIGNiXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5hY3R1YWxWYWx1ZSA9IHRoaXMuZ2V0QWN0dWFsVmFsdWUocmVzdWx0KTtcbiAgICAgICAgLy8gaGFuZGxlIHNvbWUgc2VwYXJhdG9yIGltcGxpY2F0aW9uczpcbiAgICAgICAgLy8gYS4pIGFkanVzdCBkZWNpbWFsTWFya2VyIGRlZmF1bHQgKC4gLT4gLCkgaWYgdGhvdXNhbmRTZXBhcmF0b3IgaXMgYSBkb3RcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy50aG91c2FuZFNlcGFyYXRvciA9PT0gTWFza0V4cHJlc3Npb24uRE9UICYmXG4gICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIgPT09IE1hc2tFeHByZXNzaW9uLkRPVFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuZGVjaW1hbE1hcmtlciA9IE1hc2tFeHByZXNzaW9uLkNPTU1BO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYikgcmVtb3ZlIGRlY2ltYWwgbWFya2VyIGZyb20gbGlzdCBvZiBzcGVjaWFsIGNoYXJhY3RlcnMgdG8gbWFza1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoTWFza0V4cHJlc3Npb24uU0VQQVJBVE9SKSAmJlxuICAgICAgICAgICAgdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMgPT09IHRydWVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzID0gdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgKGl0ZW06IHN0cmluZykgPT5cbiAgICAgICAgICAgICAgICAgICAgIXRoaXMuX2NvbXBhcmVPckluY2x1ZGVzKGl0ZW0sIHRoaXMuZGVjaW1hbE1hcmtlciwgdGhpcy50aG91c2FuZFNlcGFyYXRvcikgLy9pdGVtICE9PSB0aGlzLmRlY2ltYWxNYXJrZXIsIC8vICFcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzdWx0IHx8IHJlc3VsdCA9PT0gJycpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZpb3VzVmFsdWUgPSB0aGlzLl9jdXJyZW50VmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50VmFsdWUgPSByZXN1bHQ7XG4gICAgICAgICAgICB0aGlzLl9lbWl0VmFsdWUgPVxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXZpb3VzVmFsdWUgIT09IHRoaXMuX2N1cnJlbnRWYWx1ZSB8fFxuICAgICAgICAgICAgICAgIHRoaXMubWFza0NoYW5nZWQgfHxcbiAgICAgICAgICAgICAgICAodGhpcy5fcHJldmlvdXNWYWx1ZSA9PT0gdGhpcy5fY3VycmVudFZhbHVlICYmIGp1c3RQYXN0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZW1pdFZhbHVlID8gdGhpcy5mb3JtQ29udHJvbFJlc3VsdChyZXN1bHQpIDogJyc7XG4gICAgICAgIGlmICghdGhpcy5zaG93TWFza1R5cGVkIHx8ICh0aGlzLnNob3dNYXNrVHlwZWQgJiYgdGhpcy5oaWRkZW5JbnB1dCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhpZGRlbklucHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGJhY2tzcGFjZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGlkZUlucHV0KHJlc3VsdCwgdGhpcy5tYXNrRXhwcmVzc2lvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZUlucHV0KHJlc3VsdCwgdGhpcy5tYXNrRXhwcmVzc2lvbikgK1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hc2tJc1Nob3duLnNsaWNlKHJlc3VsdC5sZW5ndGgpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzTGVuOiBudW1iZXIgPSByZXN1bHQubGVuZ3RoO1xuICAgICAgICBjb25zdCBwcmVmTm1hc2s6IHN0cmluZyA9IHRoaXMucHJlZml4ICsgdGhpcy5tYXNrSXNTaG93biArIHRoaXMuc3VmZml4O1xuXG4gICAgICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uLmluY2x1ZGVzKE1hc2tFeHByZXNzaW9uLkhPVVJTKSkge1xuICAgICAgICAgICAgY29uc3QgY291bnRTa2lwZWRTeW1ib2wgPSB0aGlzLl9udW1iZXJTa2lwZWRTeW1ib2xzKHJlc3VsdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0ICsgcHJlZk5tYXNrLnNsaWNlKHJlc0xlbiArIGNvdW50U2tpcGVkU3ltYm9sKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLklQIHx8XG4gICAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uID09PSBNYXNrRXhwcmVzc2lvbi5DUEZfQ05QSlxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQgKyBwcmVmTm1hc2s7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdCArIHByZWZObWFzay5zbGljZShyZXNMZW4pO1xuICAgIH1cblxuICAgIC8vIGdldCB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhhdCB3ZXJlIHNoaWZ0ZWRcbiAgICBwcml2YXRlIF9udW1iZXJTa2lwZWRTeW1ib2xzKHZhbHVlOiBzdHJpbmcpOiBudW1iZXIge1xuICAgICAgICBjb25zdCByZWdleCA9IC8oXnxcXEQpKFxcZFxcRCkvZztcbiAgICAgICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyh2YWx1ZSk7XG4gICAgICAgIGxldCBjb3VudFNraXBlZFN5bWJvbCA9IDA7XG4gICAgICAgIHdoaWxlIChtYXRjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb3VudFNraXBlZFN5bWJvbCArPSAxO1xuICAgICAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY291bnRTa2lwZWRTeW1ib2w7XG4gICAgfVxuXG4gICAgcHVibGljIGFwcGx5VmFsdWVDaGFuZ2VzKFxuICAgICAgICBwb3NpdGlvbjogbnVtYmVyLFxuICAgICAgICBqdXN0UGFzdGVkOiBib29sZWFuLFxuICAgICAgICBiYWNrc3BhY2VkOiBib29sZWFuLFxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uLCBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgIGNiOiAoLi4uYXJnczogYW55W10pID0+IGFueSA9ICgpID0+IHt9XG4gICAgKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGZvcm1FbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZj8ubmF0aXZlRWxlbWVudDtcbiAgICAgICAgaWYgKCFmb3JtRWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybUVsZW1lbnQudmFsdWUgPSB0aGlzLmFwcGx5TWFzayhcbiAgICAgICAgICAgIGZvcm1FbGVtZW50LnZhbHVlLFxuICAgICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbixcbiAgICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgICAganVzdFBhc3RlZCxcbiAgICAgICAgICAgIGJhY2tzcGFjZWQsXG4gICAgICAgICAgICBjYlxuICAgICAgICApO1xuICAgICAgICBpZiAoZm9ybUVsZW1lbnQgPT09IHRoaXMuX2dldEFjdGl2ZUVsZW1lbnQoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXJJZk5vdE1hdGNoRm4oKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaGlkZUlucHV0KGlucHV0VmFsdWU6IHN0cmluZywgbWFza0V4cHJlc3Npb246IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBpbnB1dFZhbHVlXG4gICAgICAgICAgICAuc3BsaXQoTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgLm1hcCgoY3Vycjogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhdHRlcm5zICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGF0dGVybnNbbWFza0V4cHJlc3Npb25baW5kZXhdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR10gJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltpbmRleF0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXT8uc3ltYm9sXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhdHRlcm5zW21hc2tFeHByZXNzaW9uW2luZGV4XSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkddXG4gICAgICAgICAgICAgICAgICAgICAgICA/LnN5bWJvbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKTtcbiAgICB9XG5cbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBuZWNlc3NhcnksIGl0IGNoZWNrcyByZXN1bHQgYWdhaW5zdCBtYXNrRXhwcmVzc2lvblxuICAgIHB1YmxpYyBnZXRBY3R1YWxWYWx1ZShyZXM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGNvbXBhcmU6IHN0cmluZ1tdID0gcmVzXG4gICAgICAgICAgICAuc3BsaXQoTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgLmZpbHRlcigoc3ltYm9sOiBzdHJpbmcsIGk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hc2tDaGFyID0gdGhpcy5tYXNrRXhwcmVzc2lvbltpXSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xNYXNrKHN5bWJvbCwgbWFza0NoYXIpIHx8XG4gICAgICAgICAgICAgICAgICAgICh0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKG1hc2tDaGFyKSAmJiBzeW1ib2wgPT09IG1hc2tDaGFyKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNvbXBhcmUuam9pbihNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpID09PSByZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJlLmpvaW4oTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIHB1YmxpYyBzaGlmdFR5cGVkU3ltYm9scyhpbnB1dFZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBsZXQgc3ltYm9sVG9SZXBsYWNlID0gJyc7XG4gICAgICAgIGNvbnN0IG5ld0lucHV0VmFsdWU6IChzdHJpbmcgfCB1bmRlZmluZWQpW10gPVxuICAgICAgICAgICAgKGlucHV0VmFsdWUgJiZcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGN1cnJTeW1ib2w6IHN0cmluZywgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbaW5kZXggKyAxXSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVtpbmRleCArIDFdICE9PSB0aGlzLm1hc2tFeHByZXNzaW9uW2luZGV4ICsgMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5bWJvbFRvUmVwbGFjZSA9IGN1cnJTeW1ib2w7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0VmFsdWVbaW5kZXggKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzeW1ib2xUb1JlcGxhY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZVN5bWJvbDogc3RyaW5nID0gc3ltYm9sVG9SZXBsYWNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5bWJvbFRvUmVwbGFjZSA9IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVwbGFjZVN5bWJvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyU3ltYm9sO1xuICAgICAgICAgICAgICAgICAgICB9KSkgfHxcbiAgICAgICAgICAgIFtdO1xuICAgICAgICByZXR1cm4gbmV3SW5wdXRWYWx1ZS5qb2luKE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBudW1iZXIgdmFsdWUgdG8gc3RyaW5nXG4gICAgICogMy4xNDE1IC0+ICczLjE0MTUnXG4gICAgICogMWUtNyAtPiAnMC4wMDAwMDAxJ1xuICAgICAqL1xuICAgIHB1YmxpYyBudW1iZXJUb1N0cmluZyh2YWx1ZTogbnVtYmVyIHwgc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkgfHxcbiAgICAgICAgICAgICh0aGlzLm1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoTWFza0V4cHJlc3Npb24uU0VQQVJBVE9SKSAmJlxuICAgICAgICAgICAgICAgICh0aGlzLmxlYWRaZXJvIHx8ICF0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVycykpIHx8XG4gICAgICAgICAgICAodGhpcy5tYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlNFUEFSQVRPUikgJiZcbiAgICAgICAgICAgICAgICB0aGlzLnNlcGFyYXRvckxpbWl0Lmxlbmd0aCA+IDE0ICYmXG4gICAgICAgICAgICAgICAgU3RyaW5nKHZhbHVlKS5sZW5ndGggPiAxNClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTnVtYmVyKHZhbHVlKVxuICAgICAgICAgICAgLnRvTG9jYWxlU3RyaW5nKCdmdWxsd2lkZScsIHtcbiAgICAgICAgICAgICAgICB1c2VHcm91cGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAyMCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAucmVwbGFjZShgLyR7TWFza0V4cHJlc3Npb24uTUlOVVN9L2AsIE1hc2tFeHByZXNzaW9uLk1JTlVTKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2hvd01hc2tJbklucHV0KGlucHV0VmFsPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHRoaXMuc2hvd01hc2tUeXBlZCAmJiAhIXRoaXMuc2hvd25NYXNrRXhwcmVzc2lvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24ubGVuZ3RoICE9PSB0aGlzLnNob3duTWFza0V4cHJlc3Npb24ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXNrIGV4cHJlc3Npb24gbXVzdCBtYXRjaCBtYXNrIHBsYWNlaG9sZGVyIGxlbmd0aCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zaG93bk1hc2tFeHByZXNzaW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2hvd01hc2tUeXBlZCkge1xuICAgICAgICAgICAgaWYgKGlucHV0VmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLklQKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jaGVja0ZvcklwKGlucHV0VmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLkNQRl9DTlBKKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jaGVja0ZvckNwZkNucGooaW5wdXRWYWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyLmxlbmd0aCA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wbGFjZUhvbGRlckNoYXJhY3RlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hc2tFeHByZXNzaW9uLnJlcGxhY2UoL1xcdy9nLCB0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFySWZOb3RNYXRjaEZuKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBmb3JtRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWY/Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGlmICghZm9ybUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmNsZWFySWZOb3RNYXRjaCAmJlxuICAgICAgICAgICAgdGhpcy5wcmVmaXgubGVuZ3RoICsgdGhpcy5tYXNrRXhwcmVzc2lvbi5sZW5ndGggKyB0aGlzLnN1ZmZpeC5sZW5ndGggIT09XG4gICAgICAgICAgICAgICAgZm9ybUVsZW1lbnQudmFsdWUucmVwbGFjZSh0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyLCBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpXG4gICAgICAgICAgICAgICAgICAgIC5sZW5ndGhcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLmZvcm1FbGVtZW50UHJvcGVydHkgPSBbJ3ZhbHVlJywgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXTtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlNYXNrKCcnLCB0aGlzLm1hc2tFeHByZXNzaW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgZm9ybUVsZW1lbnRQcm9wZXJ0eShbbmFtZSwgdmFsdWVdOiBbc3RyaW5nLCBzdHJpbmcgfCBib29sZWFuXSkge1xuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyIHx8ICF0aGlzLl9lbGVtZW50UmVmKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PlxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXI/LnNldFByb3BlcnR5KHRoaXMuX2VsZW1lbnRSZWY/Lm5hdGl2ZUVsZW1lbnQsIG5hbWUsIHZhbHVlKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHB1YmxpYyBjaGVja0Ryb3BTcGVjaWFsQ2hhckFtb3VudChtYXNrOiBzdHJpbmcpOiBudW1iZXIge1xuICAgICAgICBjb25zdCBjaGFyczogc3RyaW5nW10gPSBtYXNrXG4gICAgICAgICAgICAuc3BsaXQoTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKVxuICAgICAgICAgICAgLmZpbHRlcigoaXRlbTogc3RyaW5nKSA9PiB0aGlzLl9maW5kRHJvcFNwZWNpYWxDaGFyKGl0ZW0pKTtcbiAgICAgICAgcmV0dXJuIGNoYXJzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlTWFzayhpbnB1dFZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVtb3ZlTWFzayhcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZVN1ZmZpeCh0aGlzLl9yZW1vdmVQcmVmaXgoaW5wdXRWYWx1ZSkpLFxuICAgICAgICAgICAgdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5jb25jYXQoJ18nKS5jb25jYXQodGhpcy5wbGFjZUhvbGRlckNoYXJhY3RlcilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jaGVja0ZvcklwKGlucHV0VmFsOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBpZiAoaW5wdXRWYWwgPT09IE1hc2tFeHByZXNzaW9uLkhBU0gpIHtcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfS4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9LiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0uJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXJyOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0VmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGlucHV0VmFsW2ldID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORztcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaCgnXFxcXGQnKSkge1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA8PSAzKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0uJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfS4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA+IDMgJiYgYXJyLmxlbmd0aCA8PSA2KSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0uJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyci5sZW5ndGggPiA2ICYmIGFyci5sZW5ndGggPD0gOSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyci5sZW5ndGggPiA5ICYmIGFyci5sZW5ndGggPD0gMTIpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2hlY2tGb3JDcGZDbnBqKGlucHV0VmFsOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBjcGYgPVxuICAgICAgICAgICAgYCR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWAgK1xuICAgICAgICAgICAgYC4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcbiAgICAgICAgICAgIGAuJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YCArXG4gICAgICAgICAgICBgLSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YDtcbiAgICAgICAgY29uc3QgY25waiA9XG4gICAgICAgICAgICBgJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcbiAgICAgICAgICAgIGAuJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YCArXG4gICAgICAgICAgICBgLiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWAgK1xuICAgICAgICAgICAgYC8ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YCArXG4gICAgICAgICAgICBgLSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YDtcblxuICAgICAgICBpZiAoaW5wdXRWYWwgPT09IE1hc2tFeHByZXNzaW9uLkhBU0gpIHtcbiAgICAgICAgICAgIHJldHVybiBjcGY7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXJyOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0VmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGlucHV0VmFsW2ldID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORztcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaCgnXFxcXGQnKSkge1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA8PSAzKSB7XG4gICAgICAgICAgICByZXR1cm4gY3BmLnNsaWNlKGFyci5sZW5ndGgsIGNwZi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID4gMyAmJiBhcnIubGVuZ3RoIDw9IDYpIHtcbiAgICAgICAgICAgIHJldHVybiBjcGYuc2xpY2UoYXJyLmxlbmd0aCArIDEsIGNwZi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID4gNiAmJiBhcnIubGVuZ3RoIDw9IDkpIHtcbiAgICAgICAgICAgIHJldHVybiBjcGYuc2xpY2UoYXJyLmxlbmd0aCArIDIsIGNwZi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID4gOSAmJiBhcnIubGVuZ3RoIDwgMTEpIHtcbiAgICAgICAgICAgIHJldHVybiBjcGYuc2xpY2UoYXJyLmxlbmd0aCArIDMsIGNwZi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID09PSAxMSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID09PSAxMikge1xuICAgICAgICAgICAgaWYgKGlucHV0VmFsLmxlbmd0aCA9PT0gMTcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY25wai5zbGljZSgxNiwgY25wai5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNucGouc2xpY2UoMTUsIGNucGoubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA+IDEyICYmIGFyci5sZW5ndGggPD0gMTQpIHtcbiAgICAgICAgICAgIHJldHVybiBjbnBqLnNsaWNlKGFyci5sZW5ndGggKyA0LCBjbnBqLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY3Vyc2l2ZWx5IGRldGVybWluZSB0aGUgY3VycmVudCBhY3RpdmUgZWxlbWVudCBieSBuYXZpZ2F0aW5nIHRoZSBTaGFkb3cgRE9NIHVudGlsIHRoZSBBY3RpdmUgRWxlbWVudCBpcyBmb3VuZC5cbiAgICAgKi9cbiAgICBwcml2YXRlIF9nZXRBY3RpdmVFbGVtZW50KGRvY3VtZW50OiBEb2N1bWVudE9yU2hhZG93Um9vdCA9IHRoaXMuZG9jdW1lbnQpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IHNoYWRvd1Jvb3RFbCA9IGRvY3VtZW50Py5hY3RpdmVFbGVtZW50Py5zaGFkb3dSb290O1xuICAgICAgICBpZiAoIXNoYWRvd1Jvb3RFbD8uYWN0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0QWN0aXZlRWxlbWVudChzaGFkb3dSb290RWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvcG9nYXRlcyB0aGUgaW5wdXQgdmFsdWUgYmFjayB0byB0aGUgQW5ndWxhciBtb2RlbCBieSB0cmlnZ2VyaW5nIHRoZSBvbkNoYW5nZSBmdW5jdGlvbi4gSXQgd29uJ3QgZG8gdGhpcyBpZiB3cml0aW5nVmFsdWVcbiAgICAgKiBpcyB0cnVlLiBJZiB0aGF0IGlzIHRydWUgaXQgbWVhbnMgd2UgYXJlIGN1cnJlbnRseSBpbiB0aGUgd3JpdGVWYWx1ZSBmdW5jdGlvbiwgd2hpY2ggaXMgc3VwcG9zZWQgdG8gb25seSB1cGRhdGUgdGhlIGFjdHVhbFxuICAgICAqIERPTSBlbGVtZW50IGJhc2VkIG9uIHRoZSBBbmd1bGFyIG1vZGVsIHZhbHVlLiBJdCBzaG91bGQgYmUgYSBvbmUgd2F5IHByb2Nlc3MsIGkuZS4gd3JpdGVWYWx1ZSBzaG91bGQgbm90IGJlIG1vZGlmeWluZyB0aGUgQW5ndWxhclxuICAgICAqIG1vZGVsIHZhbHVlIHRvby4gVGhlcmVmb3JlLCB3ZSBkb24ndCB0cmlnZ2VyIG9uQ2hhbmdlIGluIHRoaXMgc2NlbmFyaW8uXG4gICAgICogQHBhcmFtIGlucHV0VmFsdWUgdGhlIGN1cnJlbnQgZm9ybSBpbnB1dCB2YWx1ZVxuICAgICAqL1xuICAgIHByaXZhdGUgZm9ybUNvbnRyb2xSZXN1bHQoaW5wdXRWYWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLndyaXRpbmdWYWx1ZSB8fCAoIXRoaXMudHJpZ2dlck9uTWFza0NoYW5nZSAmJiB0aGlzLm1hc2tDaGFuZ2VkKSkge1xuICAgICAgICAgICAgdGhpcy5tYXNrQ2hhbmdlZFxuICAgICAgICAgICAgICAgID8gdGhpcy5vbkNoYW5nZShcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dFRyYW5zZm9ybUZuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90b051bWJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9scyh0aGlzLl9yZW1vdmVTdWZmaXgodGhpcy5fcmVtb3ZlUHJlZml4KGlucHV0VmFsdWUpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgdGhpcy5tYXNrQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzKSkge1xuICAgICAgICAgICAgdGhpcy5vbkNoYW5nZShcbiAgICAgICAgICAgICAgICB0aGlzLm91dHB1dFRyYW5zZm9ybUZuKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b051bWJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9scyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVNYXNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVTdWZmaXgodGhpcy5fcmVtb3ZlUHJlZml4KGlucHV0VmFsdWUpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMgfHxcbiAgICAgICAgICAgICghdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMgJiYgdGhpcy5wcmVmaXggPT09IGlucHV0VmFsdWUpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5vbkNoYW5nZShcbiAgICAgICAgICAgICAgICB0aGlzLm91dHB1dFRyYW5zZm9ybUZuKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b051bWJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9scyh0aGlzLl9yZW1vdmVTdWZmaXgodGhpcy5fcmVtb3ZlUHJlZml4KGlucHV0VmFsdWUpKSlcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uQ2hhbmdlKHRoaXMub3V0cHV0VHJhbnNmb3JtRm4odGhpcy5fdG9OdW1iZXIoaW5wdXRWYWx1ZSkpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3RvTnVtYmVyKHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy5pc051bWJlclZhbHVlIHx8IHZhbHVlID09PSBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoTWFza0V4cHJlc3Npb24uU0VQQVJBVE9SKSAmJlxuICAgICAgICAgICAgKHRoaXMubGVhZFplcm8gfHwgIXRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoU3RyaW5nKHZhbHVlKS5sZW5ndGggPiAxNiAmJiB0aGlzLnNlcGFyYXRvckxpbWl0Lmxlbmd0aCA+IDE0KSB7XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBudW0gPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICBpZiAodGhpcy5tYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlNFUEFSQVRPUikgJiYgTnVtYmVyLmlzTmFOKG51bSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IFN0cmluZyh2YWx1ZSkucmVwbGFjZSgnLCcsICcuJyk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKHZhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKG51bSkgPyB2YWx1ZSA6IG51bTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZW1vdmVNYXNrKHZhbHVlOiBzdHJpbmcsIHNwZWNpYWxDaGFyYWN0ZXJzRm9yUmVtb3ZlOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChNYXNrRXhwcmVzc2lvbi5QRVJDRU5UKSAmJlxuICAgICAgICAgICAgdmFsdWUuaW5jbHVkZXMoTWFza0V4cHJlc3Npb24uRE9UKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgPyB2YWx1ZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgdGhpcy5fcmVnRXhwRm9yUmVtb3ZlKHNwZWNpYWxDaGFyYWN0ZXJzRm9yUmVtb3ZlKSxcbiAgICAgICAgICAgICAgICAgIE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICApXG4gICAgICAgICAgICA6IHZhbHVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlbW92ZVByZWZpeCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCF0aGlzLnByZWZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZSA/IHZhbHVlLnJlcGxhY2UodGhpcy5wcmVmaXgsIE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORykgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZW1vdmVTdWZmaXgodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmICghdGhpcy5zdWZmaXgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUgPyB2YWx1ZS5yZXBsYWNlKHRoaXMuc3VmZml4LCBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpIDogdmFsdWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmV0cmlldmVTZXBhcmF0b3JWYWx1ZShyZXN1bHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGxldCBzcGVjaWFsQ2hhcmFjdGVycyA9IEFycmF5LmlzQXJyYXkodGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMpXG4gICAgICAgICAgICA/IHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuZmlsdGVyKCh2KSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzIGFzIHN0cmluZ1tdKS5pbmNsdWRlcyh2KTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIDogdGhpcy5zcGVjaWFsQ2hhcmFjdGVycztcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIXRoaXMuZGVsZXRlZFNwZWNpYWxDaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgIHRoaXMuX2NoZWNrUGF0dGVybkZvclNwYWNlKCkgJiZcbiAgICAgICAgICAgIHJlc3VsdC5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5XSElURV9TUEFDRSkgJiZcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24uaW5jbHVkZXMoTWFza0V4cHJlc3Npb24uU1lNQk9MX1NUQVIpXG4gICAgICAgICkge1xuICAgICAgICAgICAgc3BlY2lhbENoYXJhY3RlcnMgPSBzcGVjaWFsQ2hhcmFjdGVycy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgKGNoYXIpID0+IGNoYXIgIT09IE1hc2tFeHByZXNzaW9uLldISVRFX1NQQUNFXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9yZW1vdmVNYXNrKHJlc3VsdCwgc3BlY2lhbENoYXJhY3RlcnMgYXMgc3RyaW5nW10pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlZ0V4cEZvclJlbW92ZShzcGVjaWFsQ2hhcmFjdGVyc0ZvclJlbW92ZTogc3RyaW5nW10pOiBSZWdFeHAge1xuICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgIHNwZWNpYWxDaGFyYWN0ZXJzRm9yUmVtb3ZlLm1hcCgoaXRlbTogc3RyaW5nKSA9PiBgXFxcXCR7aXRlbX1gKS5qb2luKCd8JyksXG4gICAgICAgICAgICAnZ2knXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVwbGFjZURlY2ltYWxNYXJrZXJUb0RvdCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgbWFya2VycyA9IEFycmF5LmlzQXJyYXkodGhpcy5kZWNpbWFsTWFya2VyKVxuICAgICAgICAgICAgPyB0aGlzLmRlY2ltYWxNYXJrZXJcbiAgICAgICAgICAgIDogW3RoaXMuZGVjaW1hbE1hcmtlcl07XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UodGhpcy5fcmVnRXhwRm9yUmVtb3ZlKG1hcmtlcnMpLCBNYXNrRXhwcmVzc2lvbi5ET1QpO1xuICAgIH1cblxuICAgIHB1YmxpYyBfY2hlY2tTeW1ib2xzKHJlc3VsdDogc3RyaW5nKTogc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkIHwgbnVsbCB7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChNYXNrRXhwcmVzc2lvbi5QRVJDRU5UKSAmJlxuICAgICAgICAgICAgdGhpcy5kZWNpbWFsTWFya2VyID09PSBNYXNrRXhwcmVzc2lvbi5DT01NQVxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoTWFza0V4cHJlc3Npb24uQ09NTUEsIE1hc2tFeHByZXNzaW9uLkRPVCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VwYXJhdG9yUHJlY2lzaW9uOiBudW1iZXIgfCBudWxsID0gdGhpcy5fcmV0cmlldmVTZXBhcmF0b3JQcmVjaXNpb24oXG4gICAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHNlcGFyYXRvclZhbHVlOiBzdHJpbmcgPSB0aGlzLl9yZXBsYWNlRGVjaW1hbE1hcmtlclRvRG90KFxuICAgICAgICAgICAgdGhpcy5fcmV0cmlldmVTZXBhcmF0b3JWYWx1ZShyZXN1bHQpXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzTnVtYmVyVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXBhcmF0b3JWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VwYXJhdG9yUHJlY2lzaW9uKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSB0aGlzLmRlY2ltYWxNYXJrZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnNlcGFyYXRvckxpbWl0Lmxlbmd0aCA+IDE0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhzZXBhcmF0b3JWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2tQcmVjaXNpb24odGhpcy5tYXNrRXhwcmVzc2lvbiwgc2VwYXJhdG9yVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNlcGFyYXRvclZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2hlY2tQYXR0ZXJuRm9yU3BhY2UoKTogYm9vbGVhbiB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMucGF0dGVybnMpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b3R5cGUtYnVpbHRpbnNcbiAgICAgICAgICAgIGlmICh0aGlzLnBhdHRlcm5zW2tleV0gJiYgdGhpcy5wYXR0ZXJuc1trZXldPy5oYXNPd25Qcm9wZXJ0eSgncGF0dGVybicpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0dGVyblN0cmluZyA9IHRoaXMucGF0dGVybnNba2V5XT8ucGF0dGVybi50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSB0aGlzLnBhdHRlcm5zW2tleV0/LnBhdHRlcm47XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAocGF0dGVyblN0cmluZz8uaW5jbHVkZXMoTWFza0V4cHJlc3Npb24uV0hJVEVfU1BBQ0UpIGFzIGJvb2xlYW4pICYmXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm4/LnRlc3QodGhpcy5tYXNrRXhwcmVzc2lvbilcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gVE9ETyBzaG91bGQgdGhpbmsgYWJvdXQgaGVscGVycyBvciBzZXBhcnRpbmcgZGVjaW1hbCBwcmVjaXNpb24gdG8gb3duIHByb3BlcnR5XG4gICAgcHJpdmF0ZSBfcmV0cmlldmVTZXBhcmF0b3JQcmVjaXNpb24obWFza0V4cHJldGlvbjogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IG1hdGNoZXI6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsID0gbWFza0V4cHJldGlvbi5tYXRjaChcbiAgICAgICAgICAgIG5ldyBSZWdFeHAoYF5zZXBhcmF0b3JcXFxcLihbXmRdKilgKVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gbWF0Y2hlciA/IE51bWJlcihtYXRjaGVyWzFdKSA6IG51bGw7XG4gICAgfVxuXG4gICAgcHVibGljIF9jaGVja1ByZWNpc2lvbihzZXBhcmF0b3JFeHByZXNzaW9uOiBzdHJpbmcsIHNlcGFyYXRvclZhbHVlOiBzdHJpbmcpOiBudW1iZXIgfCBzdHJpbmcge1xuICAgICAgICBjb25zdCBzZXBhcmF0b3JQcmVjaXNpb24gPSBzZXBhcmF0b3JFeHByZXNzaW9uLnNsaWNlKDEwLCAxMSk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHNlcGFyYXRvckV4cHJlc3Npb24uaW5kZXhPZignMicpID4gMCB8fFxuICAgICAgICAgICAgKHRoaXMubGVhZFplcm8gJiYgTnVtYmVyKHNlcGFyYXRvclByZWNpc2lvbikgPiAwKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRlY2ltYWxNYXJrZXIgPT09IE1hc2tFeHByZXNzaW9uLkNPTU1BICYmIHRoaXMubGVhZFplcm8pIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBzZXBhcmF0b3JWYWx1ZSA9IHNlcGFyYXRvclZhbHVlLnJlcGxhY2UoJywnLCAnLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVhZFplcm9cbiAgICAgICAgICAgICAgICA/IE51bWJlcihzZXBhcmF0b3JWYWx1ZSkudG9GaXhlZChOdW1iZXIoc2VwYXJhdG9yUHJlY2lzaW9uKSlcbiAgICAgICAgICAgICAgICA6IE51bWJlcihzZXBhcmF0b3JWYWx1ZSkudG9GaXhlZCgyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5udW1iZXJUb1N0cmluZyhzZXBhcmF0b3JWYWx1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIF9yZXBlYXRQYXR0ZXJuU3ltYm9scyhtYXNrRXhwOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgKG1hc2tFeHAubWF0Y2goL3tbMC05XSt9LykgJiZcbiAgICAgICAgICAgICAgICBtYXNrRXhwXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpXG4gICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoKGFjY3VtOiBzdHJpbmcsIGN1cnJWYWw6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyclZhbCA9PT0gTWFza0V4cHJlc3Npb24uQ1VSTFlfQlJBQ0tFVFNfTEVGVCA/IGluZGV4IDogdGhpcy5fc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyclZhbCAhPT0gTWFza0V4cHJlc3Npb24uQ1VSTFlfQlJBQ0tFVFNfUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNwZWNpYWxDaGFyKGN1cnJWYWwpID8gYWNjdW0gKyBjdXJyVmFsIDogYWNjdW07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbmQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcGVhdE51bWJlciA9IE51bWJlcihtYXNrRXhwLnNsaWNlKHRoaXMuX3N0YXJ0ICsgMSwgdGhpcy5fZW5kKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlV2l0aDogc3RyaW5nID0gbmV3IEFycmF5KHJlcGVhdE51bWJlciArIDEpLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cFt0aGlzLl9zdGFydCAtIDFdXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHAuc2xpY2UoMCwgdGhpcy5fc3RhcnQpLmxlbmd0aCA+IDEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNrRXhwLmluY2x1ZGVzKE1hc2tFeHByZXNzaW9uLkxFVFRFUl9TKVxuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3ltYm9scyA9IG1hc2tFeHAuc2xpY2UoMCwgdGhpcy5fc3RhcnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9scy5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5DVVJMWV9CUkFDS0VUU19MRUZUKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGFjY3VtICsgcmVwbGFjZVdpdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzeW1ib2xzICsgYWNjdW0gKyByZXBsYWNlV2l0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtICsgcmVwbGFjZVdpdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sICcnKSkgfHxcbiAgICAgICAgICAgIG1hc2tFeHBcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3VycmVudExvY2FsZURlY2ltYWxNYXJrZXIoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuICgxLjEpLnRvTG9jYWxlU3RyaW5nKCkuc3Vic3RyaW5nKDEsIDIpO1xuICAgIH1cbn1cbiJdfQ==
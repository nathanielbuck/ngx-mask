import { inject, Injectable } from '@angular/core';
import { NGX_MASK_CONFIG } from './ngx-mask.config';
import * as i0 from "@angular/core";
export class NgxMaskApplierService {
    constructor() {
        this._config = inject(NGX_MASK_CONFIG);
        this.dropSpecialCharacters = this._config.dropSpecialCharacters;
        this.hiddenInput = this._config.hiddenInput;
        this.clearIfNotMatch = this._config.clearIfNotMatch;
        this.specialCharacters = this._config.specialCharacters;
        this.patterns = this._config.patterns;
        this.prefix = this._config.prefix;
        this.suffix = this._config.suffix;
        this.thousandSeparator = this._config.thousandSeparator;
        this.decimalMarker = this._config.decimalMarker;
        this.showMaskTyped = this._config.showMaskTyped;
        this.placeHolderCharacter = this._config.placeHolderCharacter;
        this.validation = this._config.validation;
        this.separatorLimit = this._config.separatorLimit;
        this.allowNegativeNumbers = this._config.allowNegativeNumbers;
        this.leadZeroDateTime = this._config.leadZeroDateTime;
        this.leadZero = this._config.leadZero;
        this.apm = this._config.apm;
        this.inputTransformFn = this._config.inputTransformFn;
        this.outputTransformFn = this._config.outputTransformFn;
        this.keepCharacterPositions = this._config.keepCharacterPositions;
        this._shift = new Set();
        this.plusOnePosition = false;
        this.maskExpression = '';
        this.actualValue = '';
        this.showKeepCharacterExp = '';
        this.shownMaskExpression = '';
        this.deletedSpecialCharacter = false;
        this._formatWithSeparators = (str, thousandSeparatorChar, decimalChars, precision) => {
            let x = [];
            let decimalChar = '';
            if (Array.isArray(decimalChars)) {
                const regExp = new RegExp(decimalChars.map((v) => ('[\\^$.|?*+()'.indexOf(v) >= 0 ? `\\${v}` : v)).join('|'));
                x = str.split(regExp);
                decimalChar = str.match(regExp)?.[0] ?? "" /* MaskExpression.EMPTY_STRING */;
            }
            else {
                x = str.split(decimalChars);
                decimalChar = decimalChars;
            }
            const decimals = x.length > 1 ? `${decimalChar}${x[1]}` : "" /* MaskExpression.EMPTY_STRING */;
            let res = x[0] ?? "" /* MaskExpression.EMPTY_STRING */;
            const separatorLimit = this.separatorLimit.replace(/\s/g, "" /* MaskExpression.EMPTY_STRING */);
            if (separatorLimit && +separatorLimit) {
                if (res[0] === "-" /* MaskExpression.MINUS */) {
                    res = `-${res.slice(1, res.length).slice(0, separatorLimit.length)}`;
                }
                else {
                    res = res.slice(0, separatorLimit.length);
                }
            }
            const rgx = /(\d+)(\d{3})/;
            while (thousandSeparatorChar && rgx.test(res)) {
                res = res.replace(rgx, '$1' + thousandSeparatorChar + '$2');
            }
            if (precision === undefined) {
                return res + decimals;
            }
            else if (precision === 0) {
                return res;
            }
            return res + decimals.substring(0, precision + 1);
        };
        this.percentage = (str) => {
            const sanitizedStr = str.replace(',', '.');
            const value = Number(this.allowNegativeNumbers && str.includes("-" /* MaskExpression.MINUS */)
                ? sanitizedStr.slice(1, str.length)
                : sanitizedStr);
            return !isNaN(value) && value >= 0 && value <= 100;
        };
        this.getPrecision = (maskExpression) => {
            const x = maskExpression.split("." /* MaskExpression.DOT */);
            if (x.length > 1) {
                return Number(x[x.length - 1]);
            }
            return Infinity;
        };
        this.checkAndRemoveSuffix = (inputValue) => {
            for (let i = this.suffix?.length - 1; i >= 0; i--) {
                const substr = this.suffix.substring(i, this.suffix?.length);
                if (inputValue.includes(substr) &&
                    i !== this.suffix?.length - 1 &&
                    (i - 1 < 0 ||
                        !inputValue.includes(this.suffix.substring(i - 1, this.suffix?.length)))) {
                    return inputValue.replace(substr, "" /* MaskExpression.EMPTY_STRING */);
                }
            }
            return inputValue;
        };
        this.checkInputPrecision = (inputValue, precision, decimalMarker) => {
            if (precision < Infinity) {
                // TODO need think about decimalMarker
                if (Array.isArray(decimalMarker)) {
                    const marker = decimalMarker.find((dm) => dm !== this.thousandSeparator);
                    // eslint-disable-next-line no-param-reassign
                    decimalMarker = marker ? marker : decimalMarker[0];
                }
                const precisionRegEx = new RegExp(this._charToRegExpExpression(decimalMarker) + `\\d{${precision}}.*$`);
                const precisionMatch = inputValue.match(precisionRegEx);
                const precisionMatchLength = (precisionMatch && precisionMatch[0]?.length) ?? 0;
                if (precisionMatchLength - 1 > precision) {
                    const diff = precisionMatchLength - 1 - precision;
                    // eslint-disable-next-line no-param-reassign
                    inputValue = inputValue.substring(0, inputValue.length - diff);
                }
                if (precision === 0 &&
                    this._compareOrIncludes(inputValue[inputValue.length - 1], decimalMarker, this.thousandSeparator)) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
            }
            return inputValue;
        };
    }
    applyMaskWithPattern(inputValue, maskAndPattern) {
        const [mask, customPattern] = maskAndPattern;
        this.customPattern = customPattern;
        return this.applyMask(inputValue, mask);
    }
    applyMask(inputValue, maskExpression, position = 0, justPasted = false, backspaced = false, 
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
    cb = () => { }) {
        if (!maskExpression || typeof inputValue !== 'string') {
            return "" /* MaskExpression.EMPTY_STRING */;
        }
        let cursor = 0;
        let result = '';
        let multi = false;
        let backspaceShift = false;
        let shift = 1;
        let stepBack = false;
        if (inputValue.slice(0, this.prefix.length) === this.prefix) {
            // eslint-disable-next-line no-param-reassign
            inputValue = inputValue.slice(this.prefix.length, inputValue.length);
        }
        if (!!this.suffix && inputValue?.length > 0) {
            // eslint-disable-next-line no-param-reassign
            inputValue = this.checkAndRemoveSuffix(inputValue);
        }
        if (inputValue === '(' && this.prefix) {
            // eslint-disable-next-line no-param-reassign
            inputValue = '';
        }
        const inputArray = inputValue.toString().split("" /* MaskExpression.EMPTY_STRING */);
        if (this.allowNegativeNumbers &&
            inputValue.slice(cursor, cursor + 1) === "-" /* MaskExpression.MINUS */) {
            // eslint-disable-next-line no-param-reassign
            result += inputValue.slice(cursor, cursor + 1);
        }
        if (maskExpression === "IP" /* MaskExpression.IP */) {
            const valuesIP = inputValue.split("." /* MaskExpression.DOT */);
            this.ipError = this._validIP(valuesIP);
            // eslint-disable-next-line no-param-reassign
            maskExpression = '099.099.099.099';
        }
        const arr = [];
        for (let i = 0; i < inputValue.length; i++) {
            if (inputValue[i]?.match('\\d')) {
                arr.push(inputValue[i] ?? "" /* MaskExpression.EMPTY_STRING */);
            }
        }
        if (maskExpression === "CPF_CNPJ" /* MaskExpression.CPF_CNPJ */) {
            this.cpfCnpjError = arr.length !== 11 && arr.length !== 14;
            if (arr.length > 11) {
                // eslint-disable-next-line no-param-reassign
                maskExpression = '00.000.000/0000-00';
            }
            else {
                // eslint-disable-next-line no-param-reassign
                maskExpression = '000.000.000-00';
            }
        }
        if (maskExpression.startsWith("percent" /* MaskExpression.PERCENT */)) {
            if (inputValue.match('[a-z]|[A-Z]') ||
                // eslint-disable-next-line no-useless-escape
                (inputValue.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,\/.]/) && !backspaced)) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this._stripToDecimal(inputValue);
                const precision = this.getPrecision(maskExpression);
                // eslint-disable-next-line no-param-reassign
                inputValue = this.checkInputPrecision(inputValue, precision, this.decimalMarker);
            }
            const decimalMarker = typeof this.decimalMarker === 'string' ? this.decimalMarker : "." /* MaskExpression.DOT */;
            if (inputValue.indexOf(decimalMarker) > 0 &&
                !this.percentage(inputValue.substring(0, inputValue.indexOf(decimalMarker)))) {
                let base = inputValue.substring(0, inputValue.indexOf(decimalMarker) - 1);
                if (this.allowNegativeNumbers &&
                    inputValue.slice(cursor, cursor + 1) === "-" /* MaskExpression.MINUS */ &&
                    !backspaced) {
                    base = inputValue.substring(0, inputValue.indexOf(decimalMarker));
                }
                // eslint-disable-next-line no-param-reassign
                inputValue = `${base}${inputValue.substring(inputValue.indexOf(decimalMarker), inputValue.length)}`;
            }
            let value = '';
            this.allowNegativeNumbers &&
                inputValue.slice(cursor, cursor + 1) === "-" /* MaskExpression.MINUS */
                ? (value = `${"-" /* MaskExpression.MINUS */}${inputValue.slice(cursor + 1, cursor + inputValue.length)}`)
                : (value = inputValue);
            if (this.percentage(value)) {
                result = this._splitPercentZero(inputValue);
            }
            else {
                result = this._splitPercentZero(inputValue.substring(0, inputValue.length - 1));
            }
        }
        else if (maskExpression.startsWith("separator" /* MaskExpression.SEPARATOR */)) {
            if (inputValue.match('[wа-яА-Я]') ||
                inputValue.match('[ЁёА-я]') ||
                inputValue.match('[a-z]|[A-Z]') ||
                inputValue.match(/[-@#!$%\\^&*()_£¬'+|~=`{}\]:";<>.?/]/) ||
                inputValue.match('[^A-Za-z0-9,]')) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this._stripToDecimal(inputValue);
            }
            const precision = this.getPrecision(maskExpression);
            const decimalMarker = Array.isArray(this.decimalMarker)
                ? "." /* MaskExpression.DOT */
                : this.decimalMarker;
            if (precision === 0) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this.allowNegativeNumbers
                    ? inputValue.length > 2 &&
                        inputValue[0] === "-" /* MaskExpression.MINUS */ &&
                        inputValue[1] === "0" /* MaskExpression.NUMBER_ZERO */ &&
                        inputValue[2] !== this.thousandSeparator &&
                        inputValue[2] !== "," /* MaskExpression.COMMA */ &&
                        inputValue[2] !== "." /* MaskExpression.DOT */
                        ? '-' + inputValue.slice(2, inputValue.length)
                        : inputValue[0] === "0" /* MaskExpression.NUMBER_ZERO */ &&
                            inputValue.length > 1 &&
                            inputValue[1] !== this.thousandSeparator &&
                            inputValue[1] !== "," /* MaskExpression.COMMA */ &&
                            inputValue[1] !== "." /* MaskExpression.DOT */
                            ? inputValue.slice(1, inputValue.length)
                            : inputValue
                    : inputValue.length > 1 &&
                        inputValue[0] === "0" /* MaskExpression.NUMBER_ZERO */ &&
                        inputValue[1] !== this.thousandSeparator &&
                        inputValue[1] !== "," /* MaskExpression.COMMA */ &&
                        inputValue[1] !== "." /* MaskExpression.DOT */
                        ? inputValue.slice(1, inputValue.length)
                        : inputValue;
            }
            else {
                // eslint-disable-next-line no-param-reassign
                if (inputValue[0] === decimalMarker && inputValue.length > 1) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue =
                        "0" /* MaskExpression.NUMBER_ZERO */ + inputValue.slice(0, inputValue.length + 1);
                    this.plusOnePosition = true;
                }
                if (inputValue[0] === "0" /* MaskExpression.NUMBER_ZERO */ &&
                    inputValue[1] !== decimalMarker &&
                    inputValue[1] !== this.thousandSeparator) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue =
                        inputValue.length > 1
                            ? inputValue.slice(0, 1) +
                                decimalMarker +
                                inputValue.slice(1, inputValue.length + 1)
                            : inputValue;
                    this.plusOnePosition = true;
                }
                if (this.allowNegativeNumbers &&
                    inputValue[0] === "-" /* MaskExpression.MINUS */ &&
                    (inputValue[1] === decimalMarker ||
                        inputValue[1] === "0" /* MaskExpression.NUMBER_ZERO */)) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue =
                        inputValue[1] === decimalMarker && inputValue.length > 2
                            ? inputValue.slice(0, 1) +
                                "0" /* MaskExpression.NUMBER_ZERO */ +
                                inputValue.slice(1, inputValue.length)
                            : inputValue[1] === "0" /* MaskExpression.NUMBER_ZERO */ &&
                                inputValue.length > 2 &&
                                inputValue[2] !== decimalMarker
                                ? inputValue.slice(0, 2) +
                                    decimalMarker +
                                    inputValue.slice(2, inputValue.length)
                                : inputValue;
                    this.plusOnePosition = true;
                }
            }
            if (backspaced) {
                if (inputValue[0] === "0" /* MaskExpression.NUMBER_ZERO */ &&
                    inputValue[1] === this.decimalMarker &&
                    (inputValue[position] === "0" /* MaskExpression.NUMBER_ZERO */ ||
                        inputValue[position] === this.decimalMarker)) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = inputValue.slice(2, inputValue.length);
                }
                if (inputValue[0] === "-" /* MaskExpression.MINUS */ &&
                    inputValue[1] === "0" /* MaskExpression.NUMBER_ZERO */ &&
                    inputValue[2] === this.decimalMarker &&
                    (inputValue[position] === "0" /* MaskExpression.NUMBER_ZERO */ ||
                        inputValue[position] === this.decimalMarker)) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = "-" /* MaskExpression.MINUS */ + inputValue.slice(3, inputValue.length);
                }
                // eslint-disable-next-line no-param-reassign
                inputValue = this._compareOrIncludes(inputValue[inputValue.length - 1], this.decimalMarker, this.thousandSeparator)
                    ? inputValue.slice(0, inputValue.length - 1)
                    : inputValue;
            }
            // TODO: we had different rexexps here for the different cases... but tests dont seam to bother - check this
            //  separator: no COMMA, dot-sep: no SPACE, COMMA OK, comma-sep: no SPACE, COMMA OK
            const thousandSeparatorCharEscaped = this._charToRegExpExpression(this.thousandSeparator);
            let invalidChars = '@#!$%^&*()_+|~=`{}\\[\\]:\\s,\\.";<>?\\/'.replace(thousandSeparatorCharEscaped, '');
            //.replace(decimalMarkerEscaped, '');
            if (Array.isArray(this.decimalMarker)) {
                for (const marker of this.decimalMarker) {
                    invalidChars = invalidChars.replace(this._charToRegExpExpression(marker), "" /* MaskExpression.EMPTY_STRING */);
                }
            }
            else {
                invalidChars = invalidChars.replace(this._charToRegExpExpression(this.decimalMarker), '');
            }
            const invalidCharRegexp = new RegExp('[' + invalidChars + ']');
            if (inputValue.match(invalidCharRegexp)) {
                // eslint-disable-next-line no-param-reassign
                inputValue = inputValue.substring(0, inputValue.length - 1);
            }
            // eslint-disable-next-line no-param-reassign
            inputValue = this.checkInputPrecision(inputValue, precision, this.decimalMarker);
            const strForSep = inputValue.replace(new RegExp(thousandSeparatorCharEscaped, 'g'), '');
            result = this._formatWithSeparators(strForSep, this.thousandSeparator, this.decimalMarker, precision);
            const commaShift = result.indexOf("," /* MaskExpression.COMMA */) - inputValue.indexOf("," /* MaskExpression.COMMA */);
            const shiftStep = result.length - inputValue.length;
            if (result[position - 1] === this.thousandSeparator && this.prefix && backspaced) {
                // eslint-disable-next-line no-param-reassign
                position = position - 1;
            }
            else if (shiftStep > 0 && result[position] !== this.thousandSeparator) {
                backspaceShift = true;
                let _shift = 0;
                do {
                    this._shift.add(position + _shift);
                    _shift++;
                } while (_shift < shiftStep);
            }
            else if (result[position - 1] === this.decimalMarker ||
                shiftStep === -4 ||
                shiftStep === -3 ||
                result[position] === "," /* MaskExpression.COMMA */) {
                this._shift.clear();
                this._shift.add(position - 1);
            }
            else if ((commaShift !== 0 &&
                position > 0 &&
                !(result.indexOf("," /* MaskExpression.COMMA */) >= position && position > 3)) ||
                (!(result.indexOf("." /* MaskExpression.DOT */) >= position && position > 3) &&
                    shiftStep <= 0)) {
                this._shift.clear();
                backspaceShift = true;
                shift = shiftStep;
                // eslint-disable-next-line no-param-reassign
                position += shiftStep;
                this._shift.add(position);
            }
            else {
                this._shift.clear();
            }
        }
        else {
            for (
            // eslint-disable-next-line
            let i = 0, inputSymbol = inputArray[0]; i < inputArray.length; i++, inputSymbol = inputArray[i] ?? "" /* MaskExpression.EMPTY_STRING */) {
                if (cursor === maskExpression.length) {
                    break;
                }
                const symbolStarInPattern = "*" /* MaskExpression.SYMBOL_STAR */ in this.patterns;
                if (this._checkSymbolMask(inputSymbol, maskExpression[cursor] ?? "" /* MaskExpression.EMPTY_STRING */) &&
                    maskExpression[cursor + 1] === "?" /* MaskExpression.SYMBOL_QUESTION */) {
                    result += inputSymbol;
                    cursor += 2;
                }
                else if (maskExpression[cursor + 1] === "*" /* MaskExpression.SYMBOL_STAR */ &&
                    multi &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2] ?? "" /* MaskExpression.EMPTY_STRING */)) {
                    result += inputSymbol;
                    cursor += 3;
                    multi = false;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor] ?? "" /* MaskExpression.EMPTY_STRING */) &&
                    maskExpression[cursor + 1] === "*" /* MaskExpression.SYMBOL_STAR */ &&
                    !symbolStarInPattern) {
                    result += inputSymbol;
                    multi = true;
                }
                else if (maskExpression[cursor + 1] === "?" /* MaskExpression.SYMBOL_QUESTION */ &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2] ?? "" /* MaskExpression.EMPTY_STRING */)) {
                    result += inputSymbol;
                    cursor += 3;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor] ?? "" /* MaskExpression.EMPTY_STRING */)) {
                    if (maskExpression[cursor] === "H" /* MaskExpression.HOURS */) {
                        if (this.apm ? Number(inputSymbol) > 9 : Number(inputSymbol) > 2) {
                            // eslint-disable-next-line no-param-reassign
                            position = !this.leadZeroDateTime ? position + 1 : position;
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === "h" /* MaskExpression.HOUR */) {
                        if (this.apm
                            ? (result.length === 1 && Number(result) > 1) ||
                                (result === '1' && Number(inputSymbol) > 2) ||
                                (inputValue.slice(cursor - 1, cursor).length === 1 &&
                                    Number(inputValue.slice(cursor - 1, cursor)) > 2) ||
                                (inputValue.slice(cursor - 1, cursor) === '1' &&
                                    Number(inputSymbol) > 2)
                            : (result === '2' && Number(inputSymbol) > 3) ||
                                ((result.slice(cursor - 2, cursor) === '2' ||
                                    result.slice(cursor - 3, cursor) === '2' ||
                                    result.slice(cursor - 4, cursor) === '2' ||
                                    result.slice(cursor - 1, cursor) === '2') &&
                                    Number(inputSymbol) > 3 &&
                                    cursor > 10)) {
                            // eslint-disable-next-line no-param-reassign
                            position = position + 1;
                            cursor += 1;
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === "m" /* MaskExpression.MINUTE */ ||
                        maskExpression[cursor] === "s" /* MaskExpression.SECOND */) {
                        if (Number(inputSymbol) > 5) {
                            // eslint-disable-next-line no-param-reassign
                            position = !this.leadZeroDateTime ? position + 1 : position;
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    const daysCount = 31;
                    const inputValueCursor = inputValue[cursor];
                    const inputValueCursorPlusOne = inputValue[cursor + 1];
                    const inputValueCursorPlusTwo = inputValue[cursor + 2];
                    const inputValueCursorMinusOne = inputValue[cursor - 1];
                    const inputValueCursorMinusTwo = inputValue[cursor - 2];
                    const inputValueCursorMinusThree = inputValue[cursor - 3];
                    const inputValueSliceMinusThreeMinusOne = inputValue.slice(cursor - 3, cursor - 1);
                    const inputValueSliceMinusOnePlusOne = inputValue.slice(cursor - 1, cursor + 1);
                    const inputValueSliceCursorPlusTwo = inputValue.slice(cursor, cursor + 2);
                    const inputValueSliceMinusTwoCursor = inputValue.slice(cursor - 2, cursor);
                    if (maskExpression[cursor] === "d" /* MaskExpression.DAY */) {
                        const maskStartWithMonth = maskExpression.slice(0, 2) === "M0" /* MaskExpression.MONTHS */;
                        const startWithMonthInput = maskExpression.slice(0, 2) === "M0" /* MaskExpression.MONTHS */ &&
                            this.specialCharacters.includes(inputValueCursorMinusTwo);
                        if ((Number(inputSymbol) > 3 && this.leadZeroDateTime) ||
                            (!maskStartWithMonth &&
                                (Number(inputValueSliceCursorPlusTwo) > daysCount ||
                                    Number(inputValueSliceMinusOnePlusOne) > daysCount ||
                                    (this.specialCharacters.includes(inputValueCursorPlusOne) &&
                                        !backspaced))) ||
                            (startWithMonthInput
                                ? Number(inputValueSliceMinusOnePlusOne) > daysCount ||
                                    (!this.specialCharacters.includes(inputValueCursor) &&
                                        this.specialCharacters.includes(inputValueCursorPlusTwo)) ||
                                    this.specialCharacters.includes(inputValueCursor)
                                : Number(inputValueSliceCursorPlusTwo) > daysCount ||
                                    (this.specialCharacters.includes(inputValueCursorPlusOne) &&
                                        !backspaced))) {
                            // eslint-disable-next-line no-param-reassign
                            position = !this.leadZeroDateTime ? position + 1 : position;
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === "M" /* MaskExpression.MONTH */) {
                        const monthsCount = 12;
                        // mask without day
                        const withoutDays = cursor === 0 &&
                            (Number(inputSymbol) > 2 ||
                                Number(inputValueSliceCursorPlusTwo) > monthsCount ||
                                (this.specialCharacters.includes(inputValueCursorPlusOne) &&
                                    !backspaced));
                        // day<10 && month<12 for input
                        const specialChart = maskExpression.slice(cursor + 2, cursor + 3);
                        const day1monthInput = inputValueSliceMinusThreeMinusOne.includes(specialChart) &&
                            maskExpression.includes('d0') &&
                            ((this.specialCharacters.includes(inputValueCursorMinusTwo) &&
                                Number(inputValueSliceMinusOnePlusOne) > monthsCount &&
                                !this.specialCharacters.includes(inputValueCursor)) ||
                                this.specialCharacters.includes(inputValueCursor) ||
                                (this.specialCharacters.includes(inputValueCursorMinusThree) &&
                                    Number(inputValueSliceMinusTwoCursor) > monthsCount &&
                                    !this.specialCharacters.includes(inputValueCursorMinusOne)) ||
                                this.specialCharacters.includes(inputValueCursorMinusOne));
                        //  month<12 && day<10 for input
                        const day2monthInput = Number(inputValueSliceMinusThreeMinusOne) <= daysCount &&
                            !this.specialCharacters.includes(inputValueSliceMinusThreeMinusOne) &&
                            this.specialCharacters.includes(inputValueCursorMinusOne) &&
                            (Number(inputValueSliceCursorPlusTwo) > monthsCount ||
                                (this.specialCharacters.includes(inputValueCursorPlusOne) &&
                                    !backspaced));
                        // cursor === 5 && without days
                        const day2monthInputDot = (Number(inputValueSliceCursorPlusTwo) > monthsCount && cursor === 5) ||
                            (this.specialCharacters.includes(inputValueCursorPlusOne) &&
                                cursor === 5);
                        // // day<10 && month<12 for paste whole data
                        const day1monthPaste = Number(inputValueSliceMinusThreeMinusOne) > daysCount &&
                            !this.specialCharacters.includes(inputValueSliceMinusThreeMinusOne) &&
                            !this.specialCharacters.includes(inputValueSliceMinusTwoCursor) &&
                            Number(inputValueSliceMinusTwoCursor) > monthsCount &&
                            maskExpression.includes('d0');
                        // 10<day<31 && month<12 for paste whole data
                        const day2monthPaste = Number(inputValueSliceMinusThreeMinusOne) <= daysCount &&
                            !this.specialCharacters.includes(inputValueSliceMinusThreeMinusOne) &&
                            !this.specialCharacters.includes(inputValueCursorMinusOne) &&
                            Number(inputValueSliceMinusOnePlusOne) > monthsCount;
                        if ((Number(inputSymbol) > 1 && this.leadZeroDateTime) ||
                            withoutDays ||
                            day1monthInput ||
                            day2monthPaste ||
                            day1monthPaste ||
                            day2monthInput ||
                            (day2monthInputDot && !this.leadZeroDateTime)) {
                            // eslint-disable-next-line no-param-reassign
                            position = !this.leadZeroDateTime ? position + 1 : position;
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    result += inputSymbol;
                    cursor++;
                }
                else if ((inputSymbol === " " /* MaskExpression.WHITE_SPACE */ &&
                    maskExpression[cursor] === " " /* MaskExpression.WHITE_SPACE */) ||
                    (inputSymbol === "/" /* MaskExpression.SLASH */ &&
                        maskExpression[cursor] === "/" /* MaskExpression.SLASH */)) {
                    result += inputSymbol;
                    cursor++;
                }
                else if (this.specialCharacters.indexOf(maskExpression[cursor] ?? "" /* MaskExpression.EMPTY_STRING */) !== -1) {
                    result += maskExpression[cursor];
                    cursor++;
                    this._shiftStep(maskExpression, cursor, inputArray.length);
                    i--;
                }
                else if (maskExpression[cursor] === "9" /* MaskExpression.NUMBER_NINE */ &&
                    this.showMaskTyped) {
                    this._shiftStep(maskExpression, cursor, inputArray.length);
                }
                else if (this.patterns[maskExpression[cursor] ?? "" /* MaskExpression.EMPTY_STRING */] &&
                    this.patterns[maskExpression[cursor] ?? "" /* MaskExpression.EMPTY_STRING */]?.optional) {
                    if (!!inputArray[cursor] &&
                        maskExpression !== '099.099.099.099' &&
                        maskExpression !== '000.000.000-00' &&
                        maskExpression !== '00.000.000/0000-00' &&
                        !maskExpression.match(/^9+\.0+$/) &&
                        !this.patterns[maskExpression[cursor] ?? "" /* MaskExpression.EMPTY_STRING */]
                            ?.optional) {
                        result += inputArray[cursor];
                    }
                    if (maskExpression.includes("9" /* MaskExpression.NUMBER_NINE */ + "*" /* MaskExpression.SYMBOL_STAR */) &&
                        maskExpression.includes("0" /* MaskExpression.NUMBER_ZERO */ + "*" /* MaskExpression.SYMBOL_STAR */)) {
                        cursor++;
                    }
                    cursor++;
                    i--;
                }
                else if (this.maskExpression[cursor + 1] === "*" /* MaskExpression.SYMBOL_STAR */ &&
                    this._findSpecialChar(this.maskExpression[cursor + 2] ?? "" /* MaskExpression.EMPTY_STRING */) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.maskExpression[cursor + 1] === "?" /* MaskExpression.SYMBOL_QUESTION */ &&
                    this._findSpecialChar(this.maskExpression[cursor + 2] ?? "" /* MaskExpression.EMPTY_STRING */) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.showMaskTyped &&
                    this.specialCharacters.indexOf(inputSymbol) < 0 &&
                    inputSymbol !== this.placeHolderCharacter &&
                    this.placeHolderCharacter.length === 1) {
                    stepBack = true;
                }
            }
        }
        if (result.length + 1 === maskExpression.length &&
            this.specialCharacters.indexOf(maskExpression[maskExpression.length - 1] ?? "" /* MaskExpression.EMPTY_STRING */) !== -1) {
            result += maskExpression[maskExpression.length - 1];
        }
        let newPosition = position + 1;
        while (this._shift.has(newPosition)) {
            shift++;
            newPosition++;
        }
        let actualShift = justPasted && !maskExpression.startsWith("separator" /* MaskExpression.SEPARATOR */)
            ? cursor
            : this._shift.has(position)
                ? shift
                : 0;
        if (stepBack) {
            actualShift--;
        }
        cb(actualShift, backspaceShift);
        if (shift < 0) {
            this._shift.clear();
        }
        let onlySpecial = false;
        if (backspaced) {
            onlySpecial = inputArray.every((char) => this.specialCharacters.includes(char));
        }
        let res = `${this.prefix}${onlySpecial ? "" /* MaskExpression.EMPTY_STRING */ : result}${this.showMaskTyped ? '' : this.suffix}`;
        if (result.length === 0) {
            res = !this.dropSpecialCharacters ? `${this.prefix}${result}` : `${result}`;
        }
        if (result.includes("-" /* MaskExpression.MINUS */) && this.prefix && this.allowNegativeNumbers) {
            if (backspaced && result === "-" /* MaskExpression.MINUS */) {
                return '';
            }
            res = `${"-" /* MaskExpression.MINUS */}${this.prefix}${result
                .split("-" /* MaskExpression.MINUS */)
                .join("" /* MaskExpression.EMPTY_STRING */)}${this.suffix}`;
        }
        return res;
    }
    _findDropSpecialChar(inputSymbol) {
        if (Array.isArray(this.dropSpecialCharacters)) {
            return this.dropSpecialCharacters.find((val) => val === inputSymbol);
        }
        return this._findSpecialChar(inputSymbol);
    }
    _findSpecialChar(inputSymbol) {
        return this.specialCharacters.find((val) => val === inputSymbol);
    }
    _checkSymbolMask(inputSymbol, maskSymbol) {
        this.patterns = this.customPattern ? this.customPattern : this.patterns;
        return ((this.patterns[maskSymbol]?.pattern &&
            this.patterns[maskSymbol]?.pattern.test(inputSymbol)) ??
            false);
    }
    _stripToDecimal(str) {
        return str
            .split("" /* MaskExpression.EMPTY_STRING */)
            .filter((i, idx) => {
            const isDecimalMarker = typeof this.decimalMarker === 'string'
                ? i === this.decimalMarker
                : // TODO (inepipenko) use utility type
                    this.decimalMarker.includes(i);
            return (i.match('^-?\\d') ||
                i === this.thousandSeparator ||
                isDecimalMarker ||
                (i === "-" /* MaskExpression.MINUS */ && idx === 0 && this.allowNegativeNumbers));
        })
            .join("" /* MaskExpression.EMPTY_STRING */);
    }
    _charToRegExpExpression(char) {
        // if (Array.isArray(char)) {
        // 	return char.map((v) => ('[\\^$.|?*+()'.indexOf(v) >= 0 ? `\\${v}` : v)).join('|');
        // }
        if (char) {
            const charsToEscape = '[\\^$.|?*+()';
            return char === ' ' ? '\\s' : charsToEscape.indexOf(char) >= 0 ? `\\${char}` : char;
        }
        return char;
    }
    _shiftStep(maskExpression, cursor, inputLength) {
        const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor))
            ? inputLength
            : cursor;
        this._shift.add(shiftStep + this.prefix.length || 0);
    }
    _compareOrIncludes(value, comparedValue, excludedValue) {
        return Array.isArray(comparedValue)
            ? comparedValue.filter((v) => v !== excludedValue).includes(value)
            : value === comparedValue;
    }
    _validIP(valuesIP) {
        return !(valuesIP.length === 4 &&
            !valuesIP.some((value, index) => {
                if (valuesIP.length !== index + 1) {
                    return value === "" /* MaskExpression.EMPTY_STRING */ || Number(value) > 255;
                }
                return value === "" /* MaskExpression.EMPTY_STRING */ || Number(value.substring(0, 3)) > 255;
            }));
    }
    _splitPercentZero(value) {
        if (value === "-" /* MaskExpression.MINUS */ && this.allowNegativeNumbers) {
            return value;
        }
        const decimalIndex = typeof this.decimalMarker === 'string'
            ? value.indexOf(this.decimalMarker)
            : value.indexOf("." /* MaskExpression.DOT */);
        const emptyOrMinus = this.allowNegativeNumbers && value.includes("-" /* MaskExpression.MINUS */) ? '-' : '';
        if (decimalIndex === -1) {
            const parsedValue = parseInt(emptyOrMinus ? value.slice(1, value.length) : value, 10);
            return isNaN(parsedValue)
                ? "" /* MaskExpression.EMPTY_STRING */
                : `${emptyOrMinus}${parsedValue}`;
        }
        else {
            const integerPart = parseInt(value.replace('-', '').substring(0, decimalIndex), 10);
            const decimalPart = value.substring(decimalIndex + 1);
            const integerString = isNaN(integerPart) ? '' : integerPart.toString();
            const decimal = typeof this.decimalMarker === 'string' ? this.decimalMarker : "." /* MaskExpression.DOT */;
            return integerString === "" /* MaskExpression.EMPTY_STRING */
                ? "" /* MaskExpression.EMPTY_STRING */
                : `${emptyOrMinus}${integerString}${decimal}${decimalPart}`;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskApplierService, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskApplierService }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskApplierService, decorators: [{
            type: Injectable
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LW1hc2stYXBwbGllci5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LW1hc2stbGliL3NyYy9saWIvbmd4LW1hc2stYXBwbGllci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELE9BQU8sRUFBRSxlQUFlLEVBQVcsTUFBTSxtQkFBbUIsQ0FBQzs7QUFJN0QsTUFBTSxPQUFPLHFCQUFxQjtJQURsQztRQUVjLFlBQU8sR0FBRyxNQUFNLENBQVUsZUFBZSxDQUFDLENBQUM7UUFFOUMsMEJBQXFCLEdBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUM7UUFFaEMsZ0JBQVcsR0FBMkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFJL0Qsb0JBQWUsR0FBK0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUM7UUFFM0Usc0JBQWlCLEdBQWlDLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7UUFFakYsYUFBUSxHQUF3QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUV0RCxXQUFNLEdBQXNCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBRWhELFdBQU0sR0FBc0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFaEQsc0JBQWlCLEdBQWlDLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7UUFFakYsa0JBQWEsR0FBNkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFJckUsa0JBQWEsR0FBNkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFFckUseUJBQW9CLEdBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUM7UUFFL0IsZUFBVSxHQUEwQixJQUFJLENBQUMs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WUFDdEIsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEYsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDO2dCQUNyQixDQUFDO2dCQUNELENBQUMsQ0FBQyxHQUFHLFlBQVksR0FBRyxXQUFXLEVBQUUsQ0FBQztRQUMxQyxDQUFDO2FBQU0sQ0FBQztZQUNKLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7WUFFdkUsTUFBTSxPQUFPLEdBQ1QsT0FBTyxJQUFJLENBQUMsYUFBYSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLDZCQUFtQixDQUFDO1lBRXJGLE9BQU8sYUFBYSx5Q0FBZ0M7Z0JBQ2hELENBQUM7Z0JBQ0QsQ0FBQyxDQUFDLEdBQUcsWUFBWSxHQUFHLGFBQWEsR0FBRyxPQUFPLEdBQUcsV0FBVyxFQUFFLENBQUM7UUFDcEUsQ0FBQztJQUNMLENBQUM7OEdBcDhCUSxxQkFBcUI7a0hBQXJCLHFCQUFxQjs7MkZBQXJCLHFCQUFxQjtrQkFEakMsVUFBVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTkdYX01BU0tfQ09ORklHLCBJQ29uZmlnIH0gZnJvbSAnLi9uZ3gtbWFzay5jb25maWcnO1xuaW1wb3J0IHsgTWFza0V4cHJlc3Npb24gfSBmcm9tICcuL25neC1tYXNrLWV4cHJlc3Npb24uZW51bSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBOZ3hNYXNrQXBwbGllclNlcnZpY2Uge1xuICAgIHByb3RlY3RlZCBfY29uZmlnID0gaW5qZWN0PElDb25maWc+KE5HWF9NQVNLX0NPTkZJRyk7XG5cbiAgICBwdWJsaWMgZHJvcFNwZWNpYWxDaGFyYWN0ZXJzOiBJQ29uZmlnWydkcm9wU3BlY2lhbENoYXJhY3RlcnMnXSA9XG4gICAgICAgIHRoaXMuX2NvbmZpZy5kcm9wU3BlY2lhbENoYXJhY3RlcnM7XG5cbiAgICBwdWJsaWMgaGlkZGVuSW5wdXQ6IElDb25maWdbJ2hpZGRlbklucHV0J10gPSB0aGlzLl9jb25maWcuaGlkZGVuSW5wdXQ7XG5cbiAgICBwdWJsaWMgc2hvd1RlbXBsYXRlITogSUNvbmZpZ1snc2hvd1RlbXBsYXRlJ107XG5cbiAgICBwdWJsaWMgY2xlYXJJZk5vdE1hdGNoOiBJQ29uZmlnWydjbGVhcklmTm90TWF0Y2gnXSA9IHRoaXMuX2NvbmZpZy5jbGVhcklmTm90TWF0Y2g7XG5cbiAgICBwdWJsaWMgc3BlY2lhbENoYXJhY3RlcnM6IElDb25maWdbJ3NwZWNpYWxDaGFyYWN0ZXJzJ10gPSB0aGlzLl9jb25maWcuc3BlY2lhbENoYXJhY3RlcnM7XG5cbiAgICBwdWJsaWMgcGF0dGVybnM6IElDb25maWdbJ3BhdHRlcm5zJ10gPSB0aGlzLl9jb25maWcucGF0dGVybnM7XG5cbiAgICBwdWJsaWMgcHJlZml4OiBJQ29uZmlnWydwcmVmaXgnXSA9IHRoaXMuX2NvbmZpZy5wcmVmaXg7XG5cbiAgICBwdWJsaWMgc3VmZml4OiBJQ29uZmlnWydzdWZmaXgnXSA9IHRoaXMuX2NvbmZpZy5zdWZmaXg7XG5cbiAgICBwdWJsaWMgdGhvdXNhbmRTZXBhcmF0b3I6IElDb25maWdbJ3Rob3VzYW5kU2VwYXJhdG9yJ10gPSB0aGlzLl9jb25maWcudGhvdXNhbmRTZXBhcmF0b3I7XG5cbiAgICBwdWJsaWMgZGVjaW1hbE1hcmtlcjogSUNvbmZpZ1snZGVjaW1hbE1hcmtlciddID0gdGhpcy5fY29uZmlnLmRlY2ltYWxNYXJrZXI7XG5cbiAgICBwdWJsaWMgY3VzdG9tUGF0dGVybiE6IElDb25maWdbJ3BhdHRlcm5zJ107XG5cbiAgICBwdWJsaWMgc2hvd01hc2tUeXBlZDogSUNvbmZpZ1snc2hvd01hc2tUeXBlZCddID0gdGhpcy5fY29uZmlnLnNob3dNYXNrVHlwZWQ7XG5cbiAgICBwdWJsaWMgcGxhY2VIb2xkZXJDaGFyYWN0ZXI6IElDb25maWdbJ3BsYWNlSG9sZGVyQ2hhcmFjdGVyJ10gPVxuICAgICAgICB0aGlzLl9jb25maWcucGxhY2VIb2xkZXJDaGFyYWN0ZXI7XG5cbiAgICBwdWJsaWMgdmFsaWRhdGlvbjogSUNvbmZpZ1sndmFsaWRhdGlvbiddID0gdGhpcy5fY29uZmlnLnZhbGlkYXRpb247XG5cbiAgICBwdWJsaWMgc2VwYXJhdG9yTGltaXQ6IElDb25maWdbJ3NlcGFyYXRvckxpbWl0J10gPSB0aGlzLl9jb25maWcuc2VwYXJhdG9yTGltaXQ7XG5cbiAgICBwdWJsaWMgYWxsb3dOZWdhdGl2ZU51bWJlcnM6IElDb25maWdbJ2FsbG93TmVnYXRpdmVOdW1iZXJzJ10gPVxuICAgICAgICB0aGlzLl9jb25maWcuYWxsb3dOZWdhdGl2ZU51bWJlcnM7XG5cbiAgICBwdWJsaWMgbGVhZFplcm9EYXRlVGltZTogSUNvbmZpZ1snbGVhZFplcm9EYXRlVGltZSddID0gdGhpcy5fY29uZmlnLmxlYWRaZXJvRGF0ZVRpbWU7XG5cbiAgICBwdWJsaWMgbGVhZFplcm86IElDb25maWdbJ2xlYWRaZXJvJ10gPSB0aGlzLl9jb25maWcubGVhZFplcm87XG5cbiAgICBwdWJsaWMgYXBtOiBJQ29uZmlnWydhcG0nXSA9IHRoaXMuX2NvbmZpZy5hcG07XG5cbiAgICBwdWJsaWMgaW5wdXRUcmFuc2Zvcm1GbjogSUNvbmZpZ1snaW5wdXRUcmFuc2Zvcm1GbiddID0gdGhpcy5fY29uZmlnLmlucHV0VHJhbnNmb3JtRm47XG5cbiAgICBwdWJsaWMgb3V0cHV0VHJhbnNmb3JtRm46IElDb25maWdbJ291dHB1dFRyYW5zZm9ybUZuJ10gPSB0aGlzLl9jb25maWcub3V0cHV0VHJhbnNmb3JtRm47XG5cbiAgICBwdWJsaWMga2VlcENoYXJhY3RlclBvc2l0aW9uczogSUNvbmZpZ1sna2VlcENoYXJhY3RlclBvc2l0aW9ucyddID1cbiAgICAgICAgdGhpcy5fY29uZmlnLmtlZXBDaGFyYWN0ZXJQb3NpdGlvbnM7XG5cbiAgICBwcml2YXRlIF9zaGlmdDogU2V0PG51bWJlcj4gPSBuZXcgU2V0KCk7XG5cbiAgICBwdWJsaWMgcGx1c09uZVBvc2l0aW9uOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgbWFza0V4cHJlc3Npb24gPSAnJztcblxuICAgIHB1YmxpYyBhY3R1YWxWYWx1ZSA9ICcnO1xuXG4gICAgcHVibGljIHNob3dLZWVwQ2hhcmFjdGVyRXhwID0gJyc7XG5cbiAgICBwdWJsaWMgc2hvd25NYXNrRXhwcmVzc2lvbiA9ICcnO1xuXG4gICAgcHVibGljIGRlbGV0ZWRTcGVjaWFsQ2hhcmFjdGVyID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgaXBFcnJvcj86IGJvb2xlYW47XG5cbiAgICBwdWJsaWMgY3BmQ25wakVycm9yPzogYm9vbGVhbjtcblxuICAgIHB1YmxpYyBhcHBseU1hc2tXaXRoUGF0dGVybihcbiAgICAgICAgaW5wdXRWYWx1ZTogc3RyaW5nLFxuICAgICAgICBtYXNrQW5kUGF0dGVybjogW3N0cmluZywgSUNvbmZpZ1sncGF0dGVybnMnXV1cbiAgICApOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBbbWFzaywgY3VzdG9tUGF0dGVybl0gPSBtYXNrQW5kUGF0dGVybjtcbiAgICAgICAgdGhpcy5jdXN0b21QYXR0ZXJuID0gY3VzdG9tUGF0dGVybjtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHlNYXNrKGlucHV0VmFsdWUsIG1hc2spO1xuICAgIH1cblxuICAgIHB1YmxpYyBhcHBseU1hc2soXG4gICAgICAgIGlucHV0VmFsdWU6IHN0cmluZyB8IG9iamVjdCB8IGJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgICAgICBtYXNrRXhwcmVzc2lvbjogc3RyaW5nLFxuICAgICAgICBwb3NpdGlvbiA9IDAsXG4gICAgICAgIGp1c3RQYXN0ZWQgPSBmYWxzZSxcbiAgICAgICAgYmFja3NwYWNlZCA9IGZhbHNlLFxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uLCBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgIGNiOiAoLi4uYXJnczogYW55W10pID0+IGFueSA9ICgpID0+IHt9XG4gICAgKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCFtYXNrRXhwcmVzc2lvbiB8fCB0eXBlb2YgaW5wdXRWYWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkc7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvciA9IDA7XG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAgICAgbGV0IG11bHRpID0gZmFsc2U7XG4gICAgICAgIGxldCBiYWNrc3BhY2VTaGlmdCA9IGZhbHNlO1xuICAgICAgICBsZXQgc2hpZnQgPSAxO1xuICAgICAgICBsZXQgc3RlcEJhY2sgPSBmYWxzZTtcbiAgICAgICAgaWYgKGlucHV0VmFsdWUuc2xpY2UoMCwgdGhpcy5wcmVmaXgubGVuZ3RoKSA9PT0gdGhpcy5wcmVmaXgpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUuc2xpY2UodGhpcy5wcmVmaXgubGVuZ3RoLCBpbnB1dFZhbHVlLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEhdGhpcy5zdWZmaXggJiYgaW5wdXRWYWx1ZT8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICBpbnB1dFZhbHVlID0gdGhpcy5jaGVja0FuZFJlbW92ZVN1ZmZpeChpbnB1dFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJygnICYmIHRoaXMucHJlZml4KSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgIGlucHV0VmFsdWUgPSAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnB1dEFycmF5OiBzdHJpbmdbXSA9IGlucHV0VmFsdWUudG9TdHJpbmcoKS5zcGxpdChNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmFsbG93TmVnYXRpdmVOdW1iZXJzICYmXG4gICAgICAgICAgICBpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciwgY3Vyc29yICsgMSkgPT09IE1hc2tFeHByZXNzaW9uLk1JTlVTXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICByZXN1bHQgKz0gaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IsIGN1cnNvciArIDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbiA9PT0gTWFza0V4cHJlc3Npb24uSVApIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlc0lQID0gaW5wdXRWYWx1ZS5zcGxpdChNYXNrRXhwcmVzc2lvbi5ET1QpO1xuICAgICAgICAgICAgdGhpcy5pcEVycm9yID0gdGhpcy5fdmFsaWRJUCh2YWx1ZXNJUCk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uID0gJzA5OS4wOTkuMDk5LjA5OSc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXJyOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0VmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpbnB1dFZhbHVlW2ldPy5tYXRjaCgnXFxcXGQnKSkge1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKGlucHV0VmFsdWVbaV0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobWFza0V4cHJlc3Npb24gPT09IE1hc2tFeHByZXNzaW9uLkNQRl9DTlBKKSB7XG4gICAgICAgICAgICB0aGlzLmNwZkNucGpFcnJvciA9IGFyci5sZW5ndGggIT09IDExICYmIGFyci5sZW5ndGggIT09IDE0O1xuICAgICAgICAgICAgaWYgKGFyci5sZW5ndGggPiAxMSkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uID0gJzAwLjAwMC4wMDAvMDAwMC0wMCc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uID0gJzAwMC4wMDAuMDAwLTAwJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChNYXNrRXhwcmVzc2lvbi5QRVJDRU5UKSkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUubWF0Y2goJ1thLXpdfFtBLVpdJykgfHxcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbiAgICAgICAgICAgICAgICAoaW5wdXRWYWx1ZS5tYXRjaCgvWy0hJCVeJiooKV8rfH49YHt9XFxbXFxdOlwiOyc8Pj8sXFwvLl0vKSAmJiAhYmFja3NwYWNlZClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLl9zdHJpcFRvRGVjaW1hbChpbnB1dFZhbHVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVjaXNpb246IG51bWJlciA9IHRoaXMuZ2V0UHJlY2lzaW9uKG1hc2tFeHByZXNzaW9uKTtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlID0gdGhpcy5jaGVja0lucHV0UHJlY2lzaW9uKGlucHV0VmFsdWUsIHByZWNpc2lvbiwgdGhpcy5kZWNpbWFsTWFya2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlY2ltYWxNYXJrZXIgPVxuICAgICAgICAgICAgICAgIHR5cGVvZiB0aGlzLmRlY2ltYWxNYXJrZXIgPT09ICdzdHJpbmcnID8gdGhpcy5kZWNpbWFsTWFya2VyIDogTWFza0V4cHJlc3Npb24uRE9UO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUuaW5kZXhPZihkZWNpbWFsTWFya2VyKSA+IDAgJiZcbiAgICAgICAgICAgICAgICAhdGhpcy5wZXJjZW50YWdlKGlucHV0VmFsdWUuc3Vic3RyaW5nKDAsIGlucHV0VmFsdWUuaW5kZXhPZihkZWNpbWFsTWFya2VyKSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBsZXQgYmFzZTogc3RyaW5nID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5pbmRleE9mKGRlY2ltYWxNYXJrZXIpIC0gMSk7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbG93TmVnYXRpdmVOdW1iZXJzICYmXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yLCBjdXJzb3IgKyAxKSA9PT0gTWFza0V4cHJlc3Npb24uTUlOVVMgJiZcbiAgICAgICAgICAgICAgICAgICAgIWJhY2tzcGFjZWRcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzZSA9IGlucHV0VmFsdWUuc3Vic3RyaW5nKDAsIGlucHV0VmFsdWUuaW5kZXhPZihkZWNpbWFsTWFya2VyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgPSBgJHtiYXNlfSR7aW5wdXRWYWx1ZS5zdWJzdHJpbmcoXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWUuaW5kZXhPZihkZWNpbWFsTWFya2VyKSxcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZS5sZW5ndGhcbiAgICAgICAgICAgICAgICApfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSAnJztcbiAgICAgICAgICAgIHRoaXMuYWxsb3dOZWdhdGl2ZU51bWJlcnMgJiZcbiAgICAgICAgICAgIGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yLCBjdXJzb3IgKyAxKSA9PT0gTWFza0V4cHJlc3Npb24uTUlOVVNcbiAgICAgICAgICAgICAgICA/ICh2YWx1ZSA9IGAke01hc2tFeHByZXNzaW9uLk1JTlVTfSR7aW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgKyAxLCBjdXJzb3IgKyBpbnB1dFZhbHVlLmxlbmd0aCl9YClcbiAgICAgICAgICAgICAgICA6ICh2YWx1ZSA9IGlucHV0VmFsdWUpO1xuICAgICAgICAgICAgaWYgKHRoaXMucGVyY2VudGFnZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLl9zcGxpdFBlcmNlbnRaZXJvKGlucHV0VmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLl9zcGxpdFBlcmNlbnRaZXJvKGlucHV0VmFsdWUuc3Vic3RyaW5nKDAsIGlucHV0VmFsdWUubGVuZ3RoIC0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoTWFza0V4cHJlc3Npb24uU0VQQVJBVE9SKSkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUubWF0Y2goJ1t30LAt0Y/QkC3Qr10nKSB8fFxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUubWF0Y2goJ1vQgdGR0JAt0Y9dJykgfHxcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlLm1hdGNoKCdbYS16XXxbQS1aXScpIHx8XG4gICAgICAgICAgICAgICAgaW5wdXRWYWx1ZS5tYXRjaCgvWy1AIyEkJVxcXFxeJiooKV/Co8KsJyt8fj1ge31cXF06XCI7PD4uPy9dLykgfHxcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlLm1hdGNoKCdbXkEtWmEtejAtOSxdJylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLl9zdHJpcFRvRGVjaW1hbChpbnB1dFZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByZWNpc2lvbjogbnVtYmVyID0gdGhpcy5nZXRQcmVjaXNpb24obWFza0V4cHJlc3Npb24pO1xuICAgICAgICAgICAgY29uc3QgZGVjaW1hbE1hcmtlciA9IEFycmF5LmlzQXJyYXkodGhpcy5kZWNpbWFsTWFya2VyKVxuICAgICAgICAgICAgICAgID8gTWFza0V4cHJlc3Npb24uRE9UXG4gICAgICAgICAgICAgICAgOiB0aGlzLmRlY2ltYWxNYXJrZXI7XG4gICAgICAgICAgICBpZiAocHJlY2lzaW9uID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMuYWxsb3dOZWdhdGl2ZU51bWJlcnNcbiAgICAgICAgICAgICAgICAgICAgPyBpbnB1dFZhbHVlLmxlbmd0aCA+IDIgJiZcbiAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlWzBdID09PSBNYXNrRXhwcmVzc2lvbi5NSU5VUyAmJlxuICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMV0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPICYmXG4gICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsyXSAhPT0gdGhpcy50aG91c2FuZFNlcGFyYXRvciAmJlxuICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMl0gIT09IE1hc2tFeHByZXNzaW9uLkNPTU1BICYmXG4gICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsyXSAhPT0gTWFza0V4cHJlc3Npb24uRE9UXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICctJyArIGlucHV0VmFsdWUuc2xpY2UoMiwgaW5wdXRWYWx1ZS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWVbMF0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZS5sZW5ndGggPiAxICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsxXSAhPT0gdGhpcy50aG91c2FuZFNlcGFyYXRvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMV0gIT09IE1hc2tFeHByZXNzaW9uLkNPTU1BICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsxXSAhPT0gTWFza0V4cHJlc3Npb24uRE9UXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gaW5wdXRWYWx1ZS5zbGljZSgxLCBpbnB1dFZhbHVlLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbnB1dFZhbHVlXG4gICAgICAgICAgICAgICAgICAgIDogaW5wdXRWYWx1ZS5sZW5ndGggPiAxICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlWzBdID09PSBNYXNrRXhwcmVzc2lvbi5OVU1CRVJfWkVSTyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsxXSAhPT0gdGhpcy50aG91c2FuZFNlcGFyYXRvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsxXSAhPT0gTWFza0V4cHJlc3Npb24uQ09NTUEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMV0gIT09IE1hc2tFeHByZXNzaW9uLkRPVFxuICAgICAgICAgICAgICAgICAgICAgID8gaW5wdXRWYWx1ZS5zbGljZSgxLCBpbnB1dFZhbHVlLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIGlmIChpbnB1dFZhbHVlWzBdID09PSBkZWNpbWFsTWFya2VyICYmIGlucHV0VmFsdWUubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBNYXNrRXhwcmVzc2lvbi5OVU1CRVJfWkVSTyArIGlucHV0VmFsdWUuc2xpY2UoMCwgaW5wdXRWYWx1ZS5sZW5ndGggKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVzT25lUG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMF0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPICYmXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMV0gIT09IGRlY2ltYWxNYXJrZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsxXSAhPT0gdGhpcy50aG91c2FuZFNlcGFyYXRvclxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGlucHV0VmFsdWUuc2xpY2UoMCwgMSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjaW1hbE1hcmtlciArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlLnNsaWNlKDEsIGlucHV0VmFsdWUubGVuZ3RoICsgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1c09uZVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbG93TmVnYXRpdmVOdW1iZXJzICYmXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMF0gPT09IE1hc2tFeHByZXNzaW9uLk1JTlVTICYmXG4gICAgICAgICAgICAgICAgICAgIChpbnB1dFZhbHVlWzFdID09PSBkZWNpbWFsTWFya2VyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlWzFdID09PSBNYXNrRXhwcmVzc2lvbi5OVU1CRVJfWkVSTylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVsxXSA9PT0gZGVjaW1hbE1hcmtlciAmJiBpbnB1dFZhbHVlLmxlbmd0aCA+IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGlucHV0VmFsdWUuc2xpY2UoMCwgMSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWFza0V4cHJlc3Npb24uTlVNQkVSX1pFUk8gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZS5zbGljZSgxLCBpbnB1dFZhbHVlLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWVbMV0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWUubGVuZ3RoID4gMiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlWzJdICE9PSBkZWNpbWFsTWFya2VyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGlucHV0VmFsdWUuc2xpY2UoMCwgMikgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNpbWFsTWFya2VyICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZS5zbGljZSgyLCBpbnB1dFZhbHVlLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaW5wdXRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVzT25lUG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGJhY2tzcGFjZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMF0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPICYmXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMV0gPT09IHRoaXMuZGVjaW1hbE1hcmtlciAmJlxuICAgICAgICAgICAgICAgICAgICAoaW5wdXRWYWx1ZVtwb3NpdGlvbl0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlW3Bvc2l0aW9uXSA9PT0gdGhpcy5kZWNpbWFsTWFya2VyKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUuc2xpY2UoMiwgaW5wdXRWYWx1ZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMF0gPT09IE1hc2tFeHByZXNzaW9uLk1JTlVTICYmXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMV0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPICYmXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbMl0gPT09IHRoaXMuZGVjaW1hbE1hcmtlciAmJlxuICAgICAgICAgICAgICAgICAgICAoaW5wdXRWYWx1ZVtwb3NpdGlvbl0gPT09IE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlW3Bvc2l0aW9uXSA9PT0gdGhpcy5kZWNpbWFsTWFya2VyKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IE1hc2tFeHByZXNzaW9uLk1JTlVTICsgaW5wdXRWYWx1ZS5zbGljZSgzLCBpbnB1dFZhbHVlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLl9jb21wYXJlT3JJbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVtpbnB1dFZhbHVlLmxlbmd0aCAtIDFdLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhvdXNhbmRTZXBhcmF0b3JcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgID8gaW5wdXRWYWx1ZS5zbGljZSgwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAgICAgICAgIDogaW5wdXRWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE86IHdlIGhhZCBkaWZmZXJlbnQgcmV4ZXhwcyBoZXJlIGZvciB0aGUgZGlmZmVyZW50IGNhc2VzLi4uIGJ1dCB0ZXN0cyBkb250IHNlYW0gdG8gYm90aGVyIC0gY2hlY2sgdGhpc1xuICAgICAgICAgICAgLy8gIHNlcGFyYXRvcjogbm8gQ09NTUEsIGRvdC1zZXA6IG5vIFNQQUNFLCBDT01NQSBPSywgY29tbWEtc2VwOiBubyBTUEFDRSwgQ09NTUEgT0tcblxuICAgICAgICAgICAgY29uc3QgdGhvdXNhbmRTZXBhcmF0b3JDaGFyRXNjYXBlZDogc3RyaW5nID0gdGhpcy5fY2hhclRvUmVnRXhwRXhwcmVzc2lvbihcbiAgICAgICAgICAgICAgICB0aGlzLnRob3VzYW5kU2VwYXJhdG9yXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGludmFsaWRDaGFyczogc3RyaW5nID0gJ0AjISQlXiYqKClfK3x+PWB7fVxcXFxbXFxcXF06XFxcXHMsXFxcXC5cIjs8Pj9cXFxcLycucmVwbGFjZShcbiAgICAgICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRvckNoYXJFc2NhcGVkLFxuICAgICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgLy8ucmVwbGFjZShkZWNpbWFsTWFya2VyRXNjYXBlZCwgJycpO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kZWNpbWFsTWFya2VyKSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgbWFya2VyIG9mIHRoaXMuZGVjaW1hbE1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICBpbnZhbGlkQ2hhcnMgPSBpbnZhbGlkQ2hhcnMucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoYXJUb1JlZ0V4cEV4cHJlc3Npb24obWFya2VyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW52YWxpZENoYXJzID0gaW52YWxpZENoYXJzLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoYXJUb1JlZ0V4cEV4cHJlc3Npb24odGhpcy5kZWNpbWFsTWFya2VyKSxcbiAgICAgICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpbnZhbGlkQ2hhclJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1snICsgaW52YWxpZENoYXJzICsgJ10nKTtcbiAgICAgICAgICAgIGlmIChpbnB1dFZhbHVlLm1hdGNoKGludmFsaWRDaGFyUmVnZXhwKSkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLmNoZWNrSW5wdXRQcmVjaXNpb24oaW5wdXRWYWx1ZSwgcHJlY2lzaW9uLCB0aGlzLmRlY2ltYWxNYXJrZXIpO1xuICAgICAgICAgICAgY29uc3Qgc3RyRm9yU2VwOiBzdHJpbmcgPSBpbnB1dFZhbHVlLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgbmV3IFJlZ0V4cCh0aG91c2FuZFNlcGFyYXRvckNoYXJFc2NhcGVkLCAnZycpLFxuICAgICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl9mb3JtYXRXaXRoU2VwYXJhdG9ycyhcbiAgICAgICAgICAgICAgICBzdHJGb3JTZXAsXG4gICAgICAgICAgICAgICAgdGhpcy50aG91c2FuZFNlcGFyYXRvcixcbiAgICAgICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIsXG4gICAgICAgICAgICAgICAgcHJlY2lzaW9uXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBjb21tYVNoaWZ0OiBudW1iZXIgPVxuICAgICAgICAgICAgICAgIHJlc3VsdC5pbmRleE9mKE1hc2tFeHByZXNzaW9uLkNPTU1BKSAtIGlucHV0VmFsdWUuaW5kZXhPZihNYXNrRXhwcmVzc2lvbi5DT01NQSk7XG4gICAgICAgICAgICBjb25zdCBzaGlmdFN0ZXA6IG51bWJlciA9IHJlc3VsdC5sZW5ndGggLSBpbnB1dFZhbHVlLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdFtwb3NpdGlvbiAtIDFdID09PSB0aGlzLnRob3VzYW5kU2VwYXJhdG9yICYmIHRoaXMucHJlZml4ICYmIGJhY2tzcGFjZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIC0gMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hpZnRTdGVwID4gMCAmJiByZXN1bHRbcG9zaXRpb25dICE9PSB0aGlzLnRob3VzYW5kU2VwYXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgYmFja3NwYWNlU2hpZnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGxldCBfc2hpZnQgPSAwO1xuICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hpZnQuYWRkKHBvc2l0aW9uICsgX3NoaWZ0KTtcbiAgICAgICAgICAgICAgICAgICAgX3NoaWZ0Kys7XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAoX3NoaWZ0IDwgc2hpZnRTdGVwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgcmVzdWx0W3Bvc2l0aW9uIC0gMV0gPT09IHRoaXMuZGVjaW1hbE1hcmtlciB8fFxuICAgICAgICAgICAgICAgIHNoaWZ0U3RlcCA9PT0gLTQgfHxcbiAgICAgICAgICAgICAgICBzaGlmdFN0ZXAgPT09IC0zIHx8XG4gICAgICAgICAgICAgICAgcmVzdWx0W3Bvc2l0aW9uXSA9PT0gTWFza0V4cHJlc3Npb24uQ09NTUFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NoaWZ0LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hpZnQuYWRkKHBvc2l0aW9uIC0gMSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIChjb21tYVNoaWZ0ICE9PSAwICYmXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAhKHJlc3VsdC5pbmRleE9mKE1hc2tFeHByZXNzaW9uLkNPTU1BKSA+PSBwb3NpdGlvbiAmJiBwb3NpdGlvbiA+IDMpKSB8fFxuICAgICAgICAgICAgICAgICghKHJlc3VsdC5pbmRleE9mKE1hc2tFeHByZXNzaW9uLkRPVCkgPj0gcG9zaXRpb24gJiYgcG9zaXRpb24gPiAzKSAmJlxuICAgICAgICAgICAgICAgICAgICBzaGlmdFN0ZXAgPD0gMClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NoaWZ0LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgYmFja3NwYWNlU2hpZnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNoaWZ0ID0gc2hpZnRTdGVwO1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIHBvc2l0aW9uICs9IHNoaWZ0U3RlcDtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGlmdC5hZGQocG9zaXRpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGlmdC5jbGVhcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICAgICAgICAgICAgICBsZXQgaTogbnVtYmVyID0gMCwgaW5wdXRTeW1ib2w6IHN0cmluZyA9IGlucHV0QXJyYXlbMF0hO1xuICAgICAgICAgICAgICAgIGkgPCBpbnB1dEFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpKyssIGlucHV0U3ltYm9sID0gaW5wdXRBcnJheVtpXSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGlmIChjdXJzb3IgPT09IG1hc2tFeHByZXNzaW9uLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzeW1ib2xTdGFySW5QYXR0ZXJuOiBib29sZWFuID0gTWFza0V4cHJlc3Npb24uU1lNQk9MX1NUQVIgaW4gdGhpcy5wYXR0ZXJucztcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9sTWFzayhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0U3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yXSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICAgICAgICBtYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAxXSA9PT0gTWFza0V4cHJlc3Npb24uU1lNQk9MX1FVRVNUSU9OXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yICs9IDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMV0gPT09IE1hc2tFeHByZXNzaW9uLlNZTUJPTF9TVEFSICYmXG4gICAgICAgICAgICAgICAgICAgIG11bHRpICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9sTWFzayhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0U3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMl0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3IgKz0gMztcbiAgICAgICAgICAgICAgICAgICAgbXVsdGkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jaGVja1N5bWJvbE1hc2soXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFN5bWJvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMV0gPT09IE1hc2tFeHByZXNzaW9uLlNZTUJPTF9TVEFSICYmXG4gICAgICAgICAgICAgICAgICAgICFzeW1ib2xTdGFySW5QYXR0ZXJuXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSBNYXNrRXhwcmVzc2lvbi5TWU1CT0xfUVVFU1RJT04gJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xNYXNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRTeW1ib2wsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gaW5wdXRTeW1ib2w7XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvciArPSAzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9sTWFzayhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0U3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yXSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gTWFza0V4cHJlc3Npb24uSE9VUlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmFwbSA/IE51bWJlcihpbnB1dFN5bWJvbCkgPiA5IDogTnVtYmVyKGlucHV0U3ltYm9sKSA+IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9ICF0aGlzLmxlYWRaZXJvRGF0ZVRpbWUgPyBwb3NpdGlvbiArIDEgOiBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zaGlmdFN0ZXAobWFza0V4cHJlc3Npb24sIGN1cnNvciwgaW5wdXRBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnMCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSBNYXNrRXhwcmVzc2lvbi5IT1VSKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcG1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAocmVzdWx0Lmxlbmd0aCA9PT0gMSAmJiBOdW1iZXIocmVzdWx0KSA+IDEpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3VsdCA9PT0gJzEnICYmIE51bWJlcihpbnB1dFN5bWJvbCkgPiAyKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDEsIGN1cnNvcikubGVuZ3RoID09PSAxICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDEsIGN1cnNvcikpID4gMikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAxLCBjdXJzb3IpID09PSAnMScgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKGlucHV0U3ltYm9sKSA+IDIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogKHJlc3VsdCA9PT0gJzInICYmIE51bWJlcihpbnB1dFN5bWJvbCkgPiAzKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgocmVzdWx0LnNsaWNlKGN1cnNvciAtIDIsIGN1cnNvcikgPT09ICcyJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuc2xpY2UoY3Vyc29yIC0gMywgY3Vyc29yKSA9PT0gJzInIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zbGljZShjdXJzb3IgLSA0LCBjdXJzb3IpID09PSAnMicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNsaWNlKGN1cnNvciAtIDEsIGN1cnNvcikgPT09ICcyJykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKGlucHV0U3ltYm9sKSA+IDMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yID4gMTApXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gTWFza0V4cHJlc3Npb24uTUlOVVRFIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSBNYXNrRXhwcmVzc2lvbi5TRUNPTkRcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoTnVtYmVyKGlucHV0U3ltYm9sKSA+IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9ICF0aGlzLmxlYWRaZXJvRGF0ZVRpbWUgPyBwb3NpdGlvbiArIDEgOiBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zaGlmdFN0ZXAobWFza0V4cHJlc3Npb24sIGN1cnNvciwgaW5wdXRBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnMCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRheXNDb3VudCA9IDMxO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnB1dFZhbHVlQ3Vyc29yID0gaW5wdXRWYWx1ZVtjdXJzb3JdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRWYWx1ZUN1cnNvclBsdXNPbmUgPSBpbnB1dFZhbHVlW2N1cnNvciArIDFdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRWYWx1ZUN1cnNvclBsdXNUd28gPSBpbnB1dFZhbHVlW2N1cnNvciArIDJdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRWYWx1ZUN1cnNvck1pbnVzT25lID0gaW5wdXRWYWx1ZVtjdXJzb3IgLSAxXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0VmFsdWVDdXJzb3JNaW51c1R3byA9IGlucHV0VmFsdWVbY3Vyc29yIC0gMl0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnB1dFZhbHVlQ3Vyc29yTWludXNUaHJlZSA9IGlucHV0VmFsdWVbY3Vyc29yIC0gM10gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnB1dFZhbHVlU2xpY2VNaW51c1RocmVlTWludXNPbmUgPSBpbnB1dFZhbHVlLnNsaWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yIC0gMyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvciAtIDFcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRWYWx1ZVNsaWNlTWludXNPbmVQbHVzT25lID0gaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAxLCBjdXJzb3IgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRWYWx1ZVNsaWNlQ3Vyc29yUGx1c1R3byA9IGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yLCBjdXJzb3IgKyAyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRWYWx1ZVNsaWNlTWludXNUd29DdXJzb3IgPSBpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDIsIGN1cnNvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSBNYXNrRXhwcmVzc2lvbi5EQVkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hc2tTdGFydFdpdGhNb250aCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb24uc2xpY2UoMCwgMikgPT09IE1hc2tFeHByZXNzaW9uLk1PTlRIUztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0V2l0aE1vbnRoSW5wdXQ6IGJvb2xlYW4gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uLnNsaWNlKDAsIDIpID09PSBNYXNrRXhwcmVzc2lvbi5NT05USFMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3JNaW51c1R3byk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKE51bWJlcihpbnB1dFN5bWJvbCkgPiAzICYmIHRoaXMubGVhZFplcm9EYXRlVGltZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoIW1hc2tTdGFydFdpdGhNb250aCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoTnVtYmVyKGlucHV0VmFsdWVTbGljZUN1cnNvclBsdXNUd28pID4gZGF5c0NvdW50IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZVNsaWNlTWludXNPbmVQbHVzT25lKSA+IGRheXNDb3VudCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoaW5wdXRWYWx1ZUN1cnNvclBsdXNPbmUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIWJhY2tzcGFjZWQpKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoc3RhcnRXaXRoTW9udGhJbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IE51bWJlcihpbnB1dFZhbHVlU2xpY2VNaW51c09uZVBsdXNPbmUpID4gZGF5c0NvdW50IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCF0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoaW5wdXRWYWx1ZUN1cnNvclBsdXNUd28pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoaW5wdXRWYWx1ZUN1cnNvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBOdW1iZXIoaW5wdXRWYWx1ZVNsaWNlQ3Vyc29yUGx1c1R3bykgPiBkYXlzQ291bnQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhpbnB1dFZhbHVlQ3Vyc29yUGx1c09uZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIWJhY2tzcGFjZWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSAhdGhpcy5sZWFkWmVyb0RhdGVUaW1lID8gcG9zaXRpb24gKyAxIDogcG9zaXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uLCBjdXJzb3IsIGlucHV0QXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGVhZFplcm9EYXRlVGltZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJzAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gTWFza0V4cHJlc3Npb24uTU9OVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vbnRoc0NvdW50ID0gMTI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYXNrIHdpdGhvdXQgZGF5XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3aXRob3V0RGF5czogYm9vbGVhbiA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yID09PSAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKE51bWJlcihpbnB1dFN5bWJvbCkgPiAyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihpbnB1dFZhbHVlU2xpY2VDdXJzb3JQbHVzVHdvKSA+IG1vbnRoc0NvdW50IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3JQbHVzT25lKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIWJhY2tzcGFjZWQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRheTwxMCAmJiBtb250aDwxMiBmb3IgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwZWNpYWxDaGFydCA9IG1hc2tFeHByZXNzaW9uLnNsaWNlKGN1cnNvciArIDIsIGN1cnNvciArIDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF5MW1vbnRoSW5wdXQ6IGJvb2xlYW4gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVTbGljZU1pbnVzVGhyZWVNaW51c09uZS5pbmNsdWRlcyhzcGVjaWFsQ2hhcnQpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb24uaW5jbHVkZXMoJ2QwJykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoaW5wdXRWYWx1ZUN1cnNvck1pbnVzVHdvKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZVNsaWNlTWludXNPbmVQbHVzT25lKSA+IG1vbnRoc0NvdW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICF0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3IpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3IpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3JNaW51c1RocmVlKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKGlucHV0VmFsdWVTbGljZU1pbnVzVHdvQ3Vyc29yKSA+IG1vbnRoc0NvdW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhpbnB1dFZhbHVlQ3Vyc29yTWludXNPbmUpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3JNaW51c09uZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gIG1vbnRoPDEyICYmIGRheTwxMCBmb3IgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRheTJtb250aElucHV0OiBib29sZWFuID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZVNsaWNlTWludXNUaHJlZU1pbnVzT25lKSA8PSBkYXlzQ291bnQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVNsaWNlTWludXNUaHJlZU1pbnVzT25lIGFzIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVDdXJzb3JNaW51c09uZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoTnVtYmVyKGlucHV0VmFsdWVTbGljZUN1cnNvclBsdXNUd28pID4gbW9udGhzQ291bnQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoaW5wdXRWYWx1ZUN1cnNvclBsdXNPbmUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhYmFja3NwYWNlZCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3Vyc29yID09PSA1ICYmIHdpdGhvdXQgZGF5c1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF5Mm1vbnRoSW5wdXREb3Q6IGJvb2xlYW4gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChOdW1iZXIoaW5wdXRWYWx1ZVNsaWNlQ3Vyc29yUGx1c1R3bykgPiBtb250aHNDb3VudCAmJiBjdXJzb3IgPT09IDUpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuaW5jbHVkZXMoaW5wdXRWYWx1ZUN1cnNvclBsdXNPbmUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvciA9PT0gNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAvLyBkYXk8MTAgJiYgbW9udGg8MTIgZm9yIHBhc3RlIHdob2xlIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRheTFtb250aFBhc3RlOiBib29sZWFuID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZVNsaWNlTWludXNUaHJlZU1pbnVzT25lKSA+IGRheXNDb3VudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICF0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlU2xpY2VNaW51c1RocmVlTWludXNPbmUgYXMgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICF0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFZhbHVlU2xpY2VNaW51c1R3b0N1cnNvciBhcyBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKGlucHV0VmFsdWVTbGljZU1pbnVzVHdvQ3Vyc29yKSA+IG1vbnRoc0NvdW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb24uaW5jbHVkZXMoJ2QwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAxMDxkYXk8MzEgJiYgbW9udGg8MTIgZm9yIHBhc3RlIHdob2xlIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRheTJtb250aFBhc3RlOiBib29sZWFuID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZVNsaWNlTWludXNUaHJlZU1pbnVzT25lKSA8PSBkYXlzQ291bnQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVNsaWNlTWludXNUaHJlZU1pbnVzT25lIGFzIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhpbnB1dFZhbHVlQ3Vyc29yTWludXNPbmUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKGlucHV0VmFsdWVTbGljZU1pbnVzT25lUGx1c09uZSkgPiBtb250aHNDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoTnVtYmVyKGlucHV0U3ltYm9sKSA+IDEgJiYgdGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGhvdXREYXlzIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5MW1vbnRoSW5wdXQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXkybW9udGhQYXN0ZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRheTFtb250aFBhc3RlIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5Mm1vbnRoSW5wdXQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZGF5Mm1vbnRoSW5wdXREb3QgJiYgIXRoaXMubGVhZFplcm9EYXRlVGltZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gIXRoaXMubGVhZFplcm9EYXRlVGltZSA/IHBvc2l0aW9uICsgMSA6IHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvciArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NoaWZ0U3RlcChtYXNrRXhwcmVzc2lvbiwgY3Vyc29yLCBpbnB1dEFycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxlYWRaZXJvRGF0ZVRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcwJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3IrKztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoaW5wdXRTeW1ib2wgPT09IE1hc2tFeHByZXNzaW9uLldISVRFX1NQQUNFICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSBNYXNrRXhwcmVzc2lvbi5XSElURV9TUEFDRSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKGlucHV0U3ltYm9sID09PSBNYXNrRXhwcmVzc2lvbi5TTEFTSCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gTWFza0V4cHJlc3Npb24uU0xBU0gpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmRleE9mKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yXSA/PyBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkdcbiAgICAgICAgICAgICAgICAgICAgKSAhPT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IG1hc2tFeHByZXNzaW9uW2N1cnNvcl07XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvcisrO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zaGlmdFN0ZXAobWFza0V4cHJlc3Npb24sIGN1cnNvciwgaW5wdXRBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gTWFza0V4cHJlc3Npb24uTlVNQkVSX05JTkUgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TWFza1R5cGVkXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NoaWZ0U3RlcChtYXNrRXhwcmVzc2lvbiwgY3Vyc29yLCBpbnB1dEFycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltjdXJzb3JdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR10gJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltjdXJzb3JdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR10/Lm9wdGlvbmFsXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICEhaW5wdXRBcnJheVtjdXJzb3JdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrRXhwcmVzc2lvbiAhPT0gJzA5OS4wOTkuMDk5LjA5OScgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uICE9PSAnMDAwLjAwMC4wMDAtMDAnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrRXhwcmVzc2lvbiAhPT0gJzAwLjAwMC4wMDAvMDAwMC0wMCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFtYXNrRXhwcmVzc2lvbi5tYXRjaCgvXjkrXFwuMCskLykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICF0aGlzLnBhdHRlcm5zW21hc2tFeHByZXNzaW9uW2N1cnNvcl0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8ub3B0aW9uYWxcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gaW5wdXRBcnJheVtjdXJzb3JdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hc2tFeHByZXNzaW9uLk5VTUJFUl9OSU5FICsgTWFza0V4cHJlc3Npb24uU1lNQk9MX1NUQVJcbiAgICAgICAgICAgICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tFeHByZXNzaW9uLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hc2tFeHByZXNzaW9uLk5VTUJFUl9aRVJPICsgTWFza0V4cHJlc3Npb24uU1lNQk9MX1NUQVJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdXJzb3IrKztcbiAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb25bY3Vyc29yICsgMV0gPT09IE1hc2tFeHByZXNzaW9uLlNZTUJPTF9TVEFSICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpbmRTcGVjaWFsQ2hhcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb25bY3Vyc29yICsgMl0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKSA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSAmJlxuICAgICAgICAgICAgICAgICAgICBtdWx0aVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3IgKz0gMztcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFza0V4cHJlc3Npb25bY3Vyc29yICsgMV0gPT09IE1hc2tFeHByZXNzaW9uLlNZTUJPTF9RVUVTVElPTiAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9maW5kU3BlY2lhbENoYXIoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDJdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpbmRTcGVjaWFsQ2hhcihpbnB1dFN5bWJvbCkgPT09IHRoaXMubWFza0V4cHJlc3Npb25bY3Vyc29yICsgMl0gJiZcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yICs9IDM7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNYXNrVHlwZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmRleE9mKGlucHV0U3ltYm9sKSA8IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRTeW1ib2wgIT09IHRoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlci5sZW5ndGggPT09IDFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RlcEJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICByZXN1bHQubGVuZ3RoICsgMSA9PT0gbWFza0V4cHJlc3Npb24ubGVuZ3RoICYmXG4gICAgICAgICAgICB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgbWFza0V4cHJlc3Npb25bbWFza0V4cHJlc3Npb24ubGVuZ3RoIC0gMV0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICApICE9PSAtMVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBtYXNrRXhwcmVzc2lvblttYXNrRXhwcmVzc2lvbi5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbmV3UG9zaXRpb246IG51bWJlciA9IHBvc2l0aW9uICsgMTtcblxuICAgICAgICB3aGlsZSAodGhpcy5fc2hpZnQuaGFzKG5ld1Bvc2l0aW9uKSkge1xuICAgICAgICAgICAgc2hpZnQrKztcbiAgICAgICAgICAgIG5ld1Bvc2l0aW9uKys7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYWN0dWFsU2hpZnQ6IG51bWJlciA9XG4gICAgICAgICAgICBqdXN0UGFzdGVkICYmICFtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKE1hc2tFeHByZXNzaW9uLlNFUEFSQVRPUilcbiAgICAgICAgICAgICAgICA/IGN1cnNvclxuICAgICAgICAgICAgICAgIDogdGhpcy5fc2hpZnQuaGFzKHBvc2l0aW9uKVxuICAgICAgICAgICAgICAgICAgPyBzaGlmdFxuICAgICAgICAgICAgICAgICAgOiAwO1xuICAgICAgICBpZiAoc3RlcEJhY2spIHtcbiAgICAgICAgICAgIGFjdHVhbFNoaWZ0LS07XG4gICAgICAgIH1cblxuICAgICAgICBjYihhY3R1YWxTaGlmdCwgYmFja3NwYWNlU2hpZnQpO1xuICAgICAgICBpZiAoc2hpZnQgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLl9zaGlmdC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBvbmx5U3BlY2lhbCA9IGZhbHNlO1xuICAgICAgICBpZiAoYmFja3NwYWNlZCkge1xuICAgICAgICAgICAgb25seVNwZWNpYWwgPSBpbnB1dEFycmF5LmV2ZXJ5KChjaGFyKSA9PiB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGNoYXIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXMgPSBgJHt0aGlzLnByZWZpeH0ke29ubHlTcGVjaWFsID8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HIDogcmVzdWx0fSR7XG4gICAgICAgICAgICB0aGlzLnNob3dNYXNrVHlwZWQgPyAnJyA6IHRoaXMuc3VmZml4XG4gICAgICAgIH1gO1xuXG4gICAgICAgIGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXMgPSAhdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMgPyBgJHt0aGlzLnByZWZpeH0ke3Jlc3VsdH1gIDogYCR7cmVzdWx0fWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdC5pbmNsdWRlcyhNYXNrRXhwcmVzc2lvbi5NSU5VUykgJiYgdGhpcy5wcmVmaXggJiYgdGhpcy5hbGxvd05lZ2F0aXZlTnVtYmVycykge1xuICAgICAgICAgICAgaWYgKGJhY2tzcGFjZWQgJiYgcmVzdWx0ID09PSBNYXNrRXhwcmVzc2lvbi5NSU5VUykge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcyA9IGAke01hc2tFeHByZXNzaW9uLk1JTlVTfSR7dGhpcy5wcmVmaXh9JHtyZXN1bHRcbiAgICAgICAgICAgICAgICAuc3BsaXQoTWFza0V4cHJlc3Npb24uTUlOVVMpXG4gICAgICAgICAgICAgICAgLmpvaW4oTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKX0ke3RoaXMuc3VmZml4fWA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgX2ZpbmREcm9wU3BlY2lhbENoYXIoaW5wdXRTeW1ib2w6IHN0cmluZyk6IHVuZGVmaW5lZCB8IHN0cmluZyB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzLmZpbmQoKHZhbDogc3RyaW5nKSA9PiB2YWwgPT09IGlucHV0U3ltYm9sKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgX2ZpbmRTcGVjaWFsQ2hhcihpbnB1dFN5bWJvbDogc3RyaW5nKTogdW5kZWZpbmVkIHwgc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BlY2lhbENoYXJhY3RlcnMuZmluZCgodmFsOiBzdHJpbmcpID0+IHZhbCA9PT0gaW5wdXRTeW1ib2wpO1xuICAgIH1cblxuICAgIHB1YmxpYyBfY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sOiBzdHJpbmcsIG1hc2tTeW1ib2w6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICB0aGlzLnBhdHRlcm5zID0gdGhpcy5jdXN0b21QYXR0ZXJuID8gdGhpcy5jdXN0b21QYXR0ZXJuIDogdGhpcy5wYXR0ZXJucztcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICh0aGlzLnBhdHRlcm5zW21hc2tTeW1ib2xdPy5wYXR0ZXJuICYmXG4gICAgICAgICAgICAgICAgdGhpcy5wYXR0ZXJuc1ttYXNrU3ltYm9sXT8ucGF0dGVybi50ZXN0KGlucHV0U3ltYm9sKSkgPz9cbiAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZm9ybWF0V2l0aFNlcGFyYXRvcnMgPSAoXG4gICAgICAgIHN0cjogc3RyaW5nLFxuICAgICAgICB0aG91c2FuZFNlcGFyYXRvckNoYXI6IHN0cmluZyxcbiAgICAgICAgZGVjaW1hbENoYXJzOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICAgICAgcHJlY2lzaW9uOiBudW1iZXJcbiAgICApID0+IHtcbiAgICAgICAgbGV0IHg6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBkZWNpbWFsQ2hhciA9ICcnO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZWNpbWFsQ2hhcnMpKSB7XG4gICAgICAgICAgICBjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgICAgIGRlY2ltYWxDaGFycy5tYXAoKHYpID0+ICgnW1xcXFxeJC58PyorKCknLmluZGV4T2YodikgPj0gMCA/IGBcXFxcJHt2fWAgOiB2KSkuam9pbignfCcpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgeCA9IHN0ci5zcGxpdChyZWdFeHApO1xuICAgICAgICAgICAgZGVjaW1hbENoYXIgPSBzdHIubWF0Y2gocmVnRXhwKT8uWzBdID8/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHggPSBzdHIuc3BsaXQoZGVjaW1hbENoYXJzKTtcbiAgICAgICAgICAgIGRlY2ltYWxDaGFyID0gZGVjaW1hbENoYXJzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlY2ltYWxzOiBzdHJpbmcgPVxuICAgICAgICAgICAgeC5sZW5ndGggPiAxID8gYCR7ZGVjaW1hbENoYXJ9JHt4WzFdfWAgOiBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkc7XG4gICAgICAgIGxldCByZXM6IHN0cmluZyA9IHhbMF0gPz8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICBjb25zdCBzZXBhcmF0b3JMaW1pdDogc3RyaW5nID0gdGhpcy5zZXBhcmF0b3JMaW1pdC5yZXBsYWNlKFxuICAgICAgICAgICAgL1xccy9nLFxuICAgICAgICAgICAgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICk7XG4gICAgICAgIGlmIChzZXBhcmF0b3JMaW1pdCAmJiArc2VwYXJhdG9yTGltaXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNbMF0gPT09IE1hc2tFeHByZXNzaW9uLk1JTlVTKSB7XG4gICAgICAgICAgICAgICAgcmVzID0gYC0ke3Jlcy5zbGljZSgxLCByZXMubGVuZ3RoKS5zbGljZSgwLCBzZXBhcmF0b3JMaW1pdC5sZW5ndGgpfWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5zbGljZSgwLCBzZXBhcmF0b3JMaW1pdC5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJneCA9IC8oXFxkKykoXFxkezN9KS87XG5cbiAgICAgICAgd2hpbGUgKHRob3VzYW5kU2VwYXJhdG9yQ2hhciAmJiByZ3gudGVzdChyZXMpKSB7XG4gICAgICAgICAgICByZXMgPSByZXMucmVwbGFjZShyZ3gsICckMScgKyB0aG91c2FuZFNlcGFyYXRvckNoYXIgKyAnJDInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmVjaXNpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcyArIGRlY2ltYWxzO1xuICAgICAgICB9IGVsc2UgaWYgKHByZWNpc2lvbiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzICsgZGVjaW1hbHMuc3Vic3RyaW5nKDAsIHByZWNpc2lvbiArIDEpO1xuICAgIH07XG5cbiAgICBwcml2YXRlIHBlcmNlbnRhZ2UgPSAoc3RyOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICAgICAgY29uc3Qgc2FuaXRpemVkU3RyID0gc3RyLnJlcGxhY2UoJywnLCAnLicpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihcbiAgICAgICAgICAgIHRoaXMuYWxsb3dOZWdhdGl2ZU51bWJlcnMgJiYgc3RyLmluY2x1ZGVzKE1hc2tFeHByZXNzaW9uLk1JTlVTKVxuICAgICAgICAgICAgICAgID8gc2FuaXRpemVkU3RyLnNsaWNlKDEsIHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgOiBzYW5pdGl6ZWRTdHJcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gIWlzTmFOKHZhbHVlKSAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IDEwMDtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBnZXRQcmVjaXNpb24gPSAobWFza0V4cHJlc3Npb246IHN0cmluZyk6IG51bWJlciA9PiB7XG4gICAgICAgIGNvbnN0IHg6IHN0cmluZ1tdID0gbWFza0V4cHJlc3Npb24uc3BsaXQoTWFza0V4cHJlc3Npb24uRE9UKTtcbiAgICAgICAgaWYgKHgubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlcih4W3gubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEluZmluaXR5O1xuICAgIH07XG5cbiAgICBwcml2YXRlIGNoZWNrQW5kUmVtb3ZlU3VmZml4ID0gKGlucHV0VmFsdWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLnN1ZmZpeD8ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YnN0ciA9IHRoaXMuc3VmZml4LnN1YnN0cmluZyhpLCB0aGlzLnN1ZmZpeD8ubGVuZ3RoKTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlLmluY2x1ZGVzKHN1YnN0cikgJiZcbiAgICAgICAgICAgICAgICBpICE9PSB0aGlzLnN1ZmZpeD8ubGVuZ3RoIC0gMSAmJlxuICAgICAgICAgICAgICAgIChpIC0gMSA8IDAgfHxcbiAgICAgICAgICAgICAgICAgICAgIWlucHV0VmFsdWUuaW5jbHVkZXModGhpcy5zdWZmaXguc3Vic3RyaW5nKGkgLSAxLCB0aGlzLnN1ZmZpeD8ubGVuZ3RoKSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZS5yZXBsYWNlKHN1YnN0ciwgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBjaGVja0lucHV0UHJlY2lzaW9uID0gKFxuICAgICAgICBpbnB1dFZhbHVlOiBzdHJpbmcsXG4gICAgICAgIHByZWNpc2lvbjogbnVtYmVyLFxuICAgICAgICBkZWNpbWFsTWFya2VyOiBJQ29uZmlnWydkZWNpbWFsTWFya2VyJ11cbiAgICApOiBzdHJpbmcgPT4ge1xuICAgICAgICBpZiAocHJlY2lzaW9uIDwgSW5maW5pdHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gbmVlZCB0aGluayBhYm91dCBkZWNpbWFsTWFya2VyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZWNpbWFsTWFya2VyKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IGRlY2ltYWxNYXJrZXIuZmluZCgoZG0pID0+IGRtICE9PSB0aGlzLnRob3VzYW5kU2VwYXJhdG9yKTtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBkZWNpbWFsTWFya2VyID0gbWFya2VyID8gbWFya2VyIDogZGVjaW1hbE1hcmtlclswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByZWNpc2lvblJlZ0V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgICAgICB0aGlzLl9jaGFyVG9SZWdFeHBFeHByZXNzaW9uKGRlY2ltYWxNYXJrZXIpICsgYFxcXFxkeyR7cHJlY2lzaW9ufX0uKiRgXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgcHJlY2lzaW9uTWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsID0gaW5wdXRWYWx1ZS5tYXRjaChwcmVjaXNpb25SZWdFeCk7XG4gICAgICAgICAgICBjb25zdCBwcmVjaXNpb25NYXRjaExlbmd0aDogbnVtYmVyID0gKHByZWNpc2lvbk1hdGNoICYmIHByZWNpc2lvbk1hdGNoWzBdPy5sZW5ndGgpID8/IDA7XG4gICAgICAgICAgICBpZiAocHJlY2lzaW9uTWF0Y2hMZW5ndGggLSAxID4gcHJlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlmZiA9IHByZWNpc2lvbk1hdGNoTGVuZ3RoIC0gMSAtIHByZWNpc2lvbjtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5sZW5ndGggLSBkaWZmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBwcmVjaXNpb24gPT09IDAgJiZcbiAgICAgICAgICAgICAgICB0aGlzLl9jb21wYXJlT3JJbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVtpbnB1dFZhbHVlLmxlbmd0aCAtIDFdLFxuICAgICAgICAgICAgICAgICAgICBkZWNpbWFsTWFya2VyLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRob3VzYW5kU2VwYXJhdG9yXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUuc3Vic3RyaW5nKDAsIGlucHV0VmFsdWUubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0VmFsdWU7XG4gICAgfTtcblxuICAgIHByaXZhdGUgX3N0cmlwVG9EZWNpbWFsKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHN0clxuICAgICAgICAgICAgLnNwbGl0KE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklORylcbiAgICAgICAgICAgIC5maWx0ZXIoKGk6IHN0cmluZywgaWR4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0RlY2ltYWxNYXJrZXIgPVxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGhpcy5kZWNpbWFsTWFya2VyID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBpID09PSB0aGlzLmRlY2ltYWxNYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogLy8gVE9ETyAoaW5lcGlwZW5rbykgdXNlIHV0aWxpdHkgdHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2ltYWxNYXJrZXIuaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpIGFzIE1hc2tFeHByZXNzaW9uLkNPTU1BIHwgTWFza0V4cHJlc3Npb24uRE9UXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgaS5tYXRjaCgnXi0/XFxcXGQnKSB8fFxuICAgICAgICAgICAgICAgICAgICBpID09PSB0aGlzLnRob3VzYW5kU2VwYXJhdG9yIHx8XG4gICAgICAgICAgICAgICAgICAgIGlzRGVjaW1hbE1hcmtlciB8fFxuICAgICAgICAgICAgICAgICAgICAoaSA9PT0gTWFza0V4cHJlc3Npb24uTUlOVVMgJiYgaWR4ID09PSAwICYmIHRoaXMuYWxsb3dOZWdhdGl2ZU51bWJlcnMpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbihNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NoYXJUb1JlZ0V4cEV4cHJlc3Npb24oY2hhcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgLy8gaWYgKEFycmF5LmlzQXJyYXkoY2hhcikpIHtcbiAgICAgICAgLy8gXHRyZXR1cm4gY2hhci5tYXAoKHYpID0+ICgnW1xcXFxeJC58PyorKCknLmluZGV4T2YodikgPj0gMCA/IGBcXFxcJHt2fWAgOiB2KSkuam9pbignfCcpO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmIChjaGFyKSB7XG4gICAgICAgICAgICBjb25zdCBjaGFyc1RvRXNjYXBlID0gJ1tcXFxcXiQufD8qKygpJztcbiAgICAgICAgICAgIHJldHVybiBjaGFyID09PSAnICcgPyAnXFxcXHMnIDogY2hhcnNUb0VzY2FwZS5pbmRleE9mKGNoYXIpID49IDAgPyBgXFxcXCR7Y2hhcn1gIDogY2hhcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhcjtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zaGlmdFN0ZXAobWFza0V4cHJlc3Npb246IHN0cmluZywgY3Vyc29yOiBudW1iZXIsIGlucHV0TGVuZ3RoOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3Qgc2hpZnRTdGVwOiBudW1iZXIgPSAvWyo/XS9nLnRlc3QobWFza0V4cHJlc3Npb24uc2xpY2UoMCwgY3Vyc29yKSlcbiAgICAgICAgICAgID8gaW5wdXRMZW5ndGhcbiAgICAgICAgICAgIDogY3Vyc29yO1xuICAgICAgICB0aGlzLl9zaGlmdC5hZGQoc2hpZnRTdGVwICsgdGhpcy5wcmVmaXgubGVuZ3RoIHx8IDApO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBfY29tcGFyZU9ySW5jbHVkZXM8VD4odmFsdWU6IFQsIGNvbXBhcmVkVmFsdWU6IFQgfCBUW10sIGV4Y2x1ZGVkVmFsdWU6IFQpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoY29tcGFyZWRWYWx1ZSlcbiAgICAgICAgICAgID8gY29tcGFyZWRWYWx1ZS5maWx0ZXIoKHYpID0+IHYgIT09IGV4Y2x1ZGVkVmFsdWUpLmluY2x1ZGVzKHZhbHVlKVxuICAgICAgICAgICAgOiB2YWx1ZSA9PT0gY29tcGFyZWRWYWx1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF92YWxpZElQKHZhbHVlc0lQOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gIShcbiAgICAgICAgICAgIHZhbHVlc0lQLmxlbmd0aCA9PT0gNCAmJlxuICAgICAgICAgICAgIXZhbHVlc0lQLnNvbWUoKHZhbHVlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVzSVAubGVuZ3RoICE9PSBpbmRleCArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlID09PSBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcgfHwgTnVtYmVyKHZhbHVlKSA+IDI1NTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlID09PSBNYXNrRXhwcmVzc2lvbi5FTVBUWV9TVFJJTkcgfHwgTnVtYmVyKHZhbHVlLnN1YnN0cmluZygwLCAzKSkgPiAyNTU7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NwbGl0UGVyY2VudFplcm8odmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gTWFza0V4cHJlc3Npb24uTUlOVVMgJiYgdGhpcy5hbGxvd05lZ2F0aXZlTnVtYmVycykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlY2ltYWxJbmRleCA9XG4gICAgICAgICAgICB0eXBlb2YgdGhpcy5kZWNpbWFsTWFya2VyID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgID8gdmFsdWUuaW5kZXhPZih0aGlzLmRlY2ltYWxNYXJrZXIpXG4gICAgICAgICAgICAgICAgOiB2YWx1ZS5pbmRleE9mKE1hc2tFeHByZXNzaW9uLkRPVCk7XG4gICAgICAgIGNvbnN0IGVtcHR5T3JNaW51cyA9XG4gICAgICAgICAgICB0aGlzLmFsbG93TmVnYXRpdmVOdW1iZXJzICYmIHZhbHVlLmluY2x1ZGVzKE1hc2tFeHByZXNzaW9uLk1JTlVTKSA/ICctJyA6ICcnO1xuICAgICAgICBpZiAoZGVjaW1hbEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkVmFsdWUgPSBwYXJzZUludChlbXB0eU9yTWludXMgPyB2YWx1ZS5zbGljZSgxLCB2YWx1ZS5sZW5ndGgpIDogdmFsdWUsIDEwKTtcbiAgICAgICAgICAgIHJldHVybiBpc05hTihwYXJzZWRWYWx1ZSlcbiAgICAgICAgICAgICAgICA/IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICAgIDogYCR7ZW1wdHlPck1pbnVzfSR7cGFyc2VkVmFsdWV9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGludGVnZXJQYXJ0ID0gcGFyc2VJbnQodmFsdWUucmVwbGFjZSgnLScsICcnKS5zdWJzdHJpbmcoMCwgZGVjaW1hbEluZGV4KSwgMTApO1xuICAgICAgICAgICAgY29uc3QgZGVjaW1hbFBhcnQgPSB2YWx1ZS5zdWJzdHJpbmcoZGVjaW1hbEluZGV4ICsgMSk7XG4gICAgICAgICAgICBjb25zdCBpbnRlZ2VyU3RyaW5nID0gaXNOYU4oaW50ZWdlclBhcnQpID8gJycgOiBpbnRlZ2VyUGFydC50b1N0cmluZygpO1xuXG4gICAgICAgICAgICBjb25zdCBkZWNpbWFsID1cbiAgICAgICAgICAgICAgICB0eXBlb2YgdGhpcy5kZWNpbWFsTWFya2VyID09PSAnc3RyaW5nJyA/IHRoaXMuZGVjaW1hbE1hcmtlciA6IE1hc2tFeHByZXNzaW9uLkRPVDtcblxuICAgICAgICAgICAgcmV0dXJuIGludGVnZXJTdHJpbmcgPT09IE1hc2tFeHByZXNzaW9uLkVNUFRZX1NUUklOR1xuICAgICAgICAgICAgICAgID8gTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HXG4gICAgICAgICAgICAgICAgOiBgJHtlbXB0eU9yTWludXN9JHtpbnRlZ2VyU3RyaW5nfSR7ZGVjaW1hbH0ke2RlY2ltYWxQYXJ0fWA7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=
import { inject, Pipe } from '@angular/core';
import { NGX_MASK_CONFIG } from './ngx-mask.config';
import { NgxMaskService } from './ngx-mask.service';
import * as i0 from "@angular/core";
export class NgxMaskPipe {
    constructor() {
        this.defaultOptions = inject(NGX_MASK_CONFIG);
        this._maskService = inject(NgxMaskService);
        this._maskExpressionArray = [];
        this.mask = '';
    }
    transform(value, mask, { patterns, ...config } = {}) {
        const currentConfig = {
            maskExpression: mask,
            ...this.defaultOptions,
            ...config,
            patterns: {
                ...this._maskService.patterns,
                ...patterns,
            },
        };
        Object.entries(currentConfig).forEach(([key, value]) => {
            //eslint-disable-next-line  @typescript-eslint/no-explicit-any
            this._maskService[key] = value;
        });
        if (mask.includes('||')) {
            if (mask.split('||').length > 1) {
                this._maskExpressionArray = mask.split('||').sort((a, b) => {
                    return a.length - b.length;
                });
                this._setMask(value);
                return this._maskService.applyMask(`${value}`, this.mask);
            }
            else {
                this._maskExpressionArray = [];
                return this._maskService.applyMask(`${value}`, this.mask);
            }
        }
        if (mask.includes("{" /* MaskExpression.CURLY_BRACKETS_LEFT */)) {
            return this._maskService.applyMask(`${value}`, this._maskService._repeatPatternSymbols(mask));
        }
        if (mask.startsWith("separator" /* MaskExpression.SEPARATOR */)) {
            if (config.decimalMarker) {
                this._maskService.decimalMarker = config.decimalMarker;
            }
            if (config.thousandSeparator) {
                this._maskService.thousandSeparator = config.thousandSeparator;
            }
            if (config.leadZero) {
                // eslint-disable-next-line no-param-reassign
                this._maskService.leadZero = config.leadZero;
            }
            // eslint-disable-next-line no-param-reassign
            value = String(value);
            const localeDecimalMarker = this._maskService.currentLocaleDecimalMarker();
            if (!Array.isArray(this._maskService.decimalMarker)) {
                // eslint-disable-next-line no-param-reassign
                value =
                    this._maskService.decimalMarker !== localeDecimalMarker
                        ? value.replace(localeDecimalMarker, this._maskService.decimalMarker)
                        : value;
            }
            if (this._maskService.leadZero &&
                value &&
                this._maskService.dropSpecialCharacters !== false) {
                // eslint-disable-next-line no-param-reassign
                value = this._maskService._checkPrecision(mask, value);
            }
            if (this._maskService.decimalMarker === "," /* MaskExpression.COMMA */) {
                // eslint-disable-next-line no-param-reassign
                value = value.toString().replace("." /* MaskExpression.DOT */, "," /* MaskExpression.COMMA */);
            }
            this._maskService.isNumberValue = true;
        }
        if (value === null || value === undefined) {
            return this._maskService.applyMask('', mask);
        }
        return this._maskService.applyMask(`${value}`, mask);
    }
    _setMask(value) {
        if (this._maskExpressionArray.length > 0) {
            this._maskExpressionArray.some((mask) => {
                const test = this._maskService.removeMask(value)?.length <=
                    this._maskService.removeMask(mask)?.length;
                if (value && test) {
                    this.mask = mask;
                    return test;
                }
                else {
                    const expression = this._maskExpressionArray[this._maskExpressionArray.length - 1] ??
                        "" /* MaskExpression.EMPTY_STRING */;
                    this.mask = expression;
                }
            });
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskPipe, deps: [], target: i0.ɵɵFactoryTarget.Pipe }); }
    static { this.ɵpipe = i0.ɵɵngDeclarePipe({ minVersion: "14.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskPipe, isStandalone: true, name: "mask" }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.4", ngImport: i0, type: NgxMaskPipe, decorators: [{
            type: Pipe,
            args: [{
                    name: 'mask',
                    pure: true,
                    standalone: true,
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LW1hc2sucGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1tYXNrLWxpYi9zcmMvbGliL25neC1tYXNrLnBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQWlCLE1BQU0sZUFBZSxDQUFDO0FBRTVELE9BQU8sRUFBVyxlQUFlLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7O0FBUXBELE1BQU0sT0FBTyxXQUFXO0lBTHhCO1FBTXFCLG1CQUFjLEdBQUcsTUFBTSxDQUFVLGVBQWUsQ0FBQyxDQUFDO1FBRWxELGlCQUFZLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRS9DLHlCQUFvQixHQUFhLEVBQUUsQ0FBQztRQUVwQyxTQUFJLEdBQUcsRUFBRSxDQUFDO0tBaUdyQjtJQS9GVSxTQUFTLENBQ1osS0FBc0IsRUFDdEIsSUFBWSxFQUNaLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxLQUF1QixFQUFzQjtRQUVsRSxNQUFNLGFBQWEsR0FBRztZQUNsQixjQUFjLEVBQUUsSUFBSTtZQUNwQixHQUFHLElBQUksQ0FBQyxjQUFjO1lBQ3RCLEdBQUcsTUFBTTtZQUNULFFBQVEsRUFBRTtnQkFDTixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUTtnQkFDN0IsR0FBRyxRQUFRO2FBQ2Q7U0FDSixDQUFDO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQ25ELDhEQUE4RDtZQUM3RCxJQUFJLENBQUMsWUFBb0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLElBQUksQ0FBQyxR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LFdBQVc7a0JBTHZCLElBQUk7bUJBQUM7b0JBQ0YsSUFBSSxFQUFFLE1BQU07b0JBQ1osSUFBSSxFQUFFLElBQUk7b0JBQ1YsVUFBVSxFQUFFLElBQUk7aUJBQ25CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaW5qZWN0LCBQaXBlLCBQaXBlVHJhbnNmb3JtIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IElDb25maWcsIE5HWF9NQVNLX0NPTkZJRyB9IGZyb20gJy4vbmd4LW1hc2suY29uZmlnJztcbmltcG9ydCB7IE5neE1hc2tTZXJ2aWNlIH0gZnJvbSAnLi9uZ3gtbWFzay5zZXJ2aWNlJztcbmltcG9ydCB7IE1hc2tFeHByZXNzaW9uIH0gZnJvbSAnLi9uZ3gtbWFzay1leHByZXNzaW9uLmVudW0nO1xuXG5AUGlwZSh7XG4gICAgbmFtZTogJ21hc2snLFxuICAgIHB1cmU6IHRydWUsXG4gICAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTmd4TWFza1BpcGUgaW1wbGVtZW50cyBQaXBlVHJhbnNmb3JtIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRPcHRpb25zID0gaW5qZWN0PElDb25maWc+KE5HWF9NQVNLX0NPTkZJRyk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tYXNrU2VydmljZSA9IGluamVjdChOZ3hNYXNrU2VydmljZSk7XG5cbiAgICBwcml2YXRlIF9tYXNrRXhwcmVzc2lvbkFycmF5OiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgcHJpdmF0ZSBtYXNrID0gJyc7XG5cbiAgICBwdWJsaWMgdHJhbnNmb3JtKFxuICAgICAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyLFxuICAgICAgICBtYXNrOiBzdHJpbmcsXG4gICAgICAgIHsgcGF0dGVybnMsIC4uLmNvbmZpZyB9OiBQYXJ0aWFsPElDb25maWc+ID0ge30gYXMgUGFydGlhbDxJQ29uZmlnPlxuICAgICk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRDb25maWcgPSB7XG4gICAgICAgICAgICBtYXNrRXhwcmVzc2lvbjogbWFzayxcbiAgICAgICAgICAgIC4uLnRoaXMuZGVmYXVsdE9wdGlvbnMsXG4gICAgICAgICAgICAuLi5jb25maWcsXG4gICAgICAgICAgICBwYXR0ZXJuczoge1xuICAgICAgICAgICAgICAgIC4uLnRoaXMuX21hc2tTZXJ2aWNlLnBhdHRlcm5zLFxuICAgICAgICAgICAgICAgIC4uLnBhdHRlcm5zLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoY3VycmVudENvbmZpZykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICAvL2VzbGludC1kaXNhYmxlLW5leHQtbGluZSAgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgICAgICAgKHRoaXMuX21hc2tTZXJ2aWNlIGFzIGFueSlba2V5XSA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG1hc2suaW5jbHVkZXMoJ3x8JykpIHtcbiAgICAgICAgICAgIGlmIChtYXNrLnNwbGl0KCd8fCcpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5ID0gbWFzay5zcGxpdCgnfHwnKS5zb3J0KChhOiBzdHJpbmcsIGI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRNYXNrKHZhbHVlIGFzIHN0cmluZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayhgJHt2YWx1ZX1gLCB0aGlzLm1hc2spO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5ID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayhgJHt2YWx1ZX1gLCB0aGlzLm1hc2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtYXNrLmluY2x1ZGVzKE1hc2tFeHByZXNzaW9uLkNVUkxZX0JSQUNLRVRTX0xFRlQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFza1NlcnZpY2UuYXBwbHlNYXNrKFxuICAgICAgICAgICAgICAgIGAke3ZhbHVlfWAsXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuX3JlcGVhdFBhdHRlcm5TeW1ib2xzKG1hc2spXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXNrLnN0YXJ0c1dpdGgoTWFza0V4cHJlc3Npb24uU0VQQVJBVE9SKSkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5kZWNpbWFsTWFya2VyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuZGVjaW1hbE1hcmtlciA9IGNvbmZpZy5kZWNpbWFsTWFya2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvbmZpZy50aG91c2FuZFNlcGFyYXRvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnRob3VzYW5kU2VwYXJhdG9yID0gY29uZmlnLnRob3VzYW5kU2VwYXJhdG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvbmZpZy5sZWFkWmVybykge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmxlYWRaZXJvID0gY29uZmlnLmxlYWRaZXJvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbGVEZWNpbWFsTWFya2VyID0gdGhpcy5fbWFza1NlcnZpY2UuY3VycmVudExvY2FsZURlY2ltYWxNYXJrZXIoKTtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLl9tYXNrU2VydmljZS5kZWNpbWFsTWFya2VyKSkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgICAgICAgIHZhbHVlID1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UuZGVjaW1hbE1hcmtlciAhPT0gbG9jYWxlRGVjaW1hbE1hcmtlclxuICAgICAgICAgICAgICAgICAgICAgICAgPyB2YWx1ZS5yZXBsYWNlKGxvY2FsZURlY2ltYWxNYXJrZXIsIHRoaXMuX21hc2tTZXJ2aWNlLmRlY2ltYWxNYXJrZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmxlYWRaZXJvICYmXG4gICAgICAgICAgICAgICAgdmFsdWUgJiZcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5kcm9wU3BlY2lhbENoYXJhY3RlcnMgIT09IGZhbHNlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXMuX21hc2tTZXJ2aWNlLl9jaGVja1ByZWNpc2lvbihtYXNrLCB2YWx1ZSBhcyBzdHJpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX21hc2tTZXJ2aWNlLmRlY2ltYWxNYXJrZXIgPT09IE1hc2tFeHByZXNzaW9uLkNPTU1BKSB7XG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpLnJlcGxhY2UoTWFza0V4cHJlc3Npb24uRE9ULCBNYXNrRXhwcmVzc2lvbi5DT01NQSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5pc051bWJlclZhbHVlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzaygnJywgbWFzayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayhgJHt2YWx1ZX1gLCBtYXNrKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zZXRNYXNrKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheS5zb21lKChtYXNrKTogYm9vbGVhbiB8IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRlc3QgPVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5yZW1vdmVNYXNrKHZhbHVlKT8ubGVuZ3RoIDw9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnJlbW92ZU1hc2sobWFzayk/Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdGVzdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hc2sgPSBtYXNrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVzdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9uID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXlbdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheS5sZW5ndGggLSAxXSA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgTWFza0V4cHJlc3Npb24uRU1QVFlfU1RSSU5HO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hc2sgPSBleHByZXNzaW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19
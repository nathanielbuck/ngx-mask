const commonjsGlobal = typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
            ? global
            : typeof self !== 'undefined'
                ? self
                : {};
(function () {
    if (!commonjsGlobal.KeyboardEvent) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        commonjsGlobal.KeyboardEvent = function (_eventType, _init) { };
    }
})();
export {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLWtleWJvYXJkLWV2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LW1hc2stbGliL3NyYy9saWIvY3VzdG9tLWtleWJvYXJkLWV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE1BQU0sY0FBYyxHQUNoQixPQUFPLFVBQVUsS0FBSyxXQUFXO0lBQzdCLENBQUMsQ0FBQyxVQUFVO0lBQ1osQ0FBQyxDQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVc7UUFDN0IsQ0FBQyxDQUFDLE1BQU07UUFDUixDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVztZQUM3QixDQUFDLENBQUMsTUFBTTtZQUNSLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxXQUFXO2dCQUMzQixDQUFDLENBQUMsSUFBSTtnQkFDTixDQUFDLENBQUMsRUFBRSxDQUFDO0FBRW5CLENBQUM7SUFDRyxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ2hDLGdFQUFnRTtRQUNoRSxjQUFjLENBQUMsYUFBYSxHQUFHLFVBQVUsVUFBZSxFQUFFLEtBQVUsSUFBRyxDQUFDLENBQUM7SUFDN0UsQ0FBQztBQUNMLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG5kZWNsYXJlIGxldCBnbG9iYWw6IGFueTtcblxuY29uc3QgY29tbW9uanNHbG9iYWwgPVxuICAgIHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICA/IGdsb2JhbFRoaXNcbiAgICAgICAgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgID8gd2luZG93XG4gICAgICAgICAgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyBnbG9iYWxcbiAgICAgICAgICAgIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgID8gc2VsZlxuICAgICAgICAgICAgICA6IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuICAgIGlmICghY29tbW9uanNHbG9iYWwuS2V5Ym9hcmRFdmVudCkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uXG4gICAgICAgIGNvbW1vbmpzR2xvYmFsLktleWJvYXJkRXZlbnQgPSBmdW5jdGlvbiAoX2V2ZW50VHlwZTogYW55LCBfaW5pdDogYW55KSB7fTtcbiAgICB9XG59KSgpO1xuXG5leHBvcnQgdHlwZSBDdXN0b21LZXlib2FyZEV2ZW50ID0gS2V5Ym9hcmRFdmVudDtcbiJdfQ==
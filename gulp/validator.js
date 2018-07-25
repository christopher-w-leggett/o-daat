'use strict'

module.exports = {
    valid: (value, options) => {
        let isValid = true;

        if (options) {
            isValid = false;

            if (!value && !options.required) {
                isValid = true;
            } else if (options.regex) {
                isValid = value && value.match && value.match(options.regex);
            }
        }

        return isValid;
    }
};
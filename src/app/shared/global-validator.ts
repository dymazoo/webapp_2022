import {FormControl, FormGroup} from '@angular/forms';

export class GlobalValidator {

    static mailFormat(control: FormControl): ValidationResult {

        let EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

        if (control.value.length > 0 && (control.value.length <= 5 || !EMAIL_REGEXP.test(control.value))) {
            return {"incorrectMailFormat": true};
        }

        return null;
    }

    static telephoneFormat(control: FormControl): ValidationResult {

        let TELEPHONE_REGEXP = /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,7})|(\(?\d{2,7}\)?))(-| )?(\d{2,7})(-| )?(\d{4})(( x| ext)\d{1,7}){0,1}$/;

        if (control.value.length > 0 && (control.value.length <= 4  || !TELEPHONE_REGEXP.test(control.value))) {
            return {"incorrectTelephoneFormat": true};
        }

        return null;
    }

    static equals(control1Key: string, control2Key: string, errorKey: string) {
        return (group: FormGroup): ValidationResult => {
            let control1 = group.controls[control1Key];
            let control2 = group.controls[control2Key];

            if (control1.value !== control2.value) {
                return {[errorKey]: true};
            }

            return null;
        };
    }

    static oneHasValue(control1Key: string, control2Key: string, errorKey: string) {
        return (group: FormGroup): ValidationResult => {
            let control1 = group.controls[control1Key];
            let control2 = group.controls[control2Key];

            if (control1.value === '' && control2.value === '') {
                return {[errorKey]: true};
            }

            return null;
        };
    }

}

interface ValidationResult {
    [key: string]: boolean;
}

export class Contact {
    public email: string = '';
    public password: string = '';
    public confirmPassword: string = '';
    public name: string = '';
    public telephone: string = '';
    public layout: string = '';
    public scheme: string = '';
    public theme: string = '';

    public constructor(init?: Partial<Contact>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Contact>): void {
        Object.assign(this, values);
    }
}

export class Person {
    public id: string = '';
    public firstName: string='';
    public lastName: string='';
    public emails: [];
    public mobiles: [];

    public constructor(init?: Partial<Person>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Person>): void {
        Object.assign(this, values);
    }
}

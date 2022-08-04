export class Preference {
    public id: string = '';
    public name: string='';
    public label: string='';
    public value: string='0';
    public sequence: number=0;
    public type: string='';

    public constructor(init?: Partial<Preference>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Preference>): void {
        Object.assign(this, values);
    }
}

export class List {
    public id: string = '';
    public name: string='';
    public description: string='';

    public constructor(init?: Partial<List>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<List>): void {
        Object.assign(this, values);
    }
}

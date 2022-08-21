export class Audit {
    public id: string = '';
    public name: string='';
    public description: string='';

    public constructor(init?: Partial<Audit>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Audit>): void {
        Object.assign(this, values);
    }
}

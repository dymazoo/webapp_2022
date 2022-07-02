export class Campaign {
    public id: string = '';
    public name: string='';
    public description: string='';

    public constructor(init?: Partial<Campaign>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Campaign>): void {
        Object.assign(this, values);
    }
}

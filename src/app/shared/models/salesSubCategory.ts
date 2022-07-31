export class SalesSubCategory {
    public id: string = '';
    public description: string='';
    public default: number=0;

    public constructor(init?: Partial<SalesSubCategory>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<SalesSubCategory>): void {
        Object.assign(this, values);
    }
}

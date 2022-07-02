export class Selection {
    public id: string = '';
    public name: string='';
    public description: string='';
    public layout_id: number = 0;
    public list_id: number = 0;
    public segment: string='';
    public limit: number = 0;


    public constructor(init?: Partial<Selection>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Selection>): void {
        Object.assign(this, values);
    }
}

export class Layout {
    public id: string = '';
    public name: string='';
    public description: string='';
    public header: number = 0;


    public constructor(init?: Partial<Layout>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Layout>): void {
        Object.assign(this, values);
    }
}

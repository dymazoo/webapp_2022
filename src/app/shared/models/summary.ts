export class Summary {
    public id: string = '';
    public message: string = '';
    public createdAt: string = '';
    public updatedAt: string = '';
    public icon: string = '';
    public read: string = '';

    public constructor(init?: Partial<Summary>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Summary>): void {
        Object.assign(this, values);
    }
}

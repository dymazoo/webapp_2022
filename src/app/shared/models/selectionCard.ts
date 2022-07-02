export class SelectionCard {
    public id: number = 0;
    public selectionCardId: string = '';
    public title: string='';
    public selections: any = [];
    public invert: number = 0;
    public count: number = 0;
    public lane: number = 1;
    public sequence: number = 1;
    public isActive: boolean = true;

    public constructor(init?: Partial<SelectionCard>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<SelectionCard>): void {
        Object.assign(this, values);
    }
}

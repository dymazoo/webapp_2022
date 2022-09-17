export class CustomField {
    public id: string = '';
    public name: string='';
    public description: string='';
    public type: string='';
    public action: string='';
    public dataType: string='';
    public sourceDescription: string='';
    public sourceId: string='';
    public fieldName: string='';
    public fieldId: string='';

    public constructor(init?: Partial<CustomField>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<CustomField>): void {
        Object.assign(this, values);
    }
}

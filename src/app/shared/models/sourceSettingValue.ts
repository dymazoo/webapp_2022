export class SourceSettingValue {
    public id: string = null;
    public name: string = '';
    public value: string = '';
    public automatic: number = 0;


    public constructor(init?: Partial<SourceSettingValue>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<SourceSettingValue>): void {
        Object.assign(this, values);
    }
}

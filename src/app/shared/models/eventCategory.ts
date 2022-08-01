export class EventCategory {
    public id: string = '';
    public description: string='';
    public default: number=0;

    public constructor(init?: Partial<EventCategory>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<EventCategory>): void {
        Object.assign(this, values);
    }
}

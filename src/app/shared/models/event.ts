import {EventCategory} from './eventCategory';

export class Event {
    public id: string = '';
    public eventCategoryId: string = '';
    public description: string='';
    public eventDate: Date;
    public type: string='';

    public constructor(init?: Partial<Event>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Event>): void {
        Object.assign(this, values);
    }
}

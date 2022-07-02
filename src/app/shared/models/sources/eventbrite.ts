import {Source} from './source';

export class Eventbrite extends Source {
    public name: string = 'eventbrite';
    public description: string = 'Eventbrite';
    public esp: boolean = false;

    public values: string[] = ['access_token'];

}

import {Source} from './source';

export class Verticalresponse extends Source {
    public name: string = 'verticalresponse';
    public description: string = 'VerticalResponse';
    public esp: boolean = true;

    public values: string[] = ['access_token'];

}

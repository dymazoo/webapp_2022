import {Source} from './source';

export class Emailoctopus extends Source {
    public name: string = 'emailoctopus';
    public description: string = 'EmailOctopus';
    public esp: boolean = true;

    public values: string[] = ['api_key'];

}

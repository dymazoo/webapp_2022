import {Source} from './source';

export class Sendinblue extends Source {
    public name: string = 'sendinblue';
    public description: string = 'Sendinblue';
    public esp: boolean = true;

    public values: string[] = ['api_key', 'date-format'];

}

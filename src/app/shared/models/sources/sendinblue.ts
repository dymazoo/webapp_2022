import {Source} from './source';

export class Sendinblue extends Source {
    public name: string = 'sendinblue';
    public description: string = 'Brevo (Sendinblue)';
    public esp: boolean = true;

    public values: string[] = ['api_key', 'date_format'];

}

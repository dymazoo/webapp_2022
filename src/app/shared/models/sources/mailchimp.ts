import {Source} from './source';

export class Mailchimp extends Source {
    public name: string = 'mailchimp';
    public description: string = 'Mailchimp';
    public esp: boolean = true;

    public values: string[] = ['api_key', 'permission_reminder'];

}

import {Source} from './source';

export class Instiller extends Source {
    public name: string = 'instiller';
    public description: string = 'Instiller';
    public esp: boolean = true;

    public values: string[] = ['api_id', 'api_key'];

}

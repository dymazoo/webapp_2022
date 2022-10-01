import {Source} from './source';

export class Shopify extends Source {
    public name: string = 'shopify';
    public description: string = 'Shopify';
    public esp: boolean = false;

    public values: string[] = ['api_key', 'password', 'store_url'];

}

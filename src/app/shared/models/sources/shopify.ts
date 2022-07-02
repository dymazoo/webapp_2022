import {Source} from './source';

export class Shopify extends Source {
    public name: string = 'shopify';
    public description: string = 'Shopify';
    public esp: boolean = false;

    public values: string[] = ['api_key', 'api_token', 'store_url'];

}

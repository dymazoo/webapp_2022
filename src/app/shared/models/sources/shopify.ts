import {Source} from './source';

export class Shopify extends Source {
    public name: string = 'shopify';
    public description: string = 'Shopify';
    public esp: boolean = false;

    public values: string[] = ['access_token', 'store_url'];

}

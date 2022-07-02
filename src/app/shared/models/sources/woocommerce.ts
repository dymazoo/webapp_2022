import {Source} from './source';

export class Woocommerce extends Source {
    public name: string = 'woocommerce';
    public description: string = 'WooCommerce';
    public esp: boolean = false;

    public values: string[] = ['api_key', 'woo_setting'];

}

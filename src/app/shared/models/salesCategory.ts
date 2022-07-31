import {SalesSubCategory} from './salesSubCategory';

export class SalesCategory {
    public id: string = '';
    public description: string='';
    public default: number=0;
    public subCategories: SalesSubCategory[] = [];

    public constructor(init?: Partial<SalesCategory>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<SalesCategory>): void {
        Object.assign(this, values);
    }
}

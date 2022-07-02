import {SourceSettingValue} from './sourceSettingValue';

export class SourceSetting {
    public id: string = '';
    public name: string='';
    public description: string='';
    public default: number = 0;
    public enabled: number = 0;
    public values: SourceSettingValue[] = [];


    public constructor(init?: Partial<SourceSetting>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<SourceSetting>): void {
        Object.assign(this, values);
    }
}

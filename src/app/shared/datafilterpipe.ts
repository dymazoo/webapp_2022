import * as _ from 'lodash';
import {
    Pipe,
    PipeTransform
} from '@angular/core';

@Pipe({
    name: 'dataFilterName'
})
export class DataFilterPipeName implements PipeTransform {

    transform(array: any[], query: string): any {
        if (query) {
            return _.filter(array, row => row.name.toLowerCase().indexOf(query.toLowerCase()) > -1);
        }
        return array;
    }
}

@Pipe({
    name: 'dataFilterDescription'
})
export class DataFilterPipeDescription implements PipeTransform {

    transform(array: any[], query: string): any {
        if (query) {
            return _.filter(array, row => row.description.toLowerCase().indexOf(query.toLowerCase()) > -1);
        }
        return array;
    }
}

@Pipe({
    name: 'dataFilterTitle'
})
export class DataFilterPipeTitle implements PipeTransform {

    transform(array: any[], query: string): any {
        if (query) {
            return _.filter(array, row => row.title.toLowerCase().indexOf(query.toLowerCase()) > -1);
        }
        return array;
    }
}

@Pipe({
    name: 'dataFilterLabel'
})
export class DataFilterPipeLabel implements PipeTransform {

    transform(array: any[], query: string): any {
        if (query) {
            return _.filter(array, row => row.label.toLowerCase().indexOf(query.toLowerCase()) > -1);
        }
        return array;
    }
}

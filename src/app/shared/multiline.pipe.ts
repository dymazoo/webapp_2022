import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'multiLine'
})
export class MultiLinePipe implements PipeTransform {
    transform(input: string): string {
        var output = input
        //replace possible line breaks.
            .replace(/(\r\n|\r|\n)/g, '<br/>')
            //replace tabs
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;')
            //replace spaces.
            .replace(/ /g, '&nbsp;');

        return output;
    }
}
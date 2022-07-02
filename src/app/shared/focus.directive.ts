import {Directive, AfterViewInit, ElementRef} from '@angular/core';

@Directive({
    selector: '[focus]'
})
export class FocusDirective implements AfterViewInit {

    constructor(private host: ElementRef) {}

    ngAfterViewInit() {
        this.host.nativeElement.focus();
    }

}
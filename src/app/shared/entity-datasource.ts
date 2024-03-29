import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {HttpService} from './services/http.service';

export class EntityDatasource extends DataSource<any> {
    onItemsChanged: BehaviorSubject<any>;
    onItemSelected: BehaviorSubject<any>;
    items: [];
    type: string = 'GET';

    public errors = [];
    public hasItems = false;

    constructor(
        private httpService: HttpService,
        private itemEntity: string,
        private itemParams: any
    ) {
        super();
        // Set the defaults
        this.onItemsChanged = new BehaviorSubject({});
        this.onItemSelected = new BehaviorSubject({item: null, index: -1});
        if (this.itemParams.type) {
            this.type = this.itemParams.type;
        }

        this.getItems();
    }

    connect(): BehaviorSubject<any[]> {
        return this.onItemsChanged;
    }

    disconnect(): void {
        this.onItemsChanged.complete();
        this.onItemSelected.complete();
    }

    public getItem(index: number): any {
        return this.items[index];
    }

    public setParams(itemParams): void {
        this.itemParams = itemParams;
    }

    public refresh(): any {
        this.getItems();
    }

    private getItems(): void {
        if (this.type === 'GET') {
            this.httpService.getEntity(this.itemEntity, this.itemParams)
                .subscribe(result => {
                    this.items = result;
                    this.hasItems = true;
                    this.onItemsChanged.next(result);
                    this.onItemSelected.next({item: result[0], index: 0});
                }, (errors) => {
                    this.errors = errors;
                });
        } else {
            this.httpService.saveEntity(this.itemEntity, this.itemParams)
                .subscribe(result => {
                    this.items = result;
                    this.hasItems = true;
                    this.onItemsChanged.next(result);
                    this.onItemSelected.next({item: result[0], index: 0});
                }, (errors) => {
                    this.errors = errors;
                });
        }
    }

}

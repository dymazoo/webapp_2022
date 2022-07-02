import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable, BehaviorSubject} from 'rxjs';
import {HttpService} from './http.service';

@Injectable()
export class EntityDataService implements Resolve<any> {
    onItemsChanged: BehaviorSubject<any>;
    onItemSelected: BehaviorSubject<any>;

    constructor(
        private httpService: HttpService,
        private itemEntity: string,
        private itemParams: any
    ) {
        // Set the defaults
        this.onItemsChanged = new BehaviorSubject({});
        this.onItemSelected = new BehaviorSubject({});
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getItems()
            ]).then(
                ([items]) => {
                    resolve(null);
                },
                reject
            );
        });
    }

    getItems(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.httpService.getEntity(this.itemEntity, this.itemParams)
                .subscribe(result => {
                    this.onItemsChanged.next(result);
                    this.onItemSelected.next(result[0]);
                    resolve(result);
                }, reject);
        });
    }

}

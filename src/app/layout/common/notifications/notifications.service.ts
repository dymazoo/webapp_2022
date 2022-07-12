import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, ReplaySubject, switchMap, take, tap} from 'rxjs';
import {Notification} from 'app/layout/common/notifications/notifications.types';
import {HttpService} from 'app/shared/services/http.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    private apiUrl: string;
    private _notifications: ReplaySubject<Notification[]> = new ReplaySubject<Notification[]>(1);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private httpService: HttpService
    ) {
        this.apiUrl = this.httpService.apiUrl;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for notifications
     */
    get notifications$(): Observable<Notification[]> {
        return this._notifications.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all notifications
     */
    getAll(): Observable<Notification[]> {
        const headers = this.httpService.createAuthorizationHeader();
        return this._httpClient.get<Notification[]>(this.apiUrl + 'updates', {
            headers: headers
        }).pipe(
            tap((notifications) => {
                this._notifications.next(notifications);
            })
        );
    }

    /**
     * Create a notification
     *
     * @param notification
     */
    create(notification: Notification): Observable<Notification> {
        const headers = this.httpService.createAuthorizationHeader();
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.post<Notification>(
                this.apiUrl + 'createUpdate', {notification}, {headers: headers}
            ).pipe(
                map((newNotification) => {

                    // Update the notifications with the new notification
                    this._notifications.next([...notifications, newNotification]);

                    // Return the new notification from observable
                    return newNotification;
                })
            ))
        );
    }

    /**
     * Update the notification
     *
     * @param id
     * @param notification
     */
    update(id: string, notification: Notification): Observable<Notification> {
        const headers = this.httpService.createAuthorizationHeader();
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.post<Notification>(
                this.apiUrl + 'updateRead',
                {id, notification},
                {headers: headers}
            ).pipe(
                map((updatedNotification: Notification) => {

                    // Find the index of the updated notification
                    const index = notifications.findIndex(item => item.id === id);

                    // Update the notification
                    notifications[index] = updatedNotification;

                    // Update the notifications
                    this._notifications.next(notifications);

                    // Return the updated notification
                    return updatedNotification;
                })
            ))
        );
    }

    /**
     * Delete the notification
     *
     * @param id
     */
    delete(id: string): Observable<boolean> {
        const headers = this.httpService.createAuthorizationHeader();
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.post(
                this.apiUrl + 'updateAcknowledge',
                {id},
                {headers: headers}
            ).pipe(
                map((isDeleted: boolean) => {

                    // Find the index of the deleted notification
                    const index = notifications.findIndex(item => item.id === id);

                    // Delete the notification
                    notifications.splice(index, 1);

                    // Update the notifications
                    this._notifications.next(notifications);

                    // Return the deleted status
                    return isDeleted;
                })
            ))
        );
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Observable<boolean> {
        const headers = this.httpService.createAuthorizationHeader();
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.post(
                this.apiUrl + 'updateReadAll',
                {},
                {headers: headers}
            ).pipe(
                map((isUpdated: boolean) => {

                    // Go through all notifications and set them as read
                    notifications.forEach((notification, index) => {
                        notifications[index].read = true;
                    });

                    // Update the notifications
                    this._notifications.next(notifications);

                    // Return the updated status
                    return isUpdated;
                })
            ))
        );
    }

    /**
     * Delete all notifications
     */
    deleteAll(): Observable<boolean> {
        const headers = this.httpService.createAuthorizationHeader();
        return this.notifications$.pipe(
            take(1),
            switchMap(notifications => this._httpClient.post(
                this.apiUrl + 'updateAcknowledgeAll',
                {},
                {headers: headers}
            ).pipe(
                map((isUpdated: boolean) => {

                    notifications = [];

                    // Update the notifications
                    this._notifications.next(notifications);

                    // Return the updated status
                    return isUpdated;
                })
            ))
        );
    }

}

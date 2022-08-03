import {HttpService} from './http.service';

export function dymazooDates() {
    return (httpService: HttpService): any => {
        return httpService.getDymazooDates();
    };
};

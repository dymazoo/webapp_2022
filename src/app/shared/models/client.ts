export class Client {
    public name: string = '';
    public address1: string = '';
    public address2: string = '';
    public city: string = '';
    public postcode: string = '';
    public country: string = '';
    public timeZone: string = '';
    public primaryEmail: string = '';
    public telephone: string = '';
    public billing: string = '';
    public signUpDate: string = '';
    public plan: string = '';
    public profiles: number = 5000;

    public constructor(init?: Partial<Client>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<Client>): void {
        Object.assign(this, values);
    }
}

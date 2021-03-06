export class User {
    public email: string = '';
    public password: string = '';
    public confirmPassword: string = '';
    public name: string = '';
    public token: string = '';
    public layout: string ='';
    public scheme: string = '';
    public theme: string = '';
    public lastLogin: string = '';
    public clientAdmin: number = 0;
    public roles: any = [];

    public constructor(init?: Partial<User>) {
        Object.assign(this, init);
    }

    public setValues(values?: Partial<User>): void {
        Object.assign(this, values);
    }
}

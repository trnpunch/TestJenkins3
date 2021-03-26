class Service {

    protected res: any;

    public constructor()
    {
        this.res = {
            status: false,
            code: 500,
            value: null
        };
    }

    protected setRes(status: boolean, code: number, value: any): void {
        this.res.status = status;
        this.res.code = code;
        this.res.value = value;
    }

    protected getRes(): any {
        let item: any = {
            code: this.res.code
        };
        if (this.res.status) {
            item.data = this.res.value;
        } else {
            item.error = this.res.value;
        }
        return item;
    }

}

export default Service;
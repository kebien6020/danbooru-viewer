export interface BooruOptions {
    api: string;
    name: string;
}
export interface Booru extends BooruOptions {}
export class Booru {
    constructor(options: BooruOptions) {
        Object.assign(this, options);
        if (this.api.endsWith('/')) this.api = this.api.slice(0, -1)
    }
}
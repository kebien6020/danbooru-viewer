import { $EventManager, type $EventMap } from "elexis";
import type { Post } from "./Post";
import type { Tag } from "./Tag";

export interface BooruOptions {
    origin: string;
    name: string;
}
export interface Booru extends BooruOptions {}
export class Booru {
    static used: Booru;
    static events = new $EventManager<BooruEventMap>();
    static name$ = $.state(this.name);
    static manager = new Map<string, Booru>()
    posts = new Map<id, Post>();
    tags = new Map<id, Tag>();
    constructor(options: BooruOptions) {
        Object.assign(this, options);
        if (this.origin.endsWith('/')) this.origin = this.origin.slice(0, -1);
        Booru.manager.set(this.name, this);
    }

    static set(booru: Booru) {
        this.used = booru;
        this.name$.set(booru.name);
        this.storageAPI = booru.name;
        this.events.fire('set');
        return this;
    }

    static get storageAPI() { return localStorage.getItem('booru_api'); }
    static set storageAPI(name: string | null) { if (name) localStorage.setItem('booru_api', name); else localStorage.removeItem('booru_api') }

}

interface BooruEventMap extends $EventMap {
    set: []
}
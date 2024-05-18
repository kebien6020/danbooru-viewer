import type { Booru } from "./Booru";

const INTL_number = new Intl.NumberFormat('en', {notation: 'compact'})
export interface TagOptions {}
export interface Tag extends TagData {}
export class Tag {
    static manager = new Map<id, Tag>();
    post_count$ = $.state(0, {format: (value) => `${INTL_number.format(value)}`});
    name$ = $.state('');
    constructor(data: TagData) {
        Object.assign(this, data);
        this.$update();
    }

    static async fetch(booru: Booru, id: id) {
        const data = await fetch(`${booru.api}/tags/${id}.json`).then(async data => await data.json()) as TagData;
        const instance = this.manager.get(data.id)?.update(data) ?? new this(data);
        this.manager.set(instance.id, instance);
        return instance;
    }

    static async fetchMultiple(booru: Booru, search?: Partial<TagSearchParams>, limit = 1000) {
        let searchQuery = '';
        if (search) {
            for (const [key, val] of Object.entries(search)) {
                if (val instanceof Array) searchQuery += `&search[${key}]=${val}`;
                else if (val instanceof Object) {
                    for (const [ckey, cval] of Object.entries(val)) {
                        searchQuery += `&search[${key}${ckey}]=${cval}`
                    }
                }
                else searchQuery += `&search[${key}]=${val}`
            }
        }
        const req = await fetch(`${booru.api}/tags.json?limit=${limit}${searchQuery}`);
        const dataArray: TagData[] = await req.json();
        const list = dataArray.map(data => {
            const instance = this.manager.get(data.id)?.update(data) ?? new this(data);
            this.manager.set(instance.id, instance);
            return instance;
        });
        return list;
    }

    update(data: TagData) {
        Object.assign(this, data);
        this.$update();
        return this;
    }

    $update() {
        this.post_count$.set(this.post_count);
        this.name$.set(this.name); 
    }
}

export interface TagData {
    "id": id,
    "name": string,
    "post_count": number,
    "category": number,
    "created_at": ISOString,
    "updated_at": ISOString,
    "is_deprecated": boolean,
    "words": string[];
}

export interface TagSearchParams {
    id: NumericSyntax<id>;
    category: NumericSyntax<TagCategory>;
    post_count: NumericSyntax<number>;
    created_at: NumericSyntax<ISOString>;
    updated_at: NumericSyntax<ISOString>;
    name: TextSyntax<string>;
    is_deprecated: boolean;
    fuzzy_name_matches: string;
    name_matches: string;
    name_normalize: string;
    name_or_alias_matches: string;
    hide_empty: boolean;
    order: 'name' | 'date' | 'count' | 'similarity'
}

export enum TagCategory {
    General = 0,
    Artist = 1,
    Copyright = 3,
    Character = 4,
    Meta = 5
}
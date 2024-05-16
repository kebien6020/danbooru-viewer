import type { Booru } from "./Booru";

export interface TagOptions {}
export interface Tag extends TagData {}
export class Tag {
    static manager = new Map<id, Tag>();
    constructor(data: TagData) {
        Object.assign(this, data);
    }

    static async fetch(booru: Booru, id: id) {
        const req = await fetch(`${booru.api}/tags/${id}.json`);
        const post = new this(await req.json());
        return post;
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
            const instance = new this(data);
            this.manager.set(instance.id, instance);
            return instance;
        });
        return list;
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
    General,
    Artist,
    Copyright,
    Character,
    Meta
}
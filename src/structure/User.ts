import type { Booru } from "./Booru";

export class UserOptions {}
export interface User extends UserOptions, UserData {}
export class User {
    static manager = new Map<id, User>();
    name$ = $.state('...');
    post_upload_count$ = $.state(0);
    level$ = $.state(10);
    level_string$ = $.state('...');
    booru: Booru;
    constructor(booru: Booru, data: UserData, update$: boolean = true) {
        this.booru = booru;
        Object.assign(this, data);
        if (update$) this.update$();
    }

    static async fetch(booru: Booru, id: id) {
        const data = await fetch(`${booru.origin}/users/${id}.json`).then(async data => await data.json()) as UserData;
        const instance = this.manager.get(data.id)?.update(data) ?? new this(booru, data);
        this.manager.set(instance.id, instance);
        return instance;
    }

    static async fetchMultiple(booru: Booru, search?: Partial<UserSearchParam>, limit = 200) {
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
        const req = await fetch(`${booru.origin}/users.json?limit=${limit}${searchQuery}`);
        const dataArray: UserData[] = await req.json();
        const list = dataArray.map(data => {
            const instance = new this(booru, data);
            this.manager.set(instance.id, instance);
            return instance;
        });
        return list;
    }

    update(data: UserData) {
        Object.assign(this, data);
        this.update$();
        return this;
    }

    update$() {
        this.name$.set(this.name);
        this.post_upload_count$.set(this.post_upload_count);
        this.level$.set(this.level);
        this.level_string$.set(this.level_string);
    }

    get booruURL() { return `${this.booru.origin}/users/${this.id}`}
    get url() { return `/users/${this.id}`}
}

export enum UserLevel {
    Restricted = 10,
    Member = 20,
    Gold = 30,
    Platinum = 31,
    Builder = 32,
    Contributor = 35,
    Approver = 37,
    Moderater = 40,
    Admin = 50
}
export interface UserData {
    "id": id,
    "name": username,
    "level": UserLevel,
    "inviter_id": id,
    "created_at": ISOString,
    "post_update_count": number,
    "note_update_count": number,
    "post_upload_count": number,
    "is_deleted": boolean,
    "level_string": keyof UserLevel,
    "is_banned": boolean,
}

export interface UserSearchParam {
    id: NumericSyntax<id>;
    level: NumericSyntax<UserLevel>;
    post_upload_count: NumericSyntax<number>;
    post_update_count: NumericSyntax<number>;
    note_update_count: NumericSyntax<number>;
    favorite_count: NumericSyntax<number>;
    created_at: NumericSyntax<ISOString>;
    updated_at: NumericSyntax<ISOString>;
    name: TextSyntax<username>;
    inviter: UserSyntax;
    name_matches: string;
    min_level: UserLevel;
    max_level: UserLevel;
    current_user_first: boolean;
    order: 'name' | 'post_upload_count' | 'post_update_count' | 'note_update_count';
}
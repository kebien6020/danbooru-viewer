import type { Booru } from "./Booru";

export class UserOptions {}
export interface User extends UserOptions, UserData {}
export class User {
    static manager = new Map<id, User>();
    name$ = $.state('loding...');
    constructor(data: UserData) {
        Object.assign(this, data);
        this.update$();
    }

    static async fetch(booru: Booru, id: id) {
        const data = await fetch(`${booru.api}/users/${id}.json`).then(async data => await data.json()) as UserData;
        const instance = this.manager.get(data.id)?.update(data) ?? new this(data);
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
        const req = await fetch(`${booru.api}/users.json?limit=${limit}${searchQuery}`);
        const dataArray: UserData[] = await req.json();
        const list = dataArray.map(data => {
            const instance = new this(data);
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
    }
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
    "level_string": UserLevelString,
    "is_banned": boolean,
}

export type UserLevel = 10 | 20 | 30 | 31 | 32 | 40 | 50;
export type UserLevelString = "Member" | "Gold" | "Platinum" | "Admin";

export interface UserProfileData extends UserData {
    "last_logged_in_at": ISOString,
    "last_forum_read_at": ISOString,
    "comment_threshold": number,
    "updated_at": ISOString,
    "default_image_size": "large" | "original",
    "favorite_tags": null | string,
    "blacklisted_tags": string,
    "time_zone": string,
    "favorite_count": number,
    "per_page": number,
    "custom_style": string,
    "theme": "auto" | "light" | "dark",
    "receive_email_notifications": boolean,
    "new_post_navigation_layout": boolean,
    "enable_private_favorites": boolean,
    "show_deleted_children": boolean,
    "disable_categorized_saved_searches": boolean,
    "disable_tagged_filenames": boolean,
    "disable_mobile_gestures": boolean,
    "enable_safe_mode": boolean,
    "enable_desktop_mode": boolean,
    "disable_post_tooltips": boolean,
    "requires_verification": boolean,
    "is_verified": boolean,
    "show_deleted_posts": boolean,
    "statement_timeout": number,
    "favorite_group_limit": 10 | 100,
    "tag_query_limit": 2 | 6,
    "max_saved_searches": 250,
    "wiki_page_version_count": number,
    "artist_version_count": number,
    "artist_commentary_version_count": number,
    "pool_version_count": number | null,
    "forum_post_count": number,
    "comment_count": number,
    "favorite_group_count": number,
    "appeal_count": number,
    "flag_count": number,
    "positive_feedback_count": number,
    "neutral_feedback_count": number,
    "negative_feedback_count": number
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
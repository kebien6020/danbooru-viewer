import type { Booru } from "./Booru";
import type { TagCategory } from "./Tag";
import type { UserLevelString } from "./User";

export class Autocomplete {
    static async fetch(booru: Booru, query: string, limit: number = 20) {
        const res = await fetch(`${booru.origin}/autocomplete.json?search[query]=${query}&search[type]=tag_query&version=1&limit=${limit}`).then(res => res.json()) as AutocompleteData[];
        return res.map(data => new AutocompleteResult(data));
    }
}

export interface AutocompleteResult extends AutocompleteBaseData {}
export class AutocompleteResult {
    constructor(data: AutocompleteData) {
        Object.assign(this, data);
    }

    isTag(): this is AutocompleteResult & (AutocompleteTagData | AutocompleteTagAliasData | AutocompleteTagAutocorrectData) {
        return this.type === 'tag' || this.type === 'tag-autocorrect' || this.type === 'tag-alias' || this.type === 'tag-word';
    }

    isTagAutocorrect(): this is AutocompleteResult & AutocompleteTagAutocorrectData {
        return this.type === 'tag-autocorrect';
    }

    isTagAntecedent(): this is Autocomplete & AutocompleteTagAutocorrectData {
        //@ts-expect-error
        return !!this['antecedent' as any]
    }

    isTagWord(): this is AutocompleteResult & AutocompleteTagWordData {
        return this.type === 'tag-word'
    }

    isUser(): this is AutocompleteResult & AutocompleteUserData {
        return this.type === 'user';
    }
}

type AutocompleteData = AutocompleteBaseData & (AutocompleteUserData | AutocompleteTagData | AutocompleteTagAutocorrectData | AutocompleteTagAliasData);

interface AutocompleteBaseData {
    type: 'user' | 'tag' | 'tag-autocorrect' | 'tag-alias' | 'tag-word';
    label: string;
    value: string;
}

interface AutocompleteUserData {
    type: 'user';
    id: number;
    level: Lowercase<UserLevelString>;
}
interface AutocompleteTagData {
    type: 'tag';
    category: TagCategory;
    post_count: number;
}
interface AutocompleteTagAutocorrectData {
    type: 'tag-autocorrect';
    category: TagCategory;
    post_count: number;
    antecedent: string;
}
interface AutocompleteTagAliasData {
    type: 'tag-alias';
    category: TagCategory;
    post_count: number;
    antecedent: string;
}
interface AutocompleteTagWordData{
    type: 'tag-word';
    category: TagCategory;
    post_count: number;
    antecedent: string;
}
import { $Layout, type $LayoutEventMap } from "@elexis/layout";
import { Booru } from "../../structure/Booru";
import { Post } from "../../structure/Post";
import { $PostTile } from "../PostTile/$PostTile";
import { $Input } from "elexis/lib/node/$Input";

interface $PostGridOptions {
    tags?: string
}
export class $PostGrid extends $Layout<$PostGridEventMap> {
    posts = new Set<Post>();
    $posts = new Map<Post, $PostTile>();
    orderMap = new Map<id, Post>();
    tags?: string;
    finished = false;
    limit = 100;
    $focus = $.focus();
    constructor(options?: $PostGridOptions) {
        super();
        this.tags = options?.tags;
        this.addStaticClass('post-grid');
        this.type('waterfall').gap(10);
        this.init();
    }

    protected async init() {
        setInterval(() => { if (this.inDOM() && document.documentElement.scrollTop === 0) this.getPost('newer'); }, 10000);
        Booru.events.on('set', () => {
            this.removeAll();
            if (this.finished) { 
                this.finished = false;
                this.events.fire('startLoad');
                this.loader(); 
            } 
        })
        this.on('resize', () => this.resize())
        this.on('afterRender', () => {
            this.$focus.currentLayer?.focus(this.$focus.currentLayer.currentFocus);
        })
        this.events.fire('startLoad');
        this.loader();
        this.$focus.layer(100).loop(false).scrollThreshold($.rem(2) + 60);

        $.keys($(window))
            .if(e => {
                if ($(e.target) instanceof $Input) return; 
                if (!this.inDOM()) return;
                return true;
            })
            // .keydown('Tab', e => {
            //     e.preventDefault();
            //     if (e.shiftKey) this.$focus.prev();
            //     else this.$focus.next();
            // })
            .keydown(['w', 'W'], e => { e.preventDefault(); this.$focus.up(); })
            .keydown(['s', 'S'], e => { e.preventDefault(); this.$focus.down(); })
            .keydown(['d', 'D'], e => { e.preventDefault(); this.$focus.right(); })
            .keydown(['a', 'A'], e => { e.preventDefault(); this.$focus.left(); })
            .keydown([' ', 'Enter'], e => {
                e.preventDefault();
                const focused = this.$focus.currentLayer?.currentFocus;
                if (focused instanceof $PostTile) $.open(`/posts/${focused.post.id}`);
            })
            .keydown(['Escape'], e => { e.preventDefault(); this.$focus.blur(); })
    }

    protected async loader() {
        if (!this.inDOM()) return setTimeout(() => this.loader(), 100);;
        while (this.inDOM() && document.documentElement.scrollHeight <= innerHeight * 2) {
            const posts = await this.getPost('older');
            if (!posts.length) return;
        }
        if (document.documentElement.scrollTop + innerHeight > document.documentElement.scrollHeight - innerHeight * 2) {
            const posts = await this.getPost('older');
            if (!posts.length) return;
        }
        setTimeout(() => this.loader(), 100);
    }

    protected resize() {
        const col = Math.round(this.dom.clientWidth / 300);
        this.column(col >= 2 ? col : 2);
    }

    addPost(posts: OrArray<Post>) {
        posts = $.orArrayResolve(posts);
        for (const post of posts) {
            if (!post.file_url) continue;
            if (this.posts.has(post)) continue;
            const $post = new $PostTile(post);
            this.$posts.set(post, $post);
            this.posts.add(post);
        }
        this.$focus.layer(100).removeAll();
        const $posts = [...this.orderMap.values()].map(post => this.$posts.get(post)?.self(this.$focus.layer(100).add));
        this.content($posts).render();
        return this;
    }

    removeAll() {
        this.posts.clear();
        this.$posts.clear();
        this.orderMap.clear();
        this.animate({opacity: [1, 0]}, {duration: 300, easing: 'ease'}, () => this.clear().render())
        return this;
    }

    async getPost(direction: 'newer' | 'older'): Promise<Post[]> {
        const tags = this.tags ? decodeURIComponent(this.tags).split('+') : undefined;
        const generalTags: string[] = [];
        const orderTags: string[] = [];
        let limit: number = this.limit;
        if (tags) for (const tag of tags) {
            if (tag.startsWith('ordfav:')) orderTags.push(tag);
            else if (tag.startsWith('order:')) orderTags.push(tag);
            else if (tag.startsWith('limit:')) limit = Number(tag.split(':')[1]);
            else generalTags.push(tag);
        }
        if (orderTags.length) {
            if (orderTags.length > 1) {
                this.events.fire('post_error', `Error: These query can't be used together [${orderTags}].`)
                return [];
            }
            const orderTag = orderTags[0];
            if (orderTag.startsWith('ordfav:')) {
                const username = orderTag.split(':')[1];
                const match_tags = generalTags.length ? `&search[post_tags_match]=${generalTags.toString().replaceAll(',', '+')}` : '';
                const beforeAfter = this.orderKeyList.length ? direction === 'newer' ? `&search[id]=>${this.orderKeyList.at(0)}` : `&search[id]=<${this.orderKeyList.at(-1)}` : undefined;
                const favoritesDataList = await Booru.used.fetch<FavoritesData[]>(`/favorites.json?search[user_name]=${username}${beforeAfter ?? ''}${match_tags}&limit=${limit}`);
                const posts = await Post.fetchMultiple(Booru.used, {tags: `id:${favoritesDataList.map(data => data.post_id).toString()}`});
                const newPostOrderMap = new Map();
                for (const fav of favoritesDataList) {
                    const post = posts.find(post => post.id === fav.post_id);
                    if (!post) continue;
                    newPostOrderMap.set(fav.id, post);
                }
                this.orderMap = new Map(direction === 'newer' ? [...newPostOrderMap, ...this.orderMap] : [...this.orderMap, ...newPostOrderMap]);
                this.addPost(posts);
                return posts;
            }

            if (orderTag.startsWith('order:')) {
                const page = this.orderKeyList.length ? direction === 'newer' ? 1 : (this.orderMap.size / limit) + 1 : undefined;
                const posts = await Post.fetchMultiple(Booru.used, {tags: this.tags}, limit, page);
                const newPostOrderMap = new Map(posts.map(post => [post.id, post]));
                newPostOrderMap.forEach((post, id) => { if (this.orderMap.has(id)) newPostOrderMap.delete(id) });
                this.orderMap = new Map(direction === 'newer' ? [...newPostOrderMap, ...this.orderMap] : [...this.orderMap, ...newPostOrderMap])
                this.addPost(posts);
                return posts
            }
        }
        
        const beforeAfter = this.orderKeyList.length ? direction === 'newer' ? `a${this.orderKeyList.at(0)}` : `b${this.orderKeyList.at(-1)}` : undefined;
        const posts = await Post.fetchMultiple(Booru.used, {tags: this.tags}, limit, beforeAfter);
        const newPostOrderMap = new Map(posts.map(post => [post.id, post]));
        this.orderMap = new Map(direction === 'newer' ? [...newPostOrderMap, ...this.orderMap] : [...this.orderMap, ...newPostOrderMap])
        this.addPost(posts);

        if (!posts.length) {
            this.finished = true;
            if (!this.posts.size) this.events.fire('noPost');
            else this.events.fire('endPost')
        }

        return posts
    }

    get orderKeyList() { return [...this.orderMap.keys()]}
}

interface $PostGridEventMap extends $LayoutEventMap {
    startLoad: [];
    noPost: [];
    endPost: [];
    post_error: [message: string];

}

interface FavoritesData {
    id: id;
    post_id: id;
    user_id: id;
}
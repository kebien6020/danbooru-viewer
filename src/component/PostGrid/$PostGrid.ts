import { $Layout, type $LayoutEventMap } from "@elexis/layout";
import { Booru } from "../../structure/Booru";
import { Post } from "../../structure/Post";
import { $PostTile } from "../PostTile/$PostTile";
import { $Input } from "elexis/lib/node/$Input";
import { PostManager } from "../../structure/PostManager";

interface $PostGridOptions {
    tags?: string
}
export class $PostGrid extends $Layout {
    $posts = new Map<Post, $PostTile>();
    tags?: string;
    $focus = $.focus();
    posts: PostManager;
    constructor(options?: $PostGridOptions) {
        super();
        this.tags = options?.tags;
        this.posts = PostManager.get(this.tags);
        this.addStaticClass('post-grid');
        this.type('waterfall').gap(10);
        this.init();
    }

    protected async init() {
        this.posts.events.on('post_fetch', (posts) => { this.addPost(posts) })
        setInterval(async () => { if (this.inDOM() && document.documentElement.scrollTop === 0) await this.posts.fetchPosts('newer'); }, 10000);
        Booru.events.on('set', () => {
            this.removeAll();
            if (this.posts.finished) { 
                this.posts.finished = false;
                this.loader();
            } 
        })
        this.on('resize', () => this.resize())
        // this.on('afterRender', () => {
        //     this.$focus.currentLayer?.focus(this.$focus.currentLayer.currentFocus);
        // })
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
                if (focused instanceof $PostTile) $.open(focused.url);
            })
            .keydown(['Escape'], e => { e.preventDefault(); this.$focus.blur(); })
    }

    protected async loader() {
        if (!this.inDOM()) return setTimeout(() => this.loader(), 100);;
        while (this.inDOM() && document.documentElement.scrollHeight <= innerHeight * 2) {
            const posts = await this.posts.fetchPosts('older');
            if (!posts.length) return;
        }
        if (document.documentElement.scrollTop + innerHeight > document.documentElement.scrollHeight - innerHeight * 2) {
            const posts = await this.posts.fetchPosts('older');
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
            if (this.posts.cache.has(post)) continue;
            const $post = new $PostTile(this, post).on('$focus', (e, $post) => this.$focus.layer(100).focus($post));
            this.$posts.set(post, $post);
            this.posts.cache.add(post);
        }
        this.$focus.layer(100).elementSet.clear();
        const $posts = [...this.posts.orderMap.values()].map(post => {
            return this.$posts.get(post)?.self(this.$focus.layer(100).add)
        });
        this.content($posts).render();
        return this;
    }

    removeAll() {
        this.posts.clear();
        this.$posts.clear();
        this.$focus.layer(100).removeAll();
        this.animate({opacity: [1, 0]}, {duration: 300, easing: 'ease'}, () => this.clear().render())
        return this;
    }

}
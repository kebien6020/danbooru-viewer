import { $Layout } from "@elexis/layout";
import { Booru } from "../../structure/Booru";
import { Post } from "../../structure/Post";
import { $PostTile } from "../PostTile/$PostTile";

interface $PostGridOptions {
    tags?: string
}
export class $PostGrid extends $Layout {
    posts = new Set<Post>();
    $posts = new Set<$PostTile>();
    tags?: string;
    constructor(options?: $PostGridOptions) {
        super();
        this.tags = options?.tags;
        this.addStaticClass('post-grid');
        this.type('waterfall').gap(10);
        this.init();
    }

    protected async init() {
        setInterval(() => { if (this.inDOM() && document.documentElement.scrollTop === 0) this.updateNewest(); }, 10000);
        Booru.events.on('set', () => { this.removeAll(); })
        this.on('resize', () => this.resize())
        this.loader();
    }

    protected async loader() {
        if (!this.inDOM()) return setTimeout(() => this.loader(), 100);;
        while (this.inDOM() && document.documentElement.scrollHeight <= innerHeight * 2) {
            await this.getPosts();
            if (!this.posts.size) return;
        }
        if (document.documentElement.scrollTop + innerHeight > document.documentElement.scrollHeight - innerHeight * 2) await this.getPosts();
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
            this.$posts.add($post);
            this.posts.add(post);
        }
        const $posts = [...this.$posts.values()].sort((a, b) => +b.post.createdDate - +a.post.createdDate);
        this.content($posts).render();
        return this;
    }

    removeAll() {
        this.posts.clear();
        this.$posts.clear();
        this.animate({opacity: [1, 0]}, {duration: 300, easing: 'ease'}, () => this.clear().render())
        return this;
    }

    async updateNewest() {
        const latestPost = this.sortedPosts.at(0);
        const posts = await Post.fetchMultiple(Booru.used, {tags: this.tags, id: latestPost ? `>${latestPost.id}` : undefined});
        this.addPost(posts);
        return this;
    }

    async getPosts() {
        const oldestPost = this.sortedPosts.at(-1);
        const posts = await Post.fetchMultiple(Booru.used, {tags: this.tags, id: oldestPost ? `<${oldestPost.id}` : undefined});
        this.addPost(posts);
        return this;
    }

    get sortedPosts() { return this.posts.array.sort((a, b) => +b.createdDate - +a.createdDate); }

}
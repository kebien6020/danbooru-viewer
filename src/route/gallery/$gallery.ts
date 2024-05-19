import { Route, Router } from "@elexis/router";
import { Post } from "../../structure/Post";
import { booru } from "../../main";
import { $PostGrid } from "../../component/PostGrid/$PostGrid";
import { $PostTile } from "../../component/PostTile/$PostTile";
const MAX_POST_LENGTH = 100;
export const home_route = new Route((path) => {
    if (path === '/posts' || path === '/') return '/';
}, ({record}) => {
    const $page = $('page').id('root');
    async function load(tags: string) {
        const posts = await Post.fetchMultiple(booru, tags.length ? {tags: tags} : undefined, MAX_POST_LENGTH)
        const filtered_posts = posts.filter(post => post.file_url);
        const $layout = $('layout').class('post-grid').type('waterfall').column(5).maxHeight(300).gap(10)
            .content([
                filtered_posts.map(post => new $PostTile(post))
            ]).on('resize', () => { resizeCheck() });
        resizeCheck();
        let FIRST_POST = posts.at(0)!;
        let LAST_POST = posts.at(-1)!;
        let SCROLL_LOADED = false;
        let POST_ENDED = posts.length !== MAX_POST_LENGTH;
        const $loader = $('div').class('loader').content( POST_ENDED ? `It's End` : 'Loading...');
        window.addEventListener('scroll', async () => {
            if (!$layout.inDOM()) return;
            if (POST_ENDED) return;
            if (SCROLL_LOADED) return;
            if (document.documentElement.scrollTop < document.documentElement.scrollHeight - innerHeight * 3) return;
            SCROLL_LOADED = true;
            const posts = await Post.fetchMultiple(booru, tags.length ? {tags: tags, id: `..${LAST_POST.id - 1}`} : {id: `..${LAST_POST.id - 1}`}, MAX_POST_LENGTH)
            $layout.insert(
                posts.filter(post => post.file_url).map(post => new $PostTile(post))
            ).render();
            if (posts.length !== MAX_POST_LENGTH) {
                $loader.content(`It's End`);
                POST_ENDED = true;
            }
            LAST_POST = posts.at(-1)!;
            SCROLL_LOADED = false;
        })

        setInterval(async () => {
            if (!$layout.inDOM()) return;
            if (document.documentElement.scrollTop !== 0) return;
            const posts = await Post.fetchMultiple(booru, tags.length ? {tags: tags, id: `${FIRST_POST.id + 1}..`} : {id: `${FIRST_POST.id + 1}..`}, MAX_POST_LENGTH)
            const filtered_posts = posts.filter(post => post.file_url)
            if (posts.length) FIRST_POST = posts.at(0)!;
            if (filtered_posts.length) $layout.insert(filtered_posts.map(post => new $PostTile(post)), 0).render();
        }, 10_000)

        return {$layout, $loader}

        function resizeCheck() {
            if (innerWidth < 350) $layout.column(1);
            else if (innerWidth < 700) $layout.column(2);
            else {
                const col = Math.round(innerWidth / 300)
                $layout.column(col);
            }
        }
    }

    const gridManager = new Map<string, $PostGrid>();
    record.on('open', async () => {
        const tags = new URL(location.href).searchParams.get('tags') ?? '';
        const $cacheGrid = gridManager.get(tags);
        if ($cacheGrid) {
            $page.content($cacheGrid);
            $cacheGrid.render();
            return;
        } else {
            $page.clear();
        }
        const {$layout, $loader} = await load(tags);
        $page.content([
            $layout,
            $loader
        ]);
        $layout.render();
        gridManager.set(tags, $layout);
        Router.recoveryScrollPosition();
    })
    return $page;
})
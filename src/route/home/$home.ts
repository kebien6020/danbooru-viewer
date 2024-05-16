import { Route } from "@elexis/router";
import { Post } from "../../structure/Post";
import { booru } from "../../main";
import { $PostGrid } from "../../component/PostGrid/$PostGrid";
import { $PostTile } from "../../component/PostTile/$PostTile";

export const home_route = new Route((path) => {
    if (path === '/posts' || path === '/') return '/';
}, ({record}) => {
    const $page = $('page').id('root');
    async function load(tags: string) {
        const posts = await Post.fetchMultiple(booru, tags.length ? {tags: tags} : undefined, 100)
        const $grid = new $PostGrid().content([
          posts.filter(post => post.file_url).map(post => new $PostTile(post))
        ]).on('resize', () => { resizeCheck() });
        resizeCheck();
        return $grid

        function resizeCheck() {
            if (innerWidth < 350) $grid.column(1);
            else if (innerWidth < 700) $grid.column(2);
            else {
                const col = Math.round(innerWidth / 300)
                $grid.column(col);
            }
        }
    }

    const gridManager = new Map<string, $PostGrid>();
    record.on('open', async () => {
        const tags = new URL(location.href).searchParams.get('tags') ?? '';
        const $cacheGrid = gridManager.get(tags);
        if ($cacheGrid) {
            $page.content($cacheGrid);
            $cacheGrid.render()
            return;
        } else {
            $page.clear();
        }
        const $grid = await load(tags);
        $page.content($grid);
        $grid.render();
        gridManager.set(tags, $grid);
    })
    return $page;
})
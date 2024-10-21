import { Post } from "../../structure/Post";
import { ArtistCommentary } from "../../structure/Commentary";
import { Booru } from "../../structure/Booru";
import { ClientUser } from "../../structure/ClientUser";
import { $VideoController } from "../../component/VideoController/$VideoController";
import { $Input } from "elexis/lib/node/$Input";
import { $DetailPanel } from "../../component/DetailPanel/$DetailPanel";
import { PostManager } from "../../structure/PostManager";

export const post_route = $('route').path('/posts/:id?q').id('post').static(false).builder(({$route, params}) => {
    if (!Number(params.id)) return $('h1').content('404: POST NOT FOUND');
    const $video = $('video');
    const events = $.events<{
        viewerPanel_hide: [],
        viewerPanel_show: [],
        viewerPanel_switch: [],
        original_size: [],
        video_play_pause: [],
        post_switch: [Post]
    }>();
    let post: Post, posts: PostManager | undefined;
    events.on('video_play_pause', () => { if ($video.isPlaying) $video.pause(); else $video.play() })
    $.keys($(window)).self($keys => $keys
        .if(e => {
            if ($(e.target) instanceof $Input) return;
            if (!$route.inDOM()) return;
            return true;
        })
        .keydown(['f', 'F'], e => {
            if (Booru.used.user?.favorites.has(post.id)) post.deleteFavorite();
            else post.createFavorite();
        })
        .keydown(' ', e => {
            e.preventDefault();
            if ($video.isPlaying) $video.pause();
            else $video.play();
        })
        .keydown(['a', 'A'], e => navPost('prev') )
        .keydown(['d', 'D'], e => { navPost('next') })
    )

    $route.on('open', ({params, query}) => {
        posts = query.q?.includes('order:') ? undefined : PostManager.get(query.q);
        post = Post.get(Booru.used, +params.id);
        if (posts) {
            if (!posts.orderMap.size || !posts.cache.has(post)) {
                posts.cache.add(post);
                posts.orderMap.set(post.id, post);
                posts.fetchPosts('newer');
                posts.fetchPosts('older');
            } else {
                const ordered = [...posts.orderMap.values()];
                const index = ordered.indexOf(post);
                if (!posts.finished && index > ordered.length - posts.limit / 2) {
                    posts.fetchPosts('older');
                } else if (index === 0) {
                    posts.fetchPosts('newer');
                }
            }
        }
        events.fire('post_switch', post);
    })

    function navPost(dir: 'next' | 'prev') {
        if (!posts) return;
        const orderList = [...posts.orderMap.values()];
        const index = orderList.indexOf(post);
        if (dir === 'prev' && index === 0) return;
        const targetPost = orderList.at(dir === 'next' ? index + 1 : index - 1);
        if (!targetPost) return;
        $.replace(`/posts/${targetPost.id}${posts.tags ? `?q=${posts.tags}` : ''}`)
    }

    return [
        $('div').class('viewer').self(async ($viewer) => {
            $viewer
                .on('pointermove', (e) => {
                    if (e.pointerType === 'mouse' || e.pointerType === 'pen') events.fire('viewerPanel_show');
                })
                .on('pointerup', (e) => {
                    if ( $(':.viewer-panel .panel')?.contains($(e.target)) ) return;
                    if (e.pointerType === 'touch') events.fire('viewerPanel_switch');
                    if (e.pointerType === 'mouse') events.fire('video_play_pause');
                })
                .on('mouseleave', () => {
                    events.fire('viewerPanel_hide');
                })
            events.on('post_switch', async post => {
                await post.ready;
                $viewer.content([
                    $('div').class('viewer-panel').hide(false)
                        .content([
                            $('div').class('panel').content([
                                post.isVideo ? new $VideoController($video, $viewer, post) : null,
                                $('div').class('buttons').content([
                                    $('ion-icon').title('Favorite').name('heart-outline').self($heart => {
                                        ClientUser.events.on('favoriteUpdate', (user) => {
                                            if (user.favorites.has(post.id)) $heart.name('heart');
                                            else $heart.name('heart-outline');
                                        })
                                        if (Booru.used.user?.favorites.has(post.id)) $heart.name('heart');
                                        $heart.on('click', () => {
                                            if (Booru.used.user?.favorites.has(post.id)) post.deleteFavorite();
                                            else post.createFavorite();
                                        })
                                    }),
                                    $('ion-icon').title('Original Size').name('resize-outline').self($original => {
                                        $original.on('click', () => { events.fire('original_size'); $original.disable(true); })
                                        if (!post.isLargeFile || post.isVideo) $original.disable(true);
                                    })
                                ])
                            ]),
                            $('div').class('overlay')
                        ])
                        .self($viewerPanel => {
                            events.on('viewerPanel_hide', () => $viewerPanel.hide(true))
                                .on('viewerPanel_show', () => $viewerPanel.hide(false))
                                .on('viewerPanel_switch', () => $viewerPanel.hide(!$viewerPanel.hide()))
                        }),
                    post.isVideo
                    ? $video.height(post.image_height).width(post.image_width).src(post.file_ext === 'zip' ? post.large_file_url : post.file_url).controls(false).autoplay(true).loop(true).disablePictureInPicture(true)
                    : $('img').height(post.image_height).width(post.image_width).self($img => {
                        $img.once('load', () => 
                            $img.once('load', () => $img.removeClass('loading')).src(post.isLargeFile ? post.large_file_url : post.file_url)
                        ).src(post.preview_file_url)
                        if (!$img.complete) $img.class('loading')
                        events.on('original_size', () => $img.src(post.file_url))
                    })
                ])
            })
        }),
        $('div').class('content').content([
            $('h3').content(`Artist's Commentary`),
            $('section').class('commentary').self(async ($comentary) => {
                events.on('post_switch', async post => {
                    const commentary = (await ArtistCommentary.fetchMultiple(Booru.used, {post: {_id: post.id}})).at(0);
                    $comentary.content([
                        commentary ? [
                            commentary.original_title ? $('h3').content(commentary.original_title) : null,
                            $('pre').content(commentary.original_description)
                        ] : 'No commentary'
                    ])
                })
            })
        ]),
        new $DetailPanel().position($route).self($detail => {
            events.on('post_switch', (post) => $detail.update(post))
        })
    ]
})
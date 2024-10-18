import { Post } from "../../structure/Post";
import { ArtistCommentary } from "../../structure/Commentary";
import { Booru } from "../../structure/Booru";
import { ClientUser } from "../../structure/ClientUser";
import { $VideoController } from "../../component/VideoController/$VideoController";
import { $Input } from "elexis/lib/node/$Input";
import { $DetailPanel } from "../../component/DetailPanel/$DetailPanel";

export const post_route = $('route').path('/posts/:id').id('post').builder(({$route, params}) => {
    if (!Number(params.id)) return $('h1').content('404: POST NOT FOUND');
    const post = Post.get(Booru.used, +params.id);
    const $video = $('video');
    const events = $.events<{
        viewerPanel_hide: [],
        viewerPanel_show: [],
        viewerPanel_switch: [],
        original_size: [],
        video_play_pause: []
    }>();
    $.keys($(window))
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
    return [
        $('div').class('viewer').content(async ($viewer) => {
            events.on('video_play_pause', () => { if ($video.isPlaying) $video.pause(); else $video.play() })
            await post.ready;
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
            return [
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
                : $('img').src(post.isLargeFile ? post.large_file_url : post.file_url).self($img => {
                    events.on('original_size', () => $img.src(post.file_url))
                })
            ]
        }),
        $('div').class('content').content([
            $('h3').content(`Artist's Commentary`),
            $('section').class('commentary').content(async ($comentary) => {
                const commentary = (await ArtistCommentary.fetchMultiple(Booru.used, {post: {_id: post.id}})).at(0);
                return [
                    commentary ? [
                        commentary.original_title ? $('h3').content(commentary.original_title) : null,
                        $('pre').content(commentary.original_description)
                    ] : 'No commentary'
                ]
            })
        ]),
        new $DetailPanel().position($route).update(post)
    ]
})
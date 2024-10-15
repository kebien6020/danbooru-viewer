import { Post } from "../../structure/Post";
import { $Container, type $ContainerContentType } from "elexis";
import { Tag, TagCategory } from "../../structure/Tag";
import { ArtistCommentary } from "../../structure/Commentary";
import { Booru } from "../../structure/Booru";
import type { $IonIcon } from "../../component/IonIcon/$IonIcon";
import { numberFormat } from "../../structure/Util";
import { ClientUser } from "../../structure/ClientUser";
import { $VideoController } from "../../component/VideoController/$VideoController";

export const post_route = $('route').path('/posts/:id').id('post').builder(({$route, params}) => {
    if (!Number(params.id)) return $('h1').content('404: POST NOT FOUND');
    const post = Post.get(Booru.used, +params.id);
    const events = $.events<{
        viewerPanel_hide: [],
        viewerPanel_show: [],
        viewerPanel_switch: [],
        original_size: [],
        video_play_pause: []
    }>();
    return [
        $('div').class('viewer').content(async ($viewer) => {
            const $video = $('video');
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
        $('div').class('sidebar')
            .self($sidebar => {
                let scrollTop = 0;
                addEventListener('scroll', () => { if ($sidebar.inDOM()) scrollTop = document.documentElement.scrollTop }, {passive: true})
                $route
                    .on('beforeShift', () => { if (innerWidth > 800) $sidebar.css({position: `absolute`, top: `calc(${scrollTop}px + var(--nav-height) + var(--padding))`}) })
                    .on('afterShift', () => $sidebar.css({position: '', top: ''}))
            })
            .content([
                $('section').class('post-info').content([
                    new $Property('id').name('Post').content(`#${params.id}`),
                    new $Property('uploader').name('Uploader').content(post.uploader$),
                    new $Property('approver').name('Approver').content(post.approver$),
                    new $Property('date').name('Date').content(post.created_date$),
                    new $Property('size').name('Size').content([post.file_size$, post.dimension$]),
                    new $Property('file-type').name('File Type').content(post.file_ext$),
                    $('div').class('inline').content([
                        new $Property('favorites').name('Favorites').content(post.favcount$),
                        new $Property('score').name('Score').content(post.score$)
                    ]),
                    new $Property('file-url').name('File').content([
                        $('a').href(post.file_url$).content(post.file_url$.convert((value) => value.replace('https://', ''))).target('_blank'),
                        $('ion-icon').name('clipboard').on('click', (e, $ion) => copyButtonHandler($ion, post.file_url))
                    ]),
                    new $Property('source-url').name('Source').content([
                        $('a').href(post.source$).content(post.source$.convert((value) => value.replace('https://', ''))).target('_blank'),
                        $('ion-icon').name('clipboard').on('click', (e, $ion) => copyButtonHandler($ion, post.source))
                    ]),
                    new $Property('booru-url').name(Booru.name$).content([
                        $('a').href(post.booruUrl$).content(post.booruUrl$.convert((value) => value.replace('https://', ''))).target('_blank'),
                        $('ion-icon').name('clipboard').on('click', (e, $ion) => copyButtonHandler($ion, post.booruUrl))
                    ]),
                    new $Property('webm-url').name('Webm').hide(true).self(async ($property) => {
                        await post.ready;
                        if (post.isUgoria) $property.content($('a').href(post.webm_url$).content(post.webm_url$.convert((value) => value.replace('https://', ''))).target('_blank')).hide(false);
                    }),
                ]),
                $('div').class('post-tags').content(async $tags => {
                    const tags = await post.fetchTags();
                    const [artist_tags, char_tags, gen_tags, meta_tags, copy_tags] = [
                        tags.filter(tag => tag.category === TagCategory.Artist),
                        tags.filter(tag => tag.category === TagCategory.Character),
                        tags.filter(tag => tag.category === TagCategory.General),
                        tags.filter(tag => tag.category === TagCategory.Meta),
                        tags.filter(tag => tag.category === TagCategory.Copyright),
                    ]
                    return [
                        $tag_category('Artist', artist_tags),
                        $tag_category('Character', char_tags),
                        $tag_category('Copyright', copy_tags),
                        $tag_category('Meta', meta_tags),
                        $tag_category('General', gen_tags),
                    ]
            
                    function $tag_category(category: string, tags: Tag[]) {
                        return tags.length ? [
                            $('h3').content(category),
                            $('section').content([
                                tags.map(tag => $('div').class('tag').content([
                                    $('a').class('tag-name').content(tag.name).href(`/posts?tags=${tag.name}`),
                                    $('span').class('tag-post-count').content(tag.post_count$.convert(numberFormat))
                                ]))
                            ])
                        ] : null
                    }
                })
            ])  
    ]
})

function copyButtonHandler($ion: $IonIcon, text: string) {
    $ion.name('checkmark');
    navigator.clipboard.writeText(text);
    setTimeout(() => $ion.name('clipboard'), 3000);
}

class $Property extends $Container {
    $name = $('span').class('property-name')
    $values = $('div').class('property-values')
    constructor(id: string) {
        super('div');
        this.staticClass('property').attribute('property-id', id);
        super.content([
            this.$name,
            this.$values.hide(true)
        ])
    }

    name(content: $ContainerContentType) {
        this.$name.content(content);
        return this;
    }

    content(content: OrMatrix<$ContainerContentType>) {
        this.$values.hide(false);
        const list = $.orArrayResolve(content);
        this.$values.content(list.map($item => $('span').staticClass('property-value').content($item)));
        return this;
    }
}
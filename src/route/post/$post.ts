import { Post } from "../../structure/Post";
import { $Container, type $ContainerContentType } from "elexis";
import { Tag, TagCategory } from "../../structure/Tag";
import { ArtistCommentary } from "../../structure/Commentary";
import { Booru } from "../../structure/Booru";

export const post_route = $('route').path('/posts/:id').id('post').builder(({$route, params}) => {
    if (!Number(params.id)) return $('h1').content('404: POST NOT FOUND');
    const post = Post.get(Booru.used, +params.id);
    return [
        $('div').class('viewer').content(async () => {
            await post.ready;
            return post.isVideo
                ? $('video').height(post.image_height).width(post.image_width).src(post.file_ext === 'zip' ? post.large_file_url : post.file_url).controls(true).autoplay(true).loop(true).disablePictureInPicture(true)
                : $('img').src(post.large_file_url)//.once('load', (e, $img) => { $img.src(post.file_url)})
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
                addEventListener('scroll', () => { if ($sidebar.inDOM()) scrollTop = document.documentElement.scrollTop })
                $route
                    .on('beforeShift', () => { if (innerWidth > 800) $sidebar.css({position: `absolute`, top: `calc(${scrollTop}px + var(--nav-height) + var(--padding))`}) })
                    .on('afterShift', () => $sidebar.css({position: '', top: ''}))
            })
            .content([
                $('section').class('post-info').content([
                    new $Property('id').name('Post').value(`#${params.id}`),
                    new $Property('uploader').name('Uploader').value(post.uploader$),
                    new $Property('approver').name('Approver').value(post.approver$),
                    new $Property('date').name('Date').value(post.created_date$),
                    new $Property('size').name('Size').value([post.file_size$, post.dimension$]),
                    new $Property('file').name('File Type').value(post.file_ext$),
                    $('div').class('inline').content([
                        new $Property('favorites').name('Favorites').value(post.favorites$),
                        new $Property('score').name('Score').value(post.score$)
                    ]),
                    $('div').class('buttons').content([
                        $('icon-button').class('vertical').icon('link-outline').content(Booru.name$)
                            .on('click', (e, $button) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(`${Booru.used.origin}${location.pathname}`);
                                $button.content('Copied!');
                                setTimeout(() => {
                                    $button.content(Booru.name$)
                                }, 2000);
                            }),
                        $('icon-button').class('vertical').icon('link-outline').content(`File`)
                            .on('click', (e, $button) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(post.file_url);
                                $button.content('Copied!');
                                setTimeout(() => {
                                    $button.content('File')
                                }, 2000);
                            }),
                        $('icon-button').class('vertical').icon('link-outline').content(`Webm`)
                            .on('click', (e, $button) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(post.previewURL);
                                $button.content('Copied!');
                                setTimeout(() => {
                                    $button.content('Webm')
                                }, 2000);
                            })
                            .hide(true).self(async ($button) => { await post.ready; if (post.file_ext === 'zip') $button.hide(false) })
                    ]),
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
                                    $('span').class('tag-post-count').content(tag.post_count$)
                                ]))
                            ])
                        ] : null
                    }
                })
            ])  
    ]
})

class $Property extends $Container {
    $name = $('span').class('property-name')
    $values = $('div').class('property-values')
    constructor(id: string) {
        super('div');
        this.staticClass('property').attribute('property-id', id);
        this.content([
            this.$name,
            this.$values
        ])
    }

    name(content: $ContainerContentType) {
        this.$name.content(content);
        return this;
    }

    value(content: OrMatrix<$ContainerContentType>) {
        const list = $.orArrayResolve(content);
        this.$values.content(list.map($item => $('span').staticClass('property-value').content($item)));
        return this;
    }
}
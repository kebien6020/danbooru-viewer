import { Post } from "../../structure/Post";
import { $Container, type $ContainerContentType } from "elexis";
import { Tag, TagCategory } from "../../structure/Tag";
import { ArtistCommentary } from "../../structure/Commentary";
import { Booru } from "../../structure/Booru";

export const post_route = $('route').path('/posts/:id').id('post').builder(({$route, params}) => {
    if (!Number(params.id)) return '404';
    const post = new Post(Booru.used, +params.id);
    const ele = {
        $viewer: $('div').class('viewer'),
        $tags: $('div').class('post-tags'),
        $commentary: $('section').class('commentary')
    }
    load();
    async function load() {
        await post.fetch();
        ele.$viewer.content([
            post.isVideo
                ? $('video').src(post.file_ext === 'zip' ? post.large_file_url : post.file_url).controls(true)
                : $('img').src(post.large_file_url)//.once('load', (e, $img) => { $img.src(post.file_url)})
        ])
        loadTags();
        loadCommentary();

        async function loadTags() {
            const tags = await post.fetchTags();
            const [artist_tags, char_tags, gen_tags, meta_tags, copy_tags] = [
                tags.filter(tag => tag.category === TagCategory.Artist),
                tags.filter(tag => tag.category === TagCategory.Character),
                tags.filter(tag => tag.category === TagCategory.General),
                tags.filter(tag => tag.category === TagCategory.Meta),
                tags.filter(tag => tag.category === TagCategory.Copyright),
            ]
            ele.$tags.content([
                tag_category('Artist', artist_tags),
                tag_category('Character', char_tags),
                tag_category('Copyright', copy_tags),
                tag_category('Meta', meta_tags),
                tag_category('General', gen_tags),
            ])
    
            function tag_category(category: string, tags: Tag[]) {
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
        }
        async function loadCommentary() {
            const commentary = (await ArtistCommentary.fetchMultiple(Booru.used, {post: {_id: post.id}})).at(0);
            if (!commentary) return ele.$commentary.content('No commentary');
            ele.$commentary.content([
                commentary.original_title ? $('h3').content(commentary.original_title) : null,
                $('pre').content(commentary.original_description)
            ])
        }
    }
    return [
        ele.$viewer,
        $('div').class('content').content([
            $('h3').content(`Artist's Commentary`),
            ele.$commentary.content('loading...')
        ]),
        $('div').class('sidebar').content([
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
                $('button').content('Copy link')
                    .on('click', (e, $button) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(`${Booru.used.origin}${location.pathname}`);
                        $button.content('Copied!');
                        setTimeout(() => {
                            $button.content('Copy link')
                        }, 2000);
                    })
            ]),
            ele.$tags.content('loading...')
        ]).self($sidebar => {
            let scrollTop = 0;
            addEventListener('scroll', () => { if ($sidebar.inDOM()) scrollTop = document.documentElement.scrollTop })
            $route
                .on('beforeShift', () => { if (innerWidth > 800) $sidebar.css({position: `absolute`, top: `${scrollTop}px`}) })
                .on('afterShift', () => $sidebar.css({position: '', top: ''}))
        })
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
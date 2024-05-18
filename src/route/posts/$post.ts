import { Route } from "@elexis/router";
import { Post } from "../../structure/Post";
import { booru } from "../../main";
import { $Container, type $ContainerContentType } from "elexis";
import { digitalUnit } from "../../structure/Util";
import { Tag, TagCategory } from "../../structure/Tag";
import { ArtistCommentary } from "../../structure/Commentary";

export const posts_route = new Route('/posts/:id', ({params}) => {
    if (!Number(params.id)) return '404';
    const ele = {
        $viewer: $('div').class('viewer'),
        $tags: $('div').class('post-tags'),
        $commentary: $('section').class('commentary')
    }
    const value = {
        uploader$: $.state<string|number>('loading...'),
        approver$: $.state<string|number>('loading...'),
        date$: $.state('loading...'),
        size$: $.state('loading...'),
        dimension$: $.state(`loading...`),
        favorites$: $.state(0),
        score$: $.state(0),
        ext$: $.state(`loading...`),
    }
    async function load() {
        const post = Post.manager.get(+params.id) ?? await Post.fetch(booru, +params.id);
        ele.$viewer.content([
            post.isVideo
                ? $('video').src(post.file_url).controls(true)
                : $('img').src(post.large_file_url).once('load', (e, $img) => { $img.src(post.file_url)})
        ])
        value.uploader$.set(post.uploader$);
        value.approver$.set(post.approver$);
        value.date$.set(post.created_date$);
        value.size$.set(digitalUnit(post.file_size));
        value.dimension$.set(`${post.image_width}x${post.image_height}`)
        value.favorites$.set(post.favorites$)
        value.score$.set(post.score$)
        value.ext$.set(post.file_ext.toUpperCase())
        loadTags();
        async function loadTags() {
            const tags = await Tag.fetchMultiple(booru, {name: {_space: post.tag_string}});
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
                const INTL_number = new Intl.NumberFormat('en', {notation: 'compact'})
                return tags.length ? [
                    $('h3').content(category),
                    $('section').content([
                        tags.map(tag => $('div').class('tag').content([
                            $('a').class('tag-name').content(tag.name).href(`/posts?tags=${tag.name}`),
                            $('span').class('tag-post-count').content(`${INTL_number.format(tag.post_count)}`)
                        ]))
                    ])
                ] : null
            }
        }
        loadCommentary();
        async function loadCommentary() {
            const commentary = (await ArtistCommentary.fetchMultiple(booru, {post: {_id: post.id}})).at(0);
            if (!commentary) return ele.$commentary.content('No commentary');
            ele.$commentary.content([
                commentary.original_title ? $('h3').content(commentary.original_title) : null,
                $('pre').content(commentary.original_description)
            ])
        }
    }

    load();
    return $('page').id('post').content([
        $('div').class('main').content([
            ele.$viewer,
            $('h3').content(`Artist's Commentary`),
            ele.$commentary.content('loading...')
        ]),
        $('div').class('sidebar').content([
            $('section').class('post-info').content([
                new $Property('id').name('Post').value(`#${params.id}`),
                new $Property('uploader').name('Uploader').value(value.uploader$),
                new $Property('approver').name('Approver').value(value.approver$),
                new $Property('date').name('Date').value(value.date$),
                new $Property('size').name('Size').value([value.size$, value.dimension$]),
                new $Property('file').name('File Type').value(value.ext$),
                $('div').class('inline').content([
                    new $Property('favorites').name('Favorites').value(value.favorites$),
                    new $Property('score').name('Score').value(value.score$)
                ]),
                $('a').content('Copy link').href(`${booru.api}${location.pathname}`).on('click', (e, $a) => {
                    navigator.clipboard.writeText($a.href());
                    $a.content('Copied!');
                    setTimeout(() => {
                        $a.content('Copy link')
                    }, 2000);
                })
            ]),
            ele.$tags.content('loading...')
        ])
    ])
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
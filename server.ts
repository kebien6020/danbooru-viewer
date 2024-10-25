import cors from "@elysiajs/cors";
import Elysia from "elysia";
import * as cheerio from 'cheerio';
import html from "@elysiajs/html";
import type { PostData } from "./src/structure/Post";
const list_format = new Intl.ListFormat('en', {type: 'conjunction', style: 'long'})
const app = new Elysia()
    .use(cors())
    .use(html())
    .get('*', async ({path}) => {
        const $ = cheerio.load(Buffer.from(await Bun.file('./dist/index.html').arrayBuffer()));
        if (path.match(/posts\/(\d+)/)) {
            const post_id = path.match(/posts\/(\d+)/)?.at(1);
            const data = await fetch(`https://danbooru.donmai.us/posts/${post_id}.json`).then(res => res.json()) as PostData;
            switch (data.file_ext) {
                case 'png':
                case 'webp':
                case 'jpg':
                case 'gif': {
                    $('head')
                        .append(og("og:image", data.file_url))
                        .append(og("og:image:secure_url", data.file_url))
                        .append(og('og:image:type', `image/${data.file_ext}`))
                        .append(og('og:image:height', data.image_height.toString()))
                        .append(og('og:image:width', data.image_width.toString()))
                        .append(og('twitter:image', data.file_url))
                    break;
                }
                case 'zip': $('head').append(og("og:video", data.media_asset.variants.find(v => v.file_ext === 'webm')?.url ?? '')); break;
                case 'mp4':
                case 'webm': {
                    $('head')
                        .append(og("og:video", data.file_url))
                        .append(og("og:video:secure_url", data.file_url)) 
                        .append(og("og:video:type", `video/${data.file_ext}`)) 
                        .append(og("og:video:height", data.image_height.toString())) 
                        .append(og("og:video:width", data.image_width.toString())) 
                        .append(og("og:image", data.media_asset.variants.find(v => v.file_ext === 'webp')?.url ?? '')) 
                    break;
                }
            }
            const byArtist = `${list_format.format(data.tag_string_artist.split(' '))}`;
            const characters = data.tag_string_character.split(' ').map(str => {
                const matched = str.match(/([a-z-_]+)(?:\((\w+)\))?/)
                console.debug(str)
                return matched?.at(1)?.replaceAll('_', ' ')
            }).filter(str => str !== undefined);
            const copyrights = data.tag_string_copyright.split(' ').map(str => {
                const matched = str.match(/([a-z-_]+)(?:\((\w+)\))?/)
                return matched?.at(1)?.replaceAll('_', ' ')
            }).filter(str => str !== undefined);
            const copyright0 = copyrights.at(0);
            const title = `${list_format.format(characters)}${copyright0 ? ` (${copyright0}${copyrights.length > 1 ? ` and ${copyrights.length - 1} more` : ''})` : '' }${byArtist ? ` drawn by ${byArtist}` : ''} | Danbooru Viewer`;
            const description = `${data.file_ext.toUpperCase()} | ${data.image_width}x${data.image_height} | ${digitalUnit(data.file_size)}`;
            $('head')
                .append(og('og:title', title))
                .append(og('og:description', description))
                .append(og('og:site_name', 'Danbooru Viewer'))
                .append(og('og:type', 'website'))
                .append(og('og:url', `https://danbooru.defaultkavy.com/${path}`))
                .append(og('twitter:site', '@defaultkavy_dev'))
                .append(og('twitter:title', title))
                .append(og('twitter:description', description))
                .append(og('twitter:card', 'summary_large_image'))
        }
        return $.html()
    })
    .get('/assets/*', (res) => {
        return Bun.file(`./dist/${res.path}`)
    })
    .group('/api', app => { return app
        .delete('/favorites/:id', async ({params, query}) => {
            const data = await fetch(`${query.origin}/favorites/${params.id}.json?login=${query.login}&api_key=${query.api_key}`, {method: "DELETE"}).then(res => res.ok);
            return data
        })
    })
    .get('/statics/*', (res => {
        return Bun.file(`./dist/${res.path}`)
    }))
    .listen(3030);
console.log('Start listening: 3030')
export type Server = typeof app;

function og(property: string, content: string | undefined) {
    return `<meta property=${property} content="${content ?? ''}">`
}

export function digitalUnit(bytes: number) {
    if (bytes < 1000) return `${bytes}B`
    const kb = bytes / 1000;
    if (kb < 1000) return `${kb.toFixed(2)}kB`;
    const mb = bytes / (1000 ** 2);
    if (mb < 1000) return `${mb.toFixed(2)}MB`;
    const gb = bytes / (1000 ** 3);
    if (gb < 1000) return `${gb.toFixed(2)}GB`;
    const tb = bytes / (1000 ** 4);
    if (tb < 1000) return `${tb.toFixed(2)}TB`;
    const pb = bytes / (1000 ** 5);
    if (pb < 1000) return `${pb.toFixed(2)}PB`;
    const eb = bytes / (1000 * 6);
    return `${eb.toFixed(2)}EB`;
}
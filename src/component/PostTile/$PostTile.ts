import { $Container, $State, $Video } from "elexis";
import type { Post } from "../../structure/Post";
import { time } from "../../structure/Util";
export class $PostTile extends $Container {
    post: Post;
    $video: $Video | null;
    duration$ = $.state(``);
    constructor(post: Post) {
        super('post-tile');
        this.post = post;
        this.$video = this.post.isVideo ? $('video').width(this.post.image_width).height(this.post.image_height).disablePictureInPicture(true).loop(true).muted(true).hide(true) : null;
        this.attribute('filetype', this.post.file_ext);
        this.durationUpdate();
        this.build();
    }

    build() {
        let timer: Timer
        this.$video?.on('playing', (e, $video) => {
            timer = setInterval(() => {
                this.durationUpdate();
            }, 500)
        })
        this.$video?.on('pause', () => {
            clearInterval(timer);
            this.durationUpdate();
        })
        this.content([
            this.post.isVideo ? $('span').class('duration').content(this.duration$) : null,
            $('a').href(this.post.pathname).content(() => [
                this.$video,
                $('img').css({opacity: '0'}).width(this.post.image_width).height(this.post.image_height).src(this.post.preview_file_url).loading('lazy')
                    .once('load', (e, $img) => {
                        if (!this.post.isVideo) $img.src(this.post.large_file_url);
                        $img.animate({opacity: [0, 1]}, {duration: 300, fill: 'both'});
                    })
            ])
            .on('mouseenter', () => {
                if (!this.$video?.isPlaying) {
                    this.$video?.src(this.post.large_file_url).hide(false).play().catch(err => undefined)
                }
            })
            .on('mouseleave', () => {
                this.$video?.pause().currentTime(0).hide(true);
            })
        ])
    }

    durationUpdate() {
        if (!this.$video) return;
        const t = time(this.post.media_asset.duration * 1000 - this.$video.currentTime() * 1000)
        this.duration$.set(`${t.hh}:${t.mm}:${t.ss}`)
    }
}
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
        this.class('loading').content([
            // Video Detail
            this.post.isVideo 
                ? $('div').class('video-detail').content([
                    this.post.hasSound ? $('ion-icon').name('volume-medium-outline') : null,
                    $('span').class('duration').content(this.duration$) 
                ]) : null,
            // Tile
            $('a').href(this.post.pathname).content(() => [
                this.$video,
                $('img').draggable(false).css({opacity: '0'}).width(this.post.image_width).height(this.post.image_height).src(this.post.previewURL).loading('lazy')
                    .on('mousedown', (e) => e.preventDefault())
                    .once('load', (e, $img) => {
                        if (!this.post.isVideo) $img.src(this.post.previewURL);
                        $img.animate({opacity: [0, 1]}, {duration: 300, fill: 'both'});
                        this.removeClass('loading')
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
                .on('touchstart', () => {
                    if (!this.$video?.isPlaying) {
                        this.$video?.src(this.post.large_file_url).hide(false).play().catch(err => undefined)
                    }
                })
                .on('touchend', () => {
                    this.$video?.pause().currentTime(0).hide(true);
                })
        ])
    }

    durationUpdate() {
        if (!this.$video) return;
        const t = time(this.post.media_asset.duration * 1000 - this.$video.currentTime() * 1000)
        this.duration$.set(Number(t.hh) > 0 ? `${t.hh}:${t.mm}:${t.ss}` : `${t.mm}:${t.ss}`)
    }
}
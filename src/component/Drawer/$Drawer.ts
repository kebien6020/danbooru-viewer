import { $Container } from "elexis";
import { Booru } from "../../structure/Booru";
import { numberFormat } from "../../modules";

export class $Drawer extends $Container {
    $filter = $('div').class('filter');
    $container = $('div').class('drawer-container')
    constructor() {
        super('drawer');
        this.hide(true);
        this.build();
    }

    private build() {
        this.content([
            this.$container.content([
                $('div').class('user-info').hide(true).self(($div) => [
                    Booru.events
                        .on('login', (user) => {
                            $div.content([
                                $('div').content([
                                    $('h3').class('username').content(user.name$),
                                    $('div').class('user-detail').content([
                                        $('span').class('userid').content(`ID: ${user.id}`),
                                        $('span').class('level').content(['Level: ', user.level_string$])
                                    ])
                                ]),//.on('click', () => $.replace(user.url)),
                                $('div').class('user-nav').content([
                                    $('icon-button').title('Uploaded Posts').icon('image').content(user.post_upload_count$.convert(numberFormat)).link(`/posts?tags=user:${user.name}`, true),
                                    $('icon-button').title('Favorites').icon('heart').content(user.favorite_count$.convert(numberFormat)).link(`/posts?tags=ordfav:${user.name}`, true),
                                    $('icon-button').title('Forum Posts').icon('document-text').content(user.forum_post_count$.convert(numberFormat)).hide(true),
                                ])
                            ]).hide(false);
                        })
                        .on('logout', () => {
                            $div.clear().hide(true);
                        })
                ]),
                $('div').class('nav').content([
                    $('div').class('login')
                        .content([ $('icon-button').icon('log-in-outline').content('Login').link('/login', true) ])
                        .self(($div => Booru.events.on('login', () => $div.hide(true)).on('logout', () => $div.hide(false)))),
                    $('div').class('logout').hide(true)
                        .content([ $('icon-button').icon('log-in-outline').content('Logout').on('dblclick', () => Booru.used.logout()) ])
                        .self(($div => Booru.events.on('login', () => $div.hide(false)).on('logout', () => $div.hide(true)))),
                ])
            ]),
            this.$filter.on('click', () => $.back())
        ])
    }

    open() { if (location.hash !== '#drawer') $.open(location.href + '#drawer'); return this; }
    close() { if (location.hash === '#drawer') $.back(); return this; }

    private activate() {
        this.hide(false);
        this.$container.animate({
            transform: [`translateX(100%)`, `translateX(0%)`]
        }, {
            fill: 'both',
            duration: 300,
            easing: 'ease'
        })
        this.$filter.animate({
            opacity: [0, 1]
        }, {
            fill: 'both',
            duration: 300,
            easing: 'ease'
        })
    }

    private inactivate() {
        this.$container.animate({
            transform: [`translateX(0%)`, `translateX(100%)`]
        }, {
            fill: 'both',
            duration: 300,
            easing: 'ease'
        }, () => this.hide(true))
        this.$filter.animate({
            opacity: [1, 0]
        }, {
            fill: 'both',
            duration: 300,
            easing: 'ease'
        })
    }

    checkURL(beforeURL: URL | undefined, afterURL: URL) {
        if (beforeURL?.hash === '#drawer') this.close();
        if (afterURL.hash === '#drawer') this.open();
    }
}
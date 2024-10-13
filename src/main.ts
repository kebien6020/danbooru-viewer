import 'elexis';
import '@elexis/layout';
import '@elexis/router';
import { Booru, type BooruOptions } from './structure/Booru';
import { post_route } from './route/post/$post_route';
import { $PostGrid } from './component/PostGrid/$PostGrid';
import { $Router, $RouterNavigationDirection } from '@elexis/router';
import { $Searchbar } from './component/Searchbar/$Searchbar';
import { $IonIcon } from './component/IonIcon/$IonIcon';
import { $IconButton } from './component/IconButton/$IconButton';
import { $login_route } from './route/login/$login_route';
import { $Drawer } from './component/Drawer/$Drawer';
// declare elexis module
declare module 'elexis' {
  export namespace $ {
      export interface TagNameElementMap {
        'ion-icon': typeof $IonIcon;
        'icon-button': typeof $IconButton;
      } 
  }
}
$.registerTagName('ion-icon', $IonIcon)
$.registerTagName('icon-button', $IconButton)
$.anchorHandler = ($a) => { $.open($a.href(), $a.target())}
// settings
export const [danbooru, safebooru]: Booru[] = [
  new Booru({ origin: 'https://danbooru.donmai.us', name: 'Danbooru' }),
  new Booru({ origin: 'https://safebooru.donmai.us', name: 'Safebooru' }),
  new Booru({ origin: 'https://testbooru.donmai.us', name: 'Testbooru' }),
]
Booru.set(Booru.manager.get(Booru.storageAPI ?? '') ?? danbooru);
const $searchbar = new $Searchbar().hide(true);
const $drawer = new $Drawer();

// render
$(document.body).content([
  // Navigation Bar
  $('nav').content([
    // Title
    $('a').class('title').href('/').content([
      $('h1').class('booru-name').content(Booru.name$),
      $('h2').class('app').content([
        $('span').class('app-name').content(`Viewer`),
        $('span').class('version').content(`v${__APP_VERSION__}`)
      ])
    ]),
    // Searchbar
    $('div').class('searchbar').content(['Search in ', Booru.name$])
      .self($self => $Router.events.on('stateChange', ({beforeURL, afterURL}) => {if (beforeURL.hash === '#search') $self.hide(false); if (afterURL.hash === '#search') $self.hide(true)}))
      .on('click', () => $searchbar.open()),
    // Buttons
    $('div').class('buttons').content([
      // Search Icon
      $('ion-icon').class('search').name('search-outline').title('Search')
        .self($self => $Router.events.on('stateChange', ({beforeURL, afterURL}) => {if (beforeURL.hash === '#search') $self.hide(false); if (afterURL.hash === '#search') $self.hide(true)}))
        .on('click', () => $searchbar.open()),
      // Open Booru
      $('a').content($('ion-icon').class('open').name('open-outline').title('Open in Original Site')).href(location.href.replace(location.origin, Booru.used.origin)).target('_blank'),
      // Copy Button
      $('ion-icon').class('copy').name('link-outline').title('Copy Page Link').hide(false)
        .on('click', (e, $copy) => {
          navigator.clipboard.writeText(`${location.origin}${location.pathname}${location.search}`)
          $copy.name('checkmark-outline');
          setTimeout(() => {
            $copy.name('link-outline')
          }, 2000);
        }),
      // Menu Button
      $('ion-icon').class('menu').name('menu-outline').title('Menu').hide(false)
        .self(($icon) => { Booru.events.on('login', () => $icon.hide(true)).on('logout', () => $icon.hide(false)) })
        .on('click', () => $.open(location.href + '#drawer')),
      // Account Menu
      $('div').class('account').hide(true).title('Menu')
        .self(($account) => {
          Booru.events
            .on('login', user => { $account.content(user.name$.convert(value => value.at(0)?.toUpperCase() ?? '')).hide(false); })
            .on('logout', () => $account.hide(true))
        })
        .on('click', () => $drawer.open())
    ])
  ]),
  // Searchbar
  $searchbar,
  // Drawer
  $drawer,
  // Base Router
  $('router').base('/').map([
    // Home Page
    $('route').id('posts').path(['/', '/posts']).builder(() => new $PostGrid()),
    // Posts Page
    $('route').id('posts').path('/posts?tags').builder(({query}) => {
      const $postGrid = new $PostGrid({tags: query.tags});
      return [
        $('header').content([
          $('h2').content('Posts'),
          $('div').class('tags').self($div => {
            query.tags.split('+').forEach(tag => {
              $div.insert($('a').class('tag').content(decodeURIComponent(tag)).href(`posts?tags=${tag}`))
            })
          })
        ]),
        $('div').class('no-post').hide(true).self($div => {
          $div.on('startLoad', () => $div.hide(true))
          $postGrid
            .on('noPost', () => $div.hide(false).content('No Posts'))
            .on('post_error', message => $div.hide(false).content(message))
        }),
        $postGrid
      ]
    }),
    // Post Page
    post_route,
    // Login Page
    $login_route
  ]).on('beforeSwitch', (e) => {
    const DURATION = 300;
    const TX = 2;
    e.preventDefault();
    function intro() {
      const transform = $.call(() => {
        switch ($Router.navigationDirection) {
          case $RouterNavigationDirection.Forward: return [`translateX(${TX}%)`, `translateX(0%)`];
          case $RouterNavigationDirection.Back: return [`translateX(-${TX}%)`, `translateX(0%)`];
          case $RouterNavigationDirection.Replace: return '';
        }
      })
      e.$view.content(e.nextContent);
      e.rendered();
      e.nextContent.element?.class('animated').animate({
        opacity: [0, 1],
        transform
      }, {
        duration: DURATION,
        easing: 'ease'
      }, () => {
        e.switched();
        e.nextContent.element?.removeClass('animated')
      })
    }
    function outro() {
      const transform = $.call(() => {
        switch ($Router.navigationDirection) {
          case $RouterNavigationDirection.Forward: return [`translateX(0%)`, `translateX(-${TX}%)`];
          case $RouterNavigationDirection.Back: return [`translateX(0%)`, `translateX(${TX}%)`];
          case $RouterNavigationDirection.Replace: return '';
        }
      })

      e.previousContent?.element?.class('animated').animate({
        opacity: [1, 0],
        transform
      }, {
        duration: DURATION,
        easing: 'ease'
      }, () => {
        e.previousContent?.element?.removeClass('animated');
        intro();
      })
    }

    if (e.previousContent) outro();
    else intro();
  })
])

$Router.events.on('stateChange', ({beforeURL, afterURL}) => componentState(beforeURL, afterURL))
componentState(undefined, new URL(location.href))

function componentState(beforeURL: URL | undefined, afterURL: URL) {
  $searchbar.checkURL(beforeURL, afterURL); $drawer.checkURL(beforeURL, afterURL)
}
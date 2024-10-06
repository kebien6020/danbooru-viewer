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
if (location.hash === '#search') $searchbar.activate();
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
      .on('click', () => $.open(location.href + '#search')),
    // Buttons
    $('div').class('buttons').content([
      // Search Icon
      $('ion-icon').class('search').name('search-outline').title('Search')
        .self($self => $Router.events.on('stateChange', ({beforeURL, afterURL}) => {if (beforeURL.hash === '#search') $self.hide(false); if (afterURL.hash === '#search') $self.hide(true)}))
        .on('click', () => $.open(location.href + '#search')),
      // Switch Booru
      $('ion-icon').class('switch').name('swap-horizontal').title('Switch Booru')
        .on('click', () => {
          if (Booru.used === danbooru) Booru.set(safebooru);
          else Booru.set(danbooru);
        }),
      // Open Booru
      $('ion-icon').class('open').name('open-outline').title('Open in Original Site')
        .on('click', () => $.open(location.href.replace(location.origin, Booru.used.origin))),
    ])
  ]),
  // Searchbar
  $searchbar,
  // Base Router
  $('router').base('/').map([
    // Home Page
    $('route').id('posts').path('/').builder(() => new $PostGrid()),
    // Posts Page
    $('route').id('posts').path('/posts?tags').builder(({query}) => new $PostGrid({tags: query.tags})),
    // Post Page
    post_route
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

$Router.events.on('stateChange', ({beforeURL, afterURL}) => { $searchbar.checkURL(beforeURL, afterURL) })
import 'elexis';
import '@elexis/layout';
import '@elexis/router';
import { Booru, type BooruOptions } from './structure/Booru';
import { post_route } from './route/post/$post';
import { $PostGrid } from './component/PostGrid/$PostGrid';
import { $Router, $RouterNavigationDirection } from '@elexis/router';
import { $Searchbar } from './component/Searchbar/$Searchbar';
import { $IonIcon } from './component/IonIcon/$IonIcon';
// declare elexis module
declare module 'elexis' {
  export namespace $ {
      export interface TagNameElementMap {
        'ion-icon': typeof $IonIcon
      } 
  }
}
$.registerTagName('ion-icon', $IonIcon)
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
    $('div').class('title').content([
      $('a').class('booru-name').content([$('h1').content(Booru.name$)]).href('/'),
      $('a').class('version').target('_blank').content(`v${__APP_VERSION__}`).href(`https://git.defaultkavy.com/defaultkavy/danbooru-viewer`)
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
      // Switch Button
      $('ion-icon').class('switch').name('swap-horizontal').title('Switch Booru')
        .on('click', () => {
          if (Booru.used === danbooru) Booru.set(safebooru);
          else Booru.set(danbooru);
        })
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
    e.preventDefault();
    function intro() {
      e.$view.content(e.nextContent);
      e.rendered();
      e.nextContent.element?.class('animated').animate({
        opacity: [0, 1],
        transform: $Router.navigationDirection === $RouterNavigationDirection.Forward ? [`translateX(40%)`, `translateX(0%)`] : [`translateX(-40%)`, `translateX(0%)`]
      }, {
        duration: DURATION,
        easing: 'ease'
      }, () => {
        e.switched();
        e.nextContent.element?.removeClass('animated')
      })
    }
    function outro() {
      e.previousContent?.element?.class('animated').animate({
        opacity: [1, 0],
        transform: $Router.navigationDirection === $RouterNavigationDirection.Forward ? [`translateX(0%)`, `translateX(-40%)`] : [`translateX(0%)`, `translateX(40%)`]
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
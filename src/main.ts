import 'elexis';
import '@elexis.js/layout';
import '@elexis.js/router';
import { Booru } from './structure/Booru';
import { post_route } from './route/post/$post_route';
import { $PostGrid } from './component/PostGrid/$PostGrid';
import { $Page, $Route, $Router, $RouterAnchor, $RouterNavigationDirection } from '@elexis.js/router';
import { $Searchbar } from './component/Searchbar/$Searchbar';
import { $IonIcon } from './component/IonIcon/$IonIcon';
import { $IconButton } from './component/IconButton/$IconButton';
import { $login_route } from './route/login/$login_route';
import { $Drawer } from './component/Drawer/$Drawer';
import { $Input } from 'elexis/lib/node/$Input';
import { $DetailPanel } from './component/DetailPanel/$DetailPanel';
import { $PostTile } from './component/PostTile/$PostTile';
import { LocalSettings } from './structure/LocalSettings';
// declare elexis module
declare module 'elexis' {
  export namespace $ {
      export interface TagNameElementMap {
        'ion-icon': typeof $IonIcon;
        'icon-button': typeof $IconButton;
        'a': typeof $RouterAnchor;
      } 
  }
}
$.registerTagName('ion-icon', $IonIcon)
$.registerTagName('icon-button', $IconButton)
$.registerTagName('a', $RouterAnchor)
// settings
export const [danbooru, safebooru]: Booru[] = [
  new Booru({ origin: 'https://danbooru.donmai.us', name: 'Danbooru' }),
  new Booru({ origin: 'https://safebooru.donmai.us', name: 'Safebooru' }),
  new Booru({ origin: 'https://testbooru.donmai.us', name: 'Testbooru' }),
]
Booru.set(Booru.manager.get(Booru.storageAPI ?? '') ?? danbooru);
const $searchbar = new $Searchbar().hide(true);
const $drawer = new $Drawer();
export const previewPanelEnable$ = $.state(LocalSettings.previewPanelEnabled ?? false).on('update', ({state$}) => LocalSettings.previewPanelEnabled = state$.value)
export const detailPanelEnable$ = $.state(LocalSettings.detailPanelEnabled ?? true).on('update', ({state$}) => LocalSettings.detailPanelEnabled = state$.value)

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
      // Detail Panel Button
      $('ion-icon').class('detail-panel').name('reader-outline').title('Toggle Detail Panel').on('click', () => {
        if ($(':page#posts')) previewPanelEnable$.set(!previewPanelEnable$.value)
        else if ($(':page#post')) detailPanelEnable$.set(!detailPanelEnable$.value)
      }),
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
    $('route').path(['/', '/posts']).builder(({$page, query}) => {
      const { $postGrid, $detail } = $postsPageComponents($page, query);
      return $page.id('posts').content([ $postGrid, $detail ]);
    }),
    // Posts Page
    $('route').path('/posts?tags').builder(({$page, query}) => {
      const { $postGrid, $detail } = $postsPageComponents($page, query)
      return $page.id('posts').content([
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
          $postGrid.self(() => {
            $postGrid.posts.events
              .on('noPost', () => $div.hide(false).content('No Posts'))
              .on('post_error', message => $div.hide(false).content(message))
          })
        }),
        $postGrid,
        $detail
      ])
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
      $(document.documentElement).css({scrollBehavior: 'auto'});
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
        $(document.documentElement).css({scrollBehavior: ''});
        e.nextContent.element?.removeClass('animated')
      })
    }
    function outro() {
      $(document.documentElement).css({scrollBehavior: 'auto'});
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

function $postsPageComponents($page: $Page, query: {tags?: string}) {
  const $postGrid = new $PostGrid(query);
  const $previewPanel = new $DetailPanel({preview: true, tagsType: 'name_only'}).hide(previewPanelEnable$.convert(bool => !bool)).position($page);
  detailPanelCheck();
  previewPanelEnable$.on('update', detailPanelCheck);
  Booru.events.on('set', () => $previewPanel.update(null));
  function detailPanelCheck() { previewPanelEnable$.value ? $postGrid.addClass('detail-panel-enabled') : $postGrid.removeClass('detail-panel-enabled') }
  $postGrid.$focus
    .on('focus', ({$focused: $target}) => {if ($target.inDOM() && $target instanceof $PostTile) $previewPanel.update($target.post) })
    .on('blur', () => $previewPanel.update(null))
  return { $postGrid, $detail: $previewPanel };
}

$.keys($(window))
  .if(e => {
    if ($(e.target) instanceof $Input) return; 
    return true;
  })
  .keydown(['q', 'Q'], e => { e.preventDefault(); if ($Router.index !== 0) $.back(); })
  .keydown(['e', 'E'], e => { e.preventDefault(); if ($Router.forwardIndex !== 0) $.forward(); })
  .keydown('Tab', e => { 
    e.preventDefault(); 
    if ($(':page#posts')) previewPanelEnable$.set(!previewPanelEnable$.value);
    else if ($(':page#post')) detailPanelEnable$.set(!detailPanelEnable$.value);
  })
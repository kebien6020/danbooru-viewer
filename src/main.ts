import 'elexis';
import '@elexis/layout';
import '@elexis/router';
import { Booru } from './structure/Booru';
import { Router } from '@elexis/router';
import { home_route } from './route/home/$home';
import { posts_route } from './route/posts/$post';

export const booru = new Booru({
  api: 'https://danbooru.donmai.us',
  name: 'Testbooru'
})

const router = new Router('/');
$.anchorPreventDefault = true;
$.anchorHandler = ($a) => { $.open($a.href())}

$(document.body).content([
  $('app').content([
    router.$view
  ])
])

router.addRoute([
  home_route,
  posts_route
]).listen();
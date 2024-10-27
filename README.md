<picture style="display: flex; justify-content: center;">
  <img style="max-width: 500px" src="https://git.defaultkavy.com/defaultkavy/danbooru-viewer/raw/branch/asset/danbooru-viewer-logo.png" alt="Danbooru Viewer Logo">
</picture>
<p style="text-align: center">A modern style viewer for <a href="https://danbooru.donmai.us">Dannbooru</a> or other Booru API base site.</p>

## How To Use
- Enter this URL: [https://danbooru.defaultkavy.com](https://danbooru.defaultkavy.com).
- Or, replace `danbooru.donmai.us` to `danbooru.defaultkavy.com` without changing pathname and url query, will directly open the same page on Danbooru Viewer.
- Or, clone this repository and run commands for self-hosting:
  ```sh
    bun i --production
    bun run start
  ```

## Features
- Same path as the original website.
    - Support URL query like `/posts?tags=ord:fav+minato_aqua`.
- Search tags with autocomplete.
- Infinite scroll posts with waterfall image layout.
- Mobile friendly.

## Hotkeys
- Global Shortcut
  - `Q`: Back.
  - `E`: Forward.
  - `/`: Open search bar.
- Posts Browser Page
  - `W/A/S/D`: Navigation posts in direction.
  - `Tab`: Toogle post detail panel.
  - `Space/Enter`: Open selected post page.
- Post Page
  - `A/D`: Switch to previous/next post page.
  - `Spacebar`: Play/Pause video.

## Roadmap to V1.0
- [x] Posts Page
- [x] Posts Search with any tags
- [x] Booru Account Login (Using API keys)
- [x] Favorite Post with Account
- [x] Post Detail Panel in Posts Browser
- [ ] Saved Searches
- [ ] User Page
- [ ] Post Commentary
- [ ] More...

## Tools
- [Elexis](https://git.defaultkavy.com/defaultkavy/elexis): Web Builder.
- [Elysia](https://elysiajs.com/): Server Framework.
- [ionicons](https://ionic.io/ionicons): Open Souces Icons.
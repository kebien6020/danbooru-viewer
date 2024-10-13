# Danbooru Viewer
A modern style viewer for [Danbooru](https://danbooru.donmai.us) or other Booru API base site.

## Usage
- Enter this URL: [https://danbooru.defaultkavy.com](https://danbooru.defaultkavy.com).
- Replace `danbooru.donmai.us` to `danbooru.defaultkavy.com` without changing pathname and url query, will directly open the same page on Danbooru Viewer.
- Clone this repository and run commands:
  ```sh
    bun i
    bun run build
    bun run start
  ```

## Features
- Same path as the original website.
    - Support URL query like `/posts?tags=ord:fav+minato_aqua`.
- Search tags with autocomplete.
- Infinite scroll posts with waterfall image layout.
- Mobile friendly with modern design.

## Roadmap to V1.0
- [x] Posts Page
- [x] Posts Search with any tags
- [x] Booru Account Login (Using API keys)
- [x] Favorite Post with Account
- [ ] Saved Searches
- [ ] User Page
- [ ] Post Commentary
- [ ] Post Detail Panel
- [ ] Forum Posts Page
- [ ] More...

## Tools
- [Elexis](https://git.defaultkavy.com/defaultkavy/elexis): Web Builder.
- [Elysia](https://elysiajs.com/): Server Framework.
- [ionicons](https://ionic.io/ionicons): Open Souces Icons.
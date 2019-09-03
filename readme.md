<p align="center">
  <img width="220" alt="Pill logo" src="docs/cover.png">
</p>

<p align="center">
  <a href="https://npmjs.com/package/pill">
    <img alt="badge: npm version" src="https://img.shields.io/npm/v/pill.svg?style=flat-square" />
  </a>
  <img alt="badge: size 1.1 KiB" src="https://img.shields.io/badge/size-1.1%20KiB-blue.svg?style=flat-square" />
  <img alt="badge: deps 0" src="https://img.shields.io/badge/deps-0-blue.svg?style=flat-square" />
</p>

Pill adds dynamic content loading to static sites and makes content loading
smooth for users. It's pretty small only _1 KiB_ minified and gzipped. It fits perfectly
for static sites with WebComponents.

> Pill development started with the [tweet](https://twitter.com/sitnikcode/status/1109626507331338240)
by Andrey Sitnik [@ai](https://github.com/ai).

How pill works. It:

1. Intercepts navigation attempts: links clicks and history navigation.
2. Loads requested url using `fetch`.
3. Grabs content from received HTML.
4. Replaces current page content.

Initialize in one line:
```javascript
pill('#content') // Yep, that's it.
```

## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [API](#api)
* [License](#license)

## Install

* Include script from unpkg.com:
  ```html
  <script src="https://unpkg.com/pill@1/dist/pill.min.js"></script>
  ```

  > ⚠️ Remember about security! Add [subresource integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) (SRI) checksum
  > from [checksum.txt](https://unpkg.com/pill@1/dist/checksum.txt).

* Install via npm:

  ```
  npm i pill
  ```

## Usage

1. Inject pill's `<script>` into page.
2. Create content root element and give it id.
3. Create loading indicator element.
4. Initialize pill:
  ```javascript
  // Get loading indicator element
  const indicator = document.querySelector('#indicator')
  // Assign Pill to specified selector
  pill('#content', {
    onLoading() {
      // Show loading indicator
      indicator.style.display = 'initial'
    },
    onReady() {
      // Hide loading indicator
      indicator.style.display = 'none'
    }
  })
  ```

### Complete example

```html
<html>
  <head>
    <title>Home</title>
    <script src="https://unpkg.com/pill@1/dist/pill.min.js"></script>
    <style>
      /* global styles */
      #indicator {
        position: fixed;
        top: 0;
        right: 0;
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="indicator">Loading...</div>
    <div id="content">
      <style>/* page styles */</style>

      <!-- page content here -->
    </div>
    <script>
      const indicator = document.querySelector('#indicator')

      pill('#content', {
        onLoading() {
          // Show loading indicator
          indicator.style.display = 'initial'
        },
        onReady() {
          // Hide loading indicator
          indicator.style.display = 'none'
        }
      })
    </script>
  </body>
</html>
```

Each document of the site should surround `#content` element with the same HTML.
All page-related content should be located inside `#content`. It could be styles, scripts, etc.

## API

### `pill()`
```
(selector:string, options:PillOptions) -> void
```

Initialize pill. Start listening for navigation attempts and history state changes. Puts loaded
content into `selector` element.

### Hooks

#### `PillOptions.onError()`
```
(error) -> void
```
Handle page loading exception. By default is `console.error`.

#### `PillOptions.onLoading()`
```
(page:Page) -> void
```
Handle loading start.

#### `PillOptions.onMounting()`
```
(page:Page, url:URL) -> void
```

Fires everytime new content is about to be loaded to the DOM.

#### `PillOptions.onReady()`
```
(page:Page) -> void
```
Handle loading finish.

### Other options

### `PillOptions.fromError()`
```
(error:Error) -> {title, content}
```
Use it to display notification when something went wrong.
If an error was thrown while handling request. You still able
to render content using method `fromError`

### `PillOptions.getKeyFromUrl()`
```
(url:URL) -> String
```

Get cache key from URL. It's useful when URL contains query params which
are unknown to server and could not affect response. By default any
new pathname and search string combination will cause new request.

### `PillOptions.shouldReload()`
```
(page:Page) -> Boolean
```

Determine wether previously loaded page should be loaded from server.

### `PillOptions.shouldServe()`
```
(url:URL, target:HTMLElement) -> Boolean
```
Developer-defined logic to determine whether the URL could be served by Pill.
If you return `false` then the link will be served by browser.

## License

MIT © [Rumkin](https://rumk.in)

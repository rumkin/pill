<p align="center">
  <img width="220" alt="Pill logo" src="docs/cover.png">
</p>

<p align="center">
  <a href="https://npmjs.com/package/pill">
    <img alt="badge: npm version" src="https://img.shields.io/npm/v/pill.svg?style=flat-square" />
  </a>
  <img alt="badge: size 1.45 KiB" src="https://img.shields.io/badge/size-1.45%20KiB-blue.svg?style=flat-square" />
  <img alt="badge: deps 0" src="https://img.shields.io/badge/deps-0-blue.svg?style=flat-square" />
</p>

Pill adds dynamic content loading to static sites and makes content loading
smooth for users. It's pretty small only _1.45 KiB_ minified and gzipped. It fits perfectly
for static sites with WebComponents.

* 🐥 **Tiny**: `1.45 KiB` gzipped.
* 🥤 **Easy-to-use**: single function call.
* 🎮 **Handful**: hooks and callbacks could modify the default behavior.

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
* [Corner cases](#corner-cases)
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

## Corner Cases

### No script inside of the content element

Script elements placed inside of your content element wouldn't be evaluated after loading.
You should place all scripts out of your content element (in the `head` or `body`) and run JS manually.
This behavior prevents your site from memory licks and race conditions caused by inner scripts
different lifetime. And then you can react on page change with `onReady` hook to change your
app behavior.

Example:

```html
<!DOCTYPE html>
<html>
  <head></head>
  <body>
    <div id="content"></div>
    <!-- common scripts -->
    <script src="/scripts/pill.js"></script>
    <script src="/scripts/app.js"></script>
    <script>
      pill('#content', {
          onMounting(page, url, element) {
            // Init page, for example bind event listeners, start timers, etc.
            App.initPage(url, element)
          },
          onUnmounting(page, url, element) {
            // Uninitialise page, for example remove event listeners, stop timers, etc.
            App.destroyPage(url, element)
          },
       })
       App.initPage(new URL(window.location), document.querySelector('#content'))
    </script>
</html>
```

## API

### `pill()`
```text
(selector:string, options:PillOptions) -> void
```

Initialize pill. Start listening for navigation attempts and history state changes. Puts loaded
content into `selector` element.

### Events

You can handle Pill's events by binding handlers on document element:

```js
document.addEventListener('pill:loading', (e) => {
  e.detail.page; // Current page
})
```

#### `pill:error` Event

```text
{
  detail: {
    url: URL
    element: HTMLElement
    error: Error
  }
}
```

Is emitted when the new page loading has been started. This event wouldn't be emitted
if page is cached.

Could be replaced with [PillOptions.onLoading()](#pilloptionsonloading) hook.

#### `pill:loading` Event

```text
{
  detail: {
    url: URL
    element: HTMLElement
  }
}
```

Is emitted when the new page loading has been started. This event wouldn't be emitted
if page is cached.

Could be replaced with [PillOptions.onLoading()](#pilloptionsonloading) hook.

#### `pill:mounting` Event

```text
{
  detail: {
    page: Page
    url: URL
    element: HTMLElement
  }
}
```

Is emitted when new page content is about to be added into the DOM.

Could be replaced with [PillOptions.onMounting()](#pilloptionsonmounting) hook.

#### `pill:ready` Event

```text
{
  detail: {
    page: Page
    url: URL
    element: HTMLElement
  }
}
```

Is emitted when the requested page is mounted into DOM and no futher work would be done.

Could be replaced with [PillOptions.onReady()](#pilloptionsonready) hook.

#### `pill:unmounting` Event

```text
{
  detail: {
    page: Page
    url: URL
    element: HTMLElement
  }
}
```

Is emitted when new page content is about to be removed from the DOM.

Could be replaced with [PillOptions.onMounting()](#pilloptionsonunmounting) hook.

### Hooks

#### `PillOptions.onError()`
```text
(error) -> void
```
Handle page loading exception. By default is `console.error`.

#### `PillOptions.onLoading()`
```text
(page:Page) -> void
```
Handle loading start.

Could be replaced with [`pill:loading` Event](#pillloading-event) listener.

#### `PillOptions.onMounting()`
```text
(page:Page, url:URL, element:HTMLElement) -> void
```
Fires everytime new content is about to be loaded to the DOM.

Could be replaced with [`pill:mounting` Event](#pillmounting-event) listener.

#### `PillOptions.onReady()`
```text
(page:Page) -> void
```
Handle loading finish.

Could be replaced with [`pill:ready` Event](#pillready-event) listener.

#### `PillOptions.onUnmounting()`
```text
(page:Page, url:URL, element:HTMLElement) -> void
```
Fires everytime content is about to be removed from the DOM.

Could be replaced with [`pill:unmounting` Event](#pillunmounting-event) listener.

### Other options

### `PillOptions.fromError()`
```text
(error:Error) -> {title, content}
```
Use it to display notification when something went wrong.
If an error was thrown while handling request. You still able
to render content using method `fromError`

### `PillOptions.getKeyFromUrl()`
```text
(url:URL) -> String
```

Get cache key from URL. It's useful when URL contains query params which
are unknown to server and could not affect response. By default any
new pathname and search string combination will cause new request.

### `PillOptions.shouldReload()`
```text
(page:Page) -> Boolean
```

Determine wether previously loaded page should be loaded from server.

### `PillOptions.shouldServe()`
```text
(url:URL, target:HTMLElement) -> Boolean
```
Developer-defined logic to determine whether the URL could be served by Pill.
If you return `false` then the link will be served by browser.

## License

MIT © [Rumkin](https://rumk.in)

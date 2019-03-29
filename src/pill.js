function shouldServeDefault(href) {
  return href.origin === location.origin
}

function createPage(title = '', content = '', status = 0, timestamp = new Date()) {
  return {title, content, status, timestamp}
}

function setContent(root, page) {
  document.title = page.title
  root.innerHTML = page.content
}

function fromResponse(selector, response, text) {
  const fragment = document.createDocumentFragment()
  const fragRoot = document.createElement('html')
  fragment.appendChild(fragRoot)
  fragRoot.innerHTML = text

  const title = fragRoot.querySelector('title').textContent
  const root = fragRoot.querySelector(selector)
  const content = root ? root.innerHTML : '';

  return {title, content}
}

function updateState(url, title, push) {
  if (push) {
    history.pushState({}, title, url)
  }
  else {
    history.replaceState({}, title, url)
  }
}

function defaultErrorHandler() {
  return {
    title: 'Error',
    content: `<h1>Error</h1><p>Ooops. Something went wrong</p>`,
    code: 500,
    timestamp: new Date(),
  }
}

function scrollToAnchor(name) {
  setTimeout(() => {
    let anchor;
    if (name in document.anchors) {
      anchor = document.anchors[name]
    }
    else {
      anchor = document.getElementById(anchor)
    }

    if (anchor) {
      anchor.scrollIntoView(true)
    }
  })
}

export default function pill(
  selector,
  {
    onReady = () => {},
    onLoading = () => {},
    resolve = (v) => v,
    fromError = defaultErrorHandler,
    shouldServe = shouldServeDefault,
    shouldReload = () => false,
  } = {}
) {
  if (typeof window.history.pushState !== 'function') {
    return () => {}
  }

  let current = null;

  const element = document.querySelector(selector)
  element._; // tiny throw if element not exists
  const url = new URL(document.location);
  const page = createPage(document.title, element.innerHTML, 200)
  const pages = {
    [url.pathname]: page,
  }
  const render = (url, page, push) => {
    updateState(url, page.title, push);
    setContent(element, page)
    onReady(page)
    if (push && url.hash.length > 1) {
      scrollToAnchor(url.hash.slice(1))
    }
  }

  updateState(url, page.title, false)

  const goto = (url, push) => {
    url = resolve(url);

    if (url.pathname in pages) {
      const page = pages[url.pathname]

      if (shouldReload(page) === false) {
        render(url, page, push)
        return
      }
    }

    updateState(url, url, push)

    const request = current = fetch(url)
    .then(async (res) => {
      let page = fromResponse(selector, res, await res.text())

      pages[url] = page

      page.status = res.status;
      page.timestamp = new Date();

      if (request !== current) {
        return
      }
      current = null
      render(url, page, false)
    })
    .catch((error) => {
      if (request === current) {
        current = null
      }

      const page = fromError(error)
      setContent(element, page)
      onReady(page)

      throw error
    })
    .catch(console.error)

    onLoading(url)
  }

  const onClick = (e) => {
    if (e.target.nodeName !== 'A') {
      return
    }

    const url = new URL(e.target.href, document.location)

    if (! shouldServe(url)) {
      return
    }

    e.preventDefault();

    window.scrollTo(0, 0)
    goto(url, current === null)
  }

  const onPopState = (e) => {
    goto(new URL(document.location), false)
    setTimeout(() => window.scrollTo(0, e.state.scroll || 0))
  }

  let scrollDebounceTimeout;
  const onScroll = () => {
    if (scrollDebounceTimeout) {
      return
    }

    scrollDebounceTimeout = setTimeout(() => {
      history.replaceState({scroll: window.scrollY}, document.title, document.location)
      scrollDebounceTimeout = null
    }, 100)
  }

  document.body.addEventListener('click', onClick)
  window.addEventListener('popstate', onPopState)
  window.addEventListener('scroll', onScroll)
}

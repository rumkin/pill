function shouldServeDefault(href) {
  return href.origin === location.origin
}

function createPage(title, content, status, timestamp) {
  return {
    title: title || '',
    content: content || '',
    status: status || 0,
    timestamp: timestamp || new Date()
  }
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
  const content = root ? root.innerHTML : ''

  return {title: title, content: content}
}

function updateState(state, url, title, push) {
  if (push) {
    history.pushState(state || {}, title, url)
  }
  else {
    history.replaceState(state || {}, title, url)
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
  requestAnimationFrame(function () {
    let anchor
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

function noop() {}

export default function pill(selector, options) {
  if (typeof window.history.pushState !== 'function') {
    return
  }
  options = options || {}
  const onReady = options.onReady || noop
  const onLoading = options.onLoading || noop
  const fromError = options.fromError || defaultErrorHandler
  const shouldServe = options.shouldServe || shouldServeDefault
  const shouldReload = options.shouldReload || noop

  let current = null

  const element = document.querySelector(selector)
  if (! element) {
    throw new Error('Element "' + selector + '" not found')
  }
  const url = new URL(document.location)
  const page = createPage(document.title, element.innerHTML, 200)
  const pages = {}
  pages[url.pathname] = page
  function render (url, page, push) {
    updateState(null, url, page.title, push)
    setContent(element, page)
    onReady(page)
    if (push && url.hash.length > 1) {
      scrollToAnchor(url.hash.slice(1))
    }
  }
  // Initial scroll
  updateState({scroll: window.scrollY}, url, page.title, false)

  function goto(url, push) {
    if (url.pathname in pages) {
      const page = pages[url.pathname]

      if (shouldReload(page) !== true) {
        render(url, page, push)
        return
      }
    }

    updateState(null, url, url, push)

    const request = current = fetch(url)
    .then(function (res) {
      return res.text()
      .then((function(text) {
        return {
          res: res,
          text: text,
        }
      }))
    })
    .then((function (result) {
      const res = result.res
      const text = result.text

      let page = fromResponse(selector, res, text)

      pages[url.pathname] = page

      page.status = res.status
      page.timestamp = new Date()

      if (request !== current) {
        return
      }
      current = null
      render(url, page, false)
    }))
    .catch(function (error) {
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

  function onClick (e) {
    if (e.target.nodeName !== 'A') {
      return
    }

    const url = new URL(e.target.href, document.location)

    if (! shouldServe(url)) {
      return
    }

    e.preventDefault()

    window.scrollTo(0, 0)
    goto(url, current === null)
  }

  function onPopState(e) {
    goto(new URL(document.location), false)
    requestAnimationFrame(function() {
      window.scrollTo(0, e.state.scroll || 0)
    })
  }

  let scrollDebounceTimeout
  function onScroll() {
    if (scrollDebounceTimeout) {
      return
    }

    scrollDebounceTimeout = setTimeout(function () {
      updateState({scroll: window.scrollY}, document.location, document.title, false)
      scrollDebounceTimeout = null
    }, 100)
  }

  document.body.addEventListener('click', onClick)
  window.addEventListener('popstate', onPopState)
  window.addEventListener('scroll', onScroll)
}

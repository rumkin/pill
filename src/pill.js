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
  var fragment = document.createDocumentFragment()
  var fragRoot = document.createElement('html')
  fragment.appendChild(fragRoot)
  fragRoot.innerHTML = text

  var title = fragRoot.querySelector('title').textContent
  var root = fragRoot.querySelector(selector)
  var content = root ? root.innerHTML : ''

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
    var anchor
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
  var onReady = options.onReady || noop
  var onLoading = options.onLoading || noop
  var fromError = options.fromError || defaultErrorHandler
  var shouldServe = options.shouldServe || shouldServeDefault
  var shouldReload = options.shouldReload || noop

  var current

  var element = document.querySelector(selector)
  if (! element) {
    throw new Error('Element "' + selector + '" not found')
  }
  var url = new URL(document.location)
  var page = createPage(document.title, element.innerHTML, 200)
  var pages = {}
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
      var page = pages[url.pathname]

      if (shouldReload(page) !== true) {
        render(url, page, push)
        return
      }
    }

    updateState(null, url, url, push)

    var request = current = fetch(url)
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
      var res = result.res
      var text = result.text

      var page = fromResponse(selector, res, text)

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

      var page = fromError(error)
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

    var url = new URL(e.target.href, document.location)

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

  var scrollDebounceTimeout
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

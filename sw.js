//Service Worker Version
const version = '1.0';

//Static Assets - App Shell
const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.js'
]

//SW on Install listener (runs each time a new version is installed)
self.addEventListener('install', e => {
  //create new cache store for sw
  e.waitUntil(
    //add all appAssets (app shell) to the new versioned cache
    caches.open('static-'+version)
      .then( cache => cache.addAll(appAssets) )
  );
});

//SW on Activate listener
self.addEventListener('activate', e => {
  //clean any old versions of the static cache files
  let cleaned = caches.keys().then( keys => {
    keys.forEach( key => {
      //check if not current version but contains static
      if(key != 'static-'+version && key.match('static-') ){
        //is previous version, delete old cache
        return caches.delete(key);
      }
    })
  })
  e.waitUntil(cleaned);
});


//Static cache strategy - Cache first with Network Fallback
const staticCache = (req, cacheName = 'static-'+version ) => {
  //check if the request is found in the cache
  return caches.match(req).then( cachedRes => {
    //return cached response if found
    if(cachedRes) return cachedRes;
    //fallback to network and add to cache
    return fetch(req).then( networkRes =>{
      //update the cache
      caches.open(cacheName)
        .then( cache => cache.put(req, networkRes));
      //return a clone of the network response
      return networkRes.clone();
    })
  })
}

//for dynamic content use Network with cache fallback
const fallbackCache = (req) => {
  //try network
  return fetch(req).then( networkRes => {
    //check if res is error
    if( !networkRes.ok ) throw 'Fetch Error';
    //if not error, than update the cache
    caches.open('static-'+version)
      .then( cache => cache.put(req, networkRes) );
    //return clone of network response
    return networkRes.clone();
  })
  //try cache
  .catch( err => caches.match(req) );
};

//Clean old giphy's from the giphy cache
const cleanGiphyCache = (giphys) => {
  caches.open('giphy').then(cache => {
    //get all cache entries
    cache.keys().then(keys => {
      //loop entries
      keys.forEach( key => {
        //if entry is not part of the current giphys than delete
        if( !giphys.includes(key.url) ){
          cache.delete(key);
        }
      })
    })
  });
}

//SW fetch listener
self.addEventListener('fetch', e => {
  //App Shell request - check if the url request is from the same domain as the service worker
  if( e.request.url.match(location.origin) ){
    e.respondWith( staticCache(e.request) );
  //Giphy API Requests
  }else if( e.request.url.match('api.giphy.com/v1/gifs/trending') ){
    e.respondWith( fallbackCache(e.request) );
  //Giphy Media Requests
  }else if( e.request.url.match('giphy.com/media') ){
    e.respondWith( staticCache(e.request, 'giphy'));
  }
});

//listen for message from client
self.addEventListener('message', e => {
  //Identify the message
  if(e.data.action === 'cleanGiphyCache'){
    cleanGiphyCache(e.data.giphys);
  }
});
self.addEventListener('message', function (e) {
	var s = e.data;
	if (!s || s.updateSw) {
		self.skipWaiting();
		return;
	}
	var type = s.type;
	s = s.s;
	if (type === "install") {
		caches.open(s.cacheName).then(function (c) {
			for (var nm in s.cacheFiles) {
				s.cacheFiles[nm].forEach(function (f) {
					c.match(nm + "/" + f).then(function (cR) {
						if (!cR)
							c.add(nm + "/" + f);
					});
				});
			}
		});
		return;
	}
	if (type === "update") {
		caches.open(s.cacheName).then(function (c) {
			var cf = [];
			for (var nm in s.cacheFiles) {
				s.cacheFiles[nm].forEach(function (f) {
					cf.push(c.add(nm + "/" + f));
				});
			}
			return Promise.all(cf);
		}).then(function () {
			e.source.postMessage({
				type: "reload"
			});
		});
		return;
	}
});
var fn = function (e) {
	console.info('[ServiceWorker] Fetch', e.request.url);
	e.respondWith(
		caches.match("@:precacheJS_cacheName_").then(function (r) {
			return r.text();
		}).then(function (t) {
			return caches.open(t).then(function (c) {
				return c.match(e.request).then(function (response) {
					return response || fetch(e.request);
				});
			})
		}));
};
self.removeEventListener('fetch', fn);
self.addEventListener('fetch', fn);

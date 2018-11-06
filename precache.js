(function (W) {
  	if(!('navigator' in W && 'serviceWorker' in navigator)||!Promise)
      	return (W.precache=function(){});
  	
	var args = function (obj, arg) {
		if (args !== undefined && !(args instanceof Object))
			return arg;
		var objNew = {};
		for (var nm in obj) {
			objNew[nm] = obj[nm];
		}
		for (var nm in arg) {
			objNew[nm] = arg[nm];
		}
		return objNew;
	},
	pending = function (success) {
		return new Promise(function (resolve, reject) {
			(function interval() {
				try {
					var sc = success();
					if (sc)
						resolve(sc);
					else
						setTimeout(interval, 0);
				} catch (e) {
					reject(e);
				}
			})();
		});
	},
	worker,
	options,
	updateCache = function (reg, s) {
		reg.active.postMessage({
			type: "update",
			s: s
		});
	},
	installCache = function (reg, s) {
		reg.active.postMessage({
			type: "install",
			s: s
		});
	},
	update = function () {
		navigator.serviceWorker.controller && (
			alert("update found! The page will now reload."),
			W.location.reload());
	},
	checker = function (options, reg) {
		var check = false,
		allChecked = {
			changedFiles: 0,
			minTime: false
		},
		s = args({
				changedFiles: false,
				minTime: false
			}, options.updateIf || {}),
		success = function (resp, file) {
			var tmp,
			rclone = resp.clone();
			file = "@:precacheJS_" + file + "_";
			caches.open(options.tempCacheName).then(function (cache) {
				tmp = cache.match(file);
				return Promise.all([
						resp.text(),
						tmp.then(function (tmpFile) {
							return tmpFile ? tmpFile.text() : tmpFile;
						})
					]);
			}).then(function (data) {
				if (data[0] !== data[1])
					check = true;
				return caches.open(options.tempCacheName).then(function (cache) {
					cache.put(file, rclone);
				});
			}).then(function () {
				allChecked.changedFiles++;
				if (allChecked.changedFiles === s.changedFiles.length)
					allChecked.changedFiles = true;
			});

		},
		fail = function () {
			allChecked.changedFiles++;
			if (allChecked.changedFiles === s.changedFiles.length)
				allChecked.changedFiles = true;
		},
		fn = function (f) {
			return fetch(f, {
				cache: "no-cache"
			}).then(function (r) {
				success(r, f);
			}, fail);
		};

		if (s.changedFiles) {
			s.changedFiles.forEach(function (f, ind) {
				fn(f);
			});
		} else {
			allChecked.changedFiles = true;
		}

		if (s.minTime !== false && Date.now() >= s.minTime) {
			check = true;
		}
		allChecked.minTime = true;

		pending(function () {
			return allChecked.changedFiles === true && allChecked.minTime === true;
		}).then(function () {
			if (check)
				updateCache(reg, options);
			else
				installCache(reg, options);
		}, console.error);
	},
	precFun = function (options, offline) {
		var s = options;
		caches.open(s.tempCacheName).then(function (cache) {
			return cache.put("@:precacheJS_cacheName_", new Response(s.cacheName));
		}).then(function () {
			navigator.serviceWorker.addEventListener('message', function (e) {
				if (e.data.type = "reload")
					update();
			});
			navigator.serviceWorker.register(s.serviceWorkerFile, {
				scope: s.scope
			}).then(function (reg) {
				console.info("ServiceWorker registration successful with scope: ", reg.scope);

				checker(options, reg);

				worker = reg;

				if (!navigator.serviceWorker.controller)
					return;

				if (reg.waiting) {
					reg.waiting.postMessage({
						updateSw: true
					});
					return;
				}

				if (reg.installing) {
					reg.addEventListener('statechange', function () {
						if (reg.installing.state == 'installed') {
							console.info('show toast and upon click update...');
							reg.installing.postMessage({
								updateSw: true
							});
							return;
						}
					});
				}

				reg.addEventListener('updatefound', function () {
					var newSW = reg.installing;

					newSW.addEventListener('statechange', function () {
						if (newSW.state == 'installed') {
							console.info('show toast and upon click update...');
							newSW.postMessage({
								updateSw: true
							});
						}
					});
				});
			}, function (err) {
				console.info("ServiceWorker registration failed: ", err);
			});

			navigator.serviceWorker.addEventListener('controllerchange', function () {
				update();
			});
		});
	},
	prec = function (opt, tempCacheName) {
		window.addEventListener("load", function () {
			tempCacheName = tempCacheName || "@:precacheJS_TEMP_CACHE_";
			new Promise(function (resolve, reject) {
				if (opt.constructor === String) {
					var precOpt = "@:precacheJS_" + opt + "_OPTIONS_";
					fetch(opt, {
						cache: "no-cache"
					}).then(
						function (resp) {
						caches.open(tempCacheName).then(function (cache) {
							cache.put(precOpt, resp);
						});
						return resp.clone();
					},
						function (resp) {
						return caches.open(tempCacheName).then(function (cache) {
							return cache.match(precOpt);
						});
					}).then(function (resp) {
						resolve(resp ? resp.json() : {});
					});
				} else
					return opt;
			}).then(function (s) {
				s = args({
						cacheFiles: {},
						cacheName: "precaches",
						updateIf: false,
						serviceWorkerFile: "./sw.js",
						scope: "./",
						checkServiceWorkers: true
					}, s);
				options = s;
				s.tempCacheName = tempCacheName;
				precFun(s);
			});
		});
	};
	W.precache = prec;
	W.precache.cache = function (name) {
		return {
			add: function (url, value) {
				return caches.open(name).then(function (c) {
					if (value)
						return c.put(url, value);
					else {
						return c.add(url);
					}
				});
			},
			get: function (url) {
				var c = caches.open(name).then(function (cache) {
						return cache.match(url);
					});
				return {
					to: function (type) {
						return c.then(function (resp) {
							return resp ? type ? resp[type]() : resp : undefined;
						});
					},
					then: c.then
				};
			}
		};
	};
	W.precache.worker = pending(function () {
			return worker;
		});
	W.precache.options = pending(function () {
			return options;
		});
  	W.precache.updateCache=updateCache;
 	W.precache.installCache=installCache;
})(window);

(function (W) {
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
	checker = function (options,reg) {
		var check = false,
		allChecked = {
			changedFiles: 0,
			minTime: false
		},
		s = args({
				changedFiles: false,
				minTime: false
			}, options.updateIf||{}),
		success = function (resp, file) {
			var tmp,
			rclone = resp.clone();
			file = "@:precacheJS_" + file + "_";
			caches.open(options.tempCacheName).then(function (cache) {
				tmp = cache.match(file);
				return Promise.all([
						resp.text(),
						tmp.then(function(tmpFile){
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

		console.log(44);
		(function interval() {
			if (allChecked.changedFiles === true && allChecked.minTime === true) {
				console.log(99999);
				if (check)
					updateCache(reg, options);
				else
					installCache(reg, options);
				return;
			}
			setTimeout(interval, 1);
		})();
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

				checker(options,reg);

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
	prec = function (opt,tempCacheName) {
		if (('navigator' in W && 'serviceWorker' in navigator) || !s.checkServiceWorkers) {
			window.addEventListener("load", function () {
				tempCacheName=tempCacheName||"@:precacheJS_TEMP_CACHE_";
				new Promise(function (resolve, reject) {
					if (opt.constructor===String){
						var precOpt="@:precacheJS_"+opt+"_OPTIONS_";
						fetch(opt, {
							cache: "no-cache"
						}).then(
							function(resp){
								caches.open(tempCacheName).then(function(cache){
									cache.put(precOpt,resp);
								});
								return resp.clone();
							},
							function(resp){
								return caches.open(tempCacheName).then(function(cache){
									return cache.match(precOpt);
								});
							}
						).then(function(resp){
                          	console.log(resp);
							resolve(resp?resp.json():{});
						});
                	}else
						return opt;
				}).then(function (s) {
                  	console.log(s);
					s = args({
							cacheFiles: {},
							cacheName: "precaches",
							updateIf: false,
							serviceWorkerFile: "./sw.js",
							scope: "./",
							checkServiceWorkers: true
						}, s);
					s.tempCacheName=tempCacheName;
					precFun(s);
				});
			});
		}
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
				return caches.open(name).then(function (c) {
					return c.match(url);
				});
			}
		};
	};
})(window);

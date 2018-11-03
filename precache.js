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
    update=function(){
    	navigator.serviceWorker.controller&&(
          	alert("update found! The page will now reload."),
        	W.location.reload());
    },
	precFun = function (options, offline) {
		var s = options;
		caches.open(s.tempCacheName).then(function (c) {
			return c.put("@:precacheJS_cacheName_", new Response(s.cacheName));
		}).then(function () {
			navigator.serviceWorker.addEventListener('message', function (e) {
				if (e.data.type = "reload")
					update();
			});
			navigator.serviceWorker.register(s.SWFile, {
				scope: s.scope
			}).then(function (reg) {
				console.info("ServiceWorker registration successful with scope: ", reg.scope);
				var check = false,
				allChecked = {
					changedFiles: 0,
					minTime: false
				},
				u = s.updateIf || {},
				fn = function (f) {
					return fetch(f, {
						cache: "no-cache"
					}).then(
						function (r) {
						caches.open(s.tempCacheName).then(function (c) {
							c.match(f).then(function (cR) {
								return cR ? cR.text() : cR
							}).then(function (cT) {
								var rclone = r.clone();
								r.text().then(function (t) {
									if (t !== cT)
										check = true;
									caches.open(s.tempCacheName).then(function (c) {
										c.put(f, rclone);
									}).then(function () {
										allChecked.changedFiles++;
										if (allChecked.changedFiles === u.changedFiles.length)
											allChecked.changedFiles = true;
									});
								});
							});
						});
					},
						function (r) {
						allChecked.changedFiles++;
						if (allChecked.changedFiles === u.changedFiles.length)
							allChecked.changedFiles = true;
					});
				};
				if (u.changedFiles) {
					u.changedFiles.forEach(function (f, ind) {
						fn(f);
					});
				} else {
					allChecked.changedFiles = true;
				}
				if (u.minTime !== undefined && Date.now() >= u.minTime) {
					check = true;
				}
				allChecked.minTime = true;
				console.log(44);
				(function interval() {
					if (allChecked.changedFiles === true && allChecked.minTime === true) {
						console.log(99999);
						if (check)
							updateCache(reg, s);
						else
							installCache(reg, s);
						return;
					}
					setTimeout(interval, 1);
				})();
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
	prec = function (opt) {
		var s = args({
				cacheFiles: [],
				updateIf: false,
				serviceWorkerFile: "./sw.js",
				tempCacheName: opt.cacheName+"_TEMP",
				scope: "./",
				checkServiceWorkers: true
			}, opt);

		if (('navigator' in W && 'serviceWorker' in navigator) || !s.checkServiceWorkers) {
			window.addEventListener("load", function () {
				precFun(s);
			});
		}
	};
	W.precache = prec;
  	W.precache.cache=function(name){
      	return {
          	add:function(url,value){
      			return caches.open(name).then(function(c){
                  	if(value)
                      	return c.put(url,value);
                  	else{
                      	return c.add(url);
                    }
                });
            },
          	get:function(url){
              	return caches.open(name).then(function(c){
                  	return c.match(url);
                });
            }
        };
    };
})(window);

# precache.js

## Installing

#### add `precache.js`  and `sw.js` in root of your site.
 
 
 #### connect `precache.js` to page:
 
	<script src="precache.js"></script>
**(add in start of page, preferably after opening `<html>`)**

#### initialize precaching with the precache function:

    precache(options,tempCacheName)
#### [String] tempCacheName:
default value:

    "@:precacheJS_TEMP_CACHE_"

the name of the partition in the cache where important precache.js information will be saved

#### [String] *(if string, then)* options:
takes the name of the `.json` file with caching parameters
#### [Object] *(if options is string, this placed in the JSON file, else options get the Object with next properties)* options:
|property|type|info|default|
|--|--|--|--|
|`cacheName`|String|the name of the partition in the cache where all files will be saved|`"precaches"`|
|`serviceWorkerFile`|String|url to `sw.js`|`"./sw.js"` (in current dir)|
|`scope`|String|scope of service worker|`./` (dir of `sw.js` and maybe current dir)|
|`cacheFiles`|Object|list of cached files|`{}`|
|`updateIf`|Object|cache update conditions|`false` (will not be updated)|
|`checkServiceWorkers`|Boolean|check browser for service workers support|`true`|

***general form:***

    {
		"cacheName": "name",
		"cacheFiles": {
			"path": [
				".",
				"file1",
				"file2",
				...
			]
		},
		"serviceWorkerFile": ".../file.js",
		"scope": ".../",
		"checkServiceWorkers": true,
		"updateIf": updateOptions
	}

#### [Object] updateOptions:
|property|type|info|default|
|--|--|--|--|
|`changedFiles`|Array|names of files, when change that, the cache will update|`none`|
|`minTime`|Number|UNIX time format. After that time cache will begin to update|`none`|

***general form:***

    {
	    "changedFiles":[
			"file1",
			"file2",
			...
		],
		"minTime":1541280849213
    }
## !!! Not Recommend !!!

 - add file with options to cached files
 - add `sw.js` to cached files 
 - add cached files to `updateIf.changedFiles` *(it's pointless :))*
 - cache folders (**except folders with cached files- `./.` `css/.` `someFolderWithCachedFiles/.`** ...)

## Examples
[precache.json (options in json)](https://github.com/MiloLug/prcon3/blob/master/precache.json)

[precache connecting](https://github.com/MiloLug/prcon3/blob/master/index.html)

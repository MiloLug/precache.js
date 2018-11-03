# precache.js

## Installing

#### add `precache.js`  and `sw.js` in root of your site.
 
 
 #### connect `precache.js` to page:
 
	<script src="precache.js"></script>
**(add in start of page, preferably after opening `<html>`)**

#### initialize precaching with the precache function:

    precache(options)

#### [Object] options:
|property|type|info|default|
|--|--|--|--|
|cacheName|String|the name of the partition in the cache where all files will be saved|`"precaches"`|
|tempCacheName|String|the name of the partition in the cache where important precache.js information will be saved|`cacheName+"_TEMP"`|
|cacheFiles|Object|list of cached files|`{}`|
|updateIf|Object|cache update conditions|`false` (will not be updated)|

***general form:***

    {
	    cacheName:"name",
	    tempCacheName:"tempname",
	    cacheFiles:{
			"path":[
				"file1/dir1",
				"file2/dir2",
				...
			]
		},
		updateIf:updateOptions
    }
#### [Object] updateOptions:
|property|type|info|default|
|--|--|--|--|
|changedFiles|Array|names of files, when change that, the cache will update|`none`|
|minTime|Number|UNIX time format. After that time cache will begin to update|`none`|

***general form:***

    {
	    changedFiles:[
			"file1",
			"file2",
			...
		],
		minTime:1541280849213
    }

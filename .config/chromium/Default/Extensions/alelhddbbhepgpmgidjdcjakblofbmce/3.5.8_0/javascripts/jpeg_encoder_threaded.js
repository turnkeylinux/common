/*
JPEG encoder GUI thread part by Andreas Ritter, www.bytestrom.eu, 11/2009

v 0.9
*/

function JPEGEncoderThreaded(workerPath) {
 	var time_start; // benchmark timer variable
 	var workerpath = workerPath || 'jpeg_encoder_threaded_worker.js'; // because DokuWiki on my website resolves this path to a Wiki page instead of the script.
	var engine = new Worker(workerpath);
	var cacheIndex = 0;
	var storage = [];
	var self = this;
	
	var expectMode = 'json'; // 'datauri'
	var expectedIndex = 0;
	
	// lookup table for string encoding
	var clt = (function(){
				var sfcc = String.fromCharCode;
				var temp = new Array(256);
				for(var i=0; i < 256; i++){
					temp[i] = sfcc(i);
				}
				return temp
			})()
	
	engine.onmessage = function(e){
		var meta;
		if(expectMode == 'json'){
			//console.log('Received JSON data');
			meta = JSON.parse(e.data);
			expectedIndex = meta.cacheIndex;
			expectMode = 'datauri';
		} else {
			//console.log('Received binary jpeg data');
			meta = storage[expectedIndex];
			
			// benchmarking
			var duration = new Date().getTime() - time_start;
    		console.log('Threaded encoding time: '+ duration + 'ms');
    		//
			meta.callback('data:image/jpeg;base64,' + btoa(e.data));
			if(!meta._cache) storage[expectedIndex] = null;
			expectMode = 'json';
		}
	}
	
	this.encode = function(image,quality,callback,cache){
		time_start = new Date().getTime();
		return internalEncode(image,quality,callback,cache,false)
	}
	
	this.prepareImage = function(image,quality,callback){
		return internalEncode(image,quality,callback,true,true)
	}
	
	function internalEncode(image,quality,callback,cache,pio_only){
		var pio = new preparedImageObject(self,cacheIndex,quality,callback,cache);
		storage[cacheIndex] = pio;
		cacheIndex++;
		
		var cmd = pio_only? 'cache_only':'encode_new';

		engine.postMessage(JSON.stringify({command:cmd,data:{cacheIndex:pio._cachedImageIndex,quality:pio.quality,cache:pio._cache,width:image.width,height:image.height}}));
		
		var imageData = image.data;
		var imageDataLength = imageData.length;
		var temp = new Array((imageDataLength/4)*3)
		var reali=0;
			
		for(var i=0; i < imageDataLength; i+=4){ // 8		
			temp[reali++] = clt[imageData[i]];
			temp[reali++] = clt[imageData[i+1]];
			temp[reali++] = clt[imageData[i+2]];	
		}
			
		var imgString = temp.join('');
		temp = null;	
		engine.postMessage(imgString);
		imgString = null;
		
		if(cache){
			return pio;
		} else return true
	}
	
	this._encodeCached = function(cachedImageIndex,quality,callback){
		time_start = new Date().getTime();
		engine.postMessage(JSON.stringify({command:'encode_cached',data:{cacheIndex:cachedImageIndex,quality:quality}}));
	}
	
	this.clearCaches = function(){
		cacheIndex = 0;
		storage = [];
		engine.postMessage(JSON.stringify({command:'clear_caches'}));
	}
		
	function preparedImageObject(encoder,cacheIndex,quality,callback,cache){
		var encoder = encoder;
		this._cachedImageIndex = cacheIndex;
		this._cache = cache;
		this.quality = quality;
		this.callback = callback;
		this.encode = function(qu){
			if(qu) this.quality = qu;
			encoder._encodeCached(this._cachedImageIndex,this.quality,this.callback)
		}
	}
}

function getImageDataFromImage(idOrElement){
	var theImg = (typeof(idOrElement)=='string')? document.getElementById(idOrElement):idOrElement;
	var cvs = document.createElement('canvas');
	cvs.width = theImg.width;
	cvs.height = theImg.height;
	var ctx = cvs.getContext("2d");
	ctx.drawImage(theImg,0,0);
	
	return (ctx.getImageData(0, 0, cvs.width, cvs.height));
}

/*
var encoder = new JPEGEncoderThreaded();


function prepareTest(){
	console.log('start');
	time_start = new Date().getTime();
	prepImgHandle = encoder.prepareImage(getImageDataFromImage('testimage'),10,cbk);
}

function init(){
}

function init(){
	imgHandle = encoder.encode(getImageDataFromImage('testimage'),50,cbk,true);

}


function cbk(datauri){		
	var img = document.createElement('img');
	img.src = datauri;
	document.body.appendChild(img);
}
*/
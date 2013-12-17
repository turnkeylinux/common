getDomainFromURL =  function(url){
	var modifiedURL = url.replace("http://", "").replace("https://", "").replace("www.","");
    indexOfSlash = modifiedURL.indexOf("/");
    if(indexOfSlash > 0)
    	modifiedURL = modifiedURL.substring(0,indexOfSlash);
    return modifiedURL;
}

var getAmazonSearchURL = function(keywords){
  return 'http://www.amazon.com/s?ie=UTF8&index=blended&field-keywords='+keywords+'&tag=diigo0c-20';
}

var insert_similar = function(){
  var URL = getDomainFromURL(document.location.href);
  
  if(URL.indexOf('google') >= 0){
    function addlink(event){
      var node = event.target;
      if(node instanceof HTMLLIElement){
        addsimilar(node);
      }
    }
    
    function addsimilar(node){
      if(!node.getElementsByTagName) return;
        var mainLink = node.getElementsByTagName("a")[0];
        if(!mainLink) return;
        var url = mainLink.href;
        var spans = node.getElementsByTagName("span");
        
        for (key in spans){
          var span = spans[key];
          if(span.className == 'vshid'){
            //span.style.display = "inline";
            if($(span).prev('.similar_span').length>0){
              $(span).prev('.similar_span').html('<a class="as_similar_link" href="http://www.similarsites.com/search?searchURL='+encodeURIComponent(url)+'&ref=dg" target="_blank">Similar</a>');
            }else{
              var HTML = ' -<span class="similar_span"><a class="as_similar_link" href="http://www.similarsites.com/search?searchURL='+encodeURIComponent(url)+'&ref=dg" target="_blank">Similar</a></span>';
              $(span).before(HTML);
            }
          }
        }
    }
    
    
    document.addEventListener("DOMNodeInserted",function(event){addlink(event)},false);
    
    function manageNodes(){
      var liNodes = document.getElementsByTagName('li');
      for(key in liNodes){
        var node = liNodes[key];
        addsimilar(node);
      }
    }
    
    manageNodes();
    
  }
}

/*------------------------------------------------------------------
//for amazon

--------------------------------------------------------------------*/

//for google search
var amazon_google= function(){
  var googlekeywords = new RegExp("^http://www.google.(?:com|ca|co.uk|com.au|co.in|co.id|com.ph)/(?:search\\?|#)(?:.*&)?q=([^&=]*)(.*)$");
  var googleUrlRegExp = new RegExp("^http://www.google.(?:com|ca|de|fr|co.uk|com.au|co.in|co.id|com.ph|com.hk|co.jp)/.*$");
  
  match = googleUrlRegExp.exec(document.location.href);
  if(match){
    //for google search page
    var insert_amazon_google = function(){
      if($('#res ol li').length>0 && !$("#res ol").data("as_amzn")){   //have or not aready insert 
        $("#res ol").data("is_amzn_already_inserted", true);
        
        //var keywords = decodeURIComponent(googlekeywords.exec(document.location.href)[1]).replace(/\+/g, " ");
        var keywords = $('#lst-ib').val();
        var cname = new RegExp("\\.([^.]*)$").exec(window.location.hostname)[1];  // country
        insert_amazon(keywords,'google',cname,"#res ol li h3 a");
        
      }
    }
    
     document.addEventListener("DOMNodeInserted", function(){insert_amazon_google();}, false);
  }
}


/*--public--*/

var insert_amazon = function(keywords,search_engine_name,cname,element){
  var insert = function(){
    if($('#res ol').data("as_amzn")) return;
    if($("#scTopOfPageRefinementLinks").length > 0) return;
    var local;
    $("#res ol").data("is_amzn_already_inserted", true);
    $('#res ol').data("as_amzn_google_2",true);
    $('#res ol').data("as_amzn",true);
    switch(cname){
      case 'uk':local = 'uk';break;
      case 'jp':local = 'jp';break;
      case 'fr':local = 'fr';break;
      case 'de':local = 'de';break;
      case 'ca':local = 'ca';break;
      default : local = 'us';break;
    }
    //console.log(keywords);
    //console.log($('.gssb_e tbody').length);
    
    chrome.extension.sendRequest({action:'get_amazon',keywords:keywords,local:local},function(response){
        data = JSON.parse(response);
        var good_list='';
        var len = data.items.length<4?data.items.length:4;
        for(i=0;i<len;i++){
          //console.log(data.items[i]['title']);
          good_list+='<div><span class="rate"></span><a href="'+data.items[i].url+'">'+data.items[i].title+'</a><cite>'+data.items[i].price+'</cite></div>';
        }
        
        var html = '<div id="as_amazon_good_result">'
                  +'<a href="'+getAmazonSearchURL(keywords)+'" class="title">Amazon results for <b>'+keywords+'</b></a>  <span class="as_amazon_customize"><a href="'+chrome.extension.getURL('options.html')+'" target="_blank">[Customize]</a></span>'
                  //+'<ul>'
                  +good_list
                  //+'</ul>'
                  +'<a href="'+getAmazonSearchURL(keywords)+'"><img src="http://www.amazon.com/favicon.ico">'+data.total+' more results >></a></div>';
      
        //var html = '<div id="as_amazon_good_result"><div>Amazon results for <b>ipad</b></div><ul><li><a href="http://www.amazon.com/iPad-Missing-Manual-Biersdorfer-J-D/dp/1449301738%3FSubscriptionId%3D0R7FMW7AXRVCYMAPTPR2%26tag%3Dws%26linkCode%3Dxm2%26camp%3D2025%26creative%3D165953%26creativeASIN%3D1449301738">iPad 2: The Missing Manual</a><cite>USD$13.74</cite></li><li><a href="http://www.amazon.com/Survival-Guide-Step-Step-ebook/dp/B004L9LDAW%3FSubscriptionId%3D0R7FMW7AXRVCYMAPTPR2%26tag%3Dws%26linkCode%3Dxm2%26camp%3D2025%26creative%3D165953%26creativeASIN%3DB004L9LDAW">iPad Survival Guide - Step-by-Step User Guide for Apple iPad: Getting Started, Downloading FREE eBooks, Using eMail, Photos and Videos, and Surfing Web (Mobi Manuals)</a><cite>USD$2.99</cite></li><li><a href="http://www.amazon.com/Damon-Browns-Simple-Update-ebook/dp/B003GIRSXA%3FSubscriptionId%3D0R7FMW7AXRVCYMAPTPR2%26tag%3Dws%26linkCode%3Dxm2%26camp%3D2025%26creative%3D165953%26creativeASIN%3DB003GIRSXA">Damon Brown\'s Simple Guide to the iPad (iPad 2 Update)</a><cite>USD$2.99</cite></li><li><a href="http://www.amazon.com/iPad-Missing-J-D-Biersdorfer/dp/1449387845%3FSubscriptionId%3D0R7FMW7AXRVCYMAPTPR2%26tag%3Dws%26linkCode%3Dxm2%26camp%3D2025%26creative%3D165953%26creativeASIN%3D1449387845">iPad: The Missing Manual</a><cite>USD$36.89</cite></li></ul>'
          //        +'<a href="http://www.amazon.com/s?ie=UTF8&index=blended&field-keywords={searchTerms}&tag=diigo0c-20"><img src="http://www.amazon.com/favicon.ico">123213 more results >></a></div>';
        //var html = '<div id=""><ul><li>dafdsafda</li><li>dasfdasf</li><li>dasfdasf</li><li>dasfdasf</li></ul></div>';
        //console.log(html);
        //console.log($("#scTopOfPageRefinementLinks").length);
        if($("#scTopOfPageRefinementLinks").length > 0) return;
        $('#rso').prepend(html);
        
        
          
    });
    
    
    
  }
  
  if(is_goods_keyword(keywords,element) && !$('#res ol').data("as_amzn_google_1")){
   // $('#res ol').data("as_amzn_google_2",true);
    //console.log('121');
    insert();
  }else{
    if(!$('#res ol').data("as_amzn_google_2")){
      $('#res ol').data("as_amzn_google_2",true);
      is_goods_keyword2(keywords,function(r){
        if(r){
         // $('#res ol').data("as_amzn_google_1",true);
          insert();
          }  
      });
    }
  }
}


var is_goods_keyword = function(keywords,element){
  var test_url = function(reg){
    var has_good = false;
    $(element).each(function(){
      if(reg.test($(this).attr('href'))){
        has_good = true;
        return false;
      }
    });
    return has_good;
  }
  var test_text = function(reg){
    var has_good = false;
    $(element).each(function(){
      if(reg.test($(this).text())){
        has_good = true;
        return false;
      }
    });
    return has_good;
  }
  
  var has_amazon = test_url(/www\.amazon\..*/);
  var has_ebay = test_url(/www\.ebay\..*/);
  var has_google_books = test_url(/books\.google\.com/);
  var has_buy = test_url(/www\.buy\.com/);
  var has_bestbuy = test_url(/www\.bestbuy\..*/);
  var has_shoppings = test_text(/Shopping results for /);
  
  var has_ecomm_verbs = /(^(B|b)uy |^(S|s)hop for|.* dvd.*|.*dvd .*|^(D|d)vd|^(C|c)heap)/.test(keywords);
  
  return has_amazon || has_bestbuy || has_buy || has_ebay ||has_ecomm_verbs || has_google_books || has_shoppings;
}

var is_goods_keyword2 = function(keywords,callback){
  //$.get("http://ajax.googleapis.com/ajax/services/search/web?v=1.0&rsz=large&start=8&q=" + encodeURIComponent(keywords), {}, function(data)
  chrome.extension.sendRequest({action:'get_google_search',keywords:keywords},function(data){
        //console.log(typeof data);
        data = JSON.parse(data);
        for(var i in data["responseData"]["results"])
      {
          var url = data["responseData"]["results"][i]["unescapedUrl"];
          if(/www\.amazon\.com/.test(url) || /www\.ebay\.com/.test(url) || 
              /www\.buy\.com/.test(url) || /www\.bestbuy\.com/.test(url))
          {
              callback(true);
          }
      }
      callback(false);
        
          
    });
      
}



chrome.extension.sendRequest({action:'get_option'},function(response){
    if(response.options == undefined) var msObj={};
    else var msObj = JSON.parse(response.options);
    /*if(msObj.amazon_google == undefined || msObj.amazon_google.enable ==true){
      amazon_google();
    }*/
    /*if(msObj.similar ==undefined || msObj.similar.enable == true){
      insert_similar();
    }*/
    
  });
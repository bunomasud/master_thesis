document.documentElement.style.webkitTouchCallout = "none";
$.mobile.page.prototype.options.backBtnText = "";
$.urlParam = function(name){
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	return results[1] || 0;
}
document.ontouchmove = function(e){ e.preventDefault(); }
var activeTab ="";
var myScoll = null;
var allScroll = null;
var detailsScroll = null;
var categoryScroll = null;
function destroyScroller()
{
myScroll.destroy();
myScroll = null;
}
var isTouching = false;

$('.fast-list .fast-li, #fav-list .fav-li-item .fav-list-link').live('touchstart ', function(event) 
{			
	var item = event.currentTarget;
	if(isTouching) return;
	item.moved = false;
	isTouching = true;
});

$('.fast-list .fast-li, #fav-list .fav-li-item .fav-list-link').live('touchmove ', function(event) 
{	
	event.currentTarget.moved = true;
	$(this).removeClass("selected");
});

$('.fast-list .fast-li, #fav-list .fav-li-item .fav-list-link').live('touchend', function(event) 
{	
	var item = event.currentTarget;

	isTouching = false;

	if(!item.moved) 
	{   
		var $this = $(this);
		$this.addClass("selected");
		var site = $this.attr("data-pageurl");
		
		//Wechsele Seite auf neue Seite "site"
		$.mobile.changePage( site, { transition: 'slide-sim' } );
		
		setTimeout(function(){
			  $this.removeClass("selected");
		},700);
		event.preventDefault();
	}

	
	delete item.moved; //Entferne Flag
});

				$('.go-to-cat-header').live('touchstart ', function(event) 
				{			
					var item = event.currentTarget;
					if(isTouching) return;
					item.moved = false;
					isTouching = true;
				});
				$('.go-to-cat-header').live('touchmove ', function(event) 
				{	
 					event.currentTarget.moved = true;
				});
				$('.go-to-cat-header').live('touchend', function(event) 
				{	
 					var item = event.currentTarget;
  
			  		isTouching = false;
			
			  		if(!item.moved) 
					{   
						$this = $(this);
						activeTab = $this.attr("data-activetab");
						var site = "#category-page?category=" + $this.attr("data-cat");
						
						$.mobile.changePage( site, { transition: 'slide-sim' } );

						event.preventDefault();
			  		}
			  
			  		
			  		delete item.moved; //Entferne Flage
				});
				$(".go-back-to-cat-header, .custom-back-btn").live('touchstart ', function(event) 
				{			
					var item = event.currentTarget;
					if(isTouching) return;
					item.moved = false;
					isTouching = true;
				});
				
				$(".go-back-to-cat-header, .custom-back-btn").live('touchmove ', function(event) 
				{	
 					event.currentTarget.moved = true;
				});
				
				$(".go-back-to-cat-header, .custom-back-btn").live('touchend', function(event) 
				{	
 					var item = event.currentTarget;
  
			  		isTouching = false;
			
			  		if(!item.moved) 
					{   
						if(activeTab != "categories")
						{
							history.back();
						}
						else
						{
							if($.mobile.activePage.attr("id") == "category-page")
							{
								$.mobile.changePage( "#categories", {  transition: 'slide-sim', "reverse":"true" });
							}
							else
							{
								history.back();
							}
						}
						
						event.preventDefault();
			  		}
			  		delete item.moved; //Entferne Flage
				});

				$('.external-share-btn').live('touchstart ', function(event) 
				{			
					var item = event.currentTarget;
					if(isTouching) return;
					item.moved = false;
					isTouching = true;
				});

				$('.external-share-btn').live('touchmove ', function(event) 
				{	
 					event.currentTarget.moved = true;
				});

				$('.external-share-btn').live('touchend', function(event) 
				{	
 					var item = event.currentTarget;
  
			  		isTouching = false;
			
			  		if(!item.moved) 
					{   
						window.location.href = $(this).attr("href");
						event.preventDefault();
			  		}
			  
			  		
			  		delete item.moved; //Entferne Flage
				});
				

			$(document).bind( "pagebeforechange", function( e, data ) {
				if ( typeof data.toPage === "string" ) {
					var u = $.mobile.path.parseUrl( data.toPage );
					var activePageId = $($.mobile.activePage).attr("id");
					if ( u.hash.search(/^#category-page/) !== -1 && activePageId != "details-page") 
					{	
						showCategoryPage( u, data.options , true, activePageId);
						e.preventDefault();
					}
					else if(u.hash.search(/^#category-page/) !== -1 && activePageId == "details-page")
					{
						showCategoryPage( u, data.options , false, activePageId);
						e.preventDefault();
					}
					 else if( u.hash.search(/^#favorites-details-page/) !== -1)
					 {
						 showFavoritesDetailsPage( u, data.options , activePageId );
						 e.preventDefault();
					 }
					else if( u.hash.search(/^#details-page/) !== -1)
					{
						showDetailsPage( u, data.options , activePageId );
						e.preventDefault();
					}
					else if( u.hash.search(/^#details-single-page/) !== -1)
					{
						showSingleDetailsPage( u, data.options , activePageId );
						e.preventDefault();
					}
					else if( u.hash.search(/^#favorites/) !== -1)
					{
						showFavoritesPage( u, data.options );
						e.preventDefault();
					}
					else if( u.hash.search(/^#random/) !== -1)
					{
						showRandomPage( u, data.options );
						e.preventDefault();
					}
				}
			});
			
			function showRandomPage(urlObj, options)
			{
			
				var shouldRefresh = $("#random").attr("data-refresh");
				if(shouldRefresh == "true")
				{
					$.getJSON('content/json/content-min.json', function(json) 
					{

						var allContent = new Array();
						$.each(json, function(i, category) 
						{
							allContent.push(category);
						});
						var rand = Math.round(Math.random()*(allContent.length-1));
						var catContent = allContent[rand];
						var targetItems = new Array();
						$.each(catContent['items'], function(i, item){
							targetItems.push("item_"+item.content_id);
						});
	rand = Math.round(Math.random()*(targetItems.length-1));
						var randonContent = catContent["items"][targetItems[rand]];
						var randomSlider = $("#random").find("#slider");
						var firstRand = $("#first_rand");	
						firstRand.find(".details-headline").html( randonContent.title);
						firstRand.find(".details-content-text").html( randonContent.text);
						firstRand.find(".details-cat-img").attr("src","media/icons/cat-"+catContent.cat_id+"-icon@2x.png");
						firstRand.find(".random-cat-headline").html(""+catContent.cat_name+"").removeClass().addClass("random-cat-headline").addClass("color-"+catContent.cat_id);
						firstRand.find(".share-btn").attr("data-title",""+ randonContent.title +"").attr("data-text",""+ randonContent.text +"");
						firstRand.find(".details-header-container").attr("data-cat",catContent.cat_id);
	
						firstRand.attr("data-active-id", randonContent.content_id);
						firstRand.attr("data-active-cat", "cat_" + catContent.cat_id);
						randomSlider.attr("data-slide-id", randonContent.content_id);
						randomSlider.attr("data-slide-cat", "cat_" + catContent.cat_id);
						try 
						{
							db.transaction(function(transaction) {
								transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
							});
						} 
						catch(e) 
						{
							  
							alert("Favoriten konnten nicht geladen werden!");
							  
						}
							  
							  
						function queryFavSuccess(tx, results) 
						{
							  
							var len = results.rows.length;
							var isFav = false;
							for(var i = 0; i < len; i++)
							{
							  if(results.rows.item(i).contentid == randonContent.content_id)
							  {
								isFav = true;
							  }
							}
							  
							 var randomFavBtn = $("#random").find(".add-to-fav-list-btn");
							  
							if(!isFav)
							{
							  randomFavBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
							}
							else
							{
							  randomFavBtn.attr("data-action", "remove").addClass("add-to-fav-list-btn-selected");
							}
							  
						}                                                   
							  
							  
						function errorFavCB(err) 
						{
							alert("ww-error");
						} 
						
					var $page = $("#random");
						$page.page();
						options.dataUrl = urlObj.href;
						$.mobile.changePage( $page, options );
											
						
					});
				}
				else
				{
					var $page = $("#random");
					$page.page();
					options.dataUrl = urlObj.href;
					$.mobile.changePage( $page, options );
				}
				
				
			}
			

			function showCategoryPage( urlObj, options , scrollToTop, fromPage)
			{
				
				var cat = "cat_" + urlObj.hash.replace( "#category-page?category=", "" );
				var pageSelector = urlObj.hash.replace( /\?.*$/, "" );
	

				if ( cat ) 
				{

					var $page = $( pageSelector );
					
					$header = $page.find( ":jqmData(role=header)" );
					
					// Seiten Footer Variable
					$footer = $page.find( ":jqmData(role=footer)" );
		
					// Seiten Content Variable
					$content = $page.find( ":jqmData(role=content)" );
					
					
					var listContent = "";

					//hole Content
					$.getJSON('content/json/content-min.json', function(json) 
					{
						//Das selektierte Kategorie Objekt 
						var category = json[cat];
						var counter = 0;
						
						//erstelle Kategorie Liste
						$.each(category.items, function(i, content) 
						{

							listContent += '<li class="fast-li" data-pageurl="#details-page?category=cat_'+ category.cat_id +'&id='+ content.content_id +'"><h3 class="sub-cat-list-headline">'+ content.title +'</h3></li>';
							counter += 1;
						});
						
						var cl = $('#category-list');
						
						cl.html(listContent);
						
						//Setze die Überschrift auf den Kategorie Namen
						$header.find( "h1" ).html( category.cat_name );
						
						//Fülle Seite mit Content
						var id = cat.replace("cat_","");
						$content.find("#category-page-header-img").attr("src","media/icons/cat-"+id+"-icon@2x.png");
						$content.find("#category-page-headline").html(category.cat_name).removeClass().addClass("color-"+id);
						$content.find("#category-page-tipp-counter").html("Enthält " + counter + " Tipps");
						
						
						
						if(scrollToTop)
						{
							if(categoryScroll)categoryScroll.scrollTo(0,0);

								
						}
						
						switch(fromPage)
						{
							
							case "details-single-page":	$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".all-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							case "random":			$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".random-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							case "favorites":		$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".favorites-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							case "favorites-details-page":		$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".favorites-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							case "categories": 		$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".ctegories-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							default: break;
						}
						$page.page();
						options.dataUrl = urlObj.href;
						$.mobile.changePage( $page, options );
						cl.listview('refresh');
					});
				}
			}
			function showDetailsPage( urlObj, options ,fromPage)
			{
				
				var tmp = urlObj.hash.replace( "#details-page?", "" );
				var data = tmp.split("&");
				var catId = data[0].replace("category=","");
				var contentId = "item_" + data[1].replace("id=","");
				var pageSelector = urlObj.hash.replace( /\?.*$/, "" );
				if ( contentId ) 
				{
					var $page = $( pageSelector );
					$.getJSON('content/json/content-min.json' ,function(json) {
						var content = json[catId]["items"][contentId];
						$header = $page.find( ":jqmData(role=header)" ),
						$content = $page.find( ":jqmData(role=content)" ),
						$footer = $page.find( ":jqmData(role=footer)" );
						var favListBtn = $header.find(".add-to-fav-list-btn");
						var mDetailsItem = $content.find("#main-details-item");
						var slider = $content.find("#details-slider");
						$header.find( "h1" ).html( json[catId].cat_name );
						favListBtn.attr("rel", content.content_id).attr("data-catid", catId);
						mDetailsItem.find(".details-headline").html( content.title);
						var id = catId.replace("cat_","");
						mDetailsItem.find(".details-cat-headline").html(json[catId].cat_name).removeClass().addClass("details-cat-headline").addClass("color-"+id);
						mDetailsItem.find(".details-content-text").html( content.text);
						mDetailsItem.find(".share-btn").attr("data-title",""+ content.title +"").attr("data-text",""+ content.text +"");
						
						mDetailsItem.attr("data-active-id", content.content_id).attr("data-active-cat", catId);
						slider.attr("data-slide-id", content.content_id).attr("data-slide-cat", catId);
						$content.find(".details-cat-img").attr("src","media/icons/cat-"+id+"-icon@2x.png");
						var startItemPosition = 0;
						var totalItems = 0;
						var stopCounter = false;
						$.each(json[catId]["items"], function(i, catitem) 
						{
							if(catitem.content_id != content.content_id && !stopCounter){
								startItemPosition += 1;
								totalItems += 1;
							}
							else
							{
								totalItems += 1;
								stopCounter = true
							}
						});
						mDetailsItem.find(".tipp-counter").html("Tipp "+ (startItemPosition+1) + " von " + totalItems);
						try 
						{
                      		db.transaction(function(transaction) {
               					transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
                           	});
                  		} 
						catch(e) 
						{
                        	alert("Favoriten konnten nicht geladen werden!");
                      	}
                        function queryFavSuccess(tx, results) 
                        {
                            var len = results.rows.length;
                            var isFav = false;
                            for(var i = 0; i < len; i++)
                            {
                              if(results.rows.item(i).contentid == content.content_id)
                              {
                                isFav = true;
                              }
                            }
                            var favListBtn = $header.find(".add-to-fav-list-btn");
                            if(!isFav)
                            {
                              favListBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
                            }
                            else
                            {
                              favListBtn.attr("data-action", "remove").addClass("add-to-fav-list-btn-selected");
                            }
                        }                                                   
                        function errorFavCB(err) 
						{
                            alert("ww-error");
                        }
						if(activeTab == "all")
						{
							$footer.find("a").removeClass("ui-btn-active ui-state-persist");
							$footer.find(".all-nav-link").addClass("ui-btn-active ui-state-persist");	
						}
						else if(activeTab == "random")
						{
							$footer.find("a").removeClass("ui-btn-active ui-state-persist");
							$footer.find(".random-nav-link").addClass("ui-btn-active ui-state-persist");
						}
						else if(activeTab == "favorites")
						{
							$footer.find("a").removeClass("ui-btn-active ui-state-persist");
							$footer.find(".favorites-nav-link").addClass("ui-btn-active ui-state-persist");
						}
						else
						{
							switch(fromPage)
							{
								case "category-page": 	$footer.find("a").removeClass("ui-btn-active ui-state-persist");
														$footer.find(".ctegories-nav-link").addClass("ui-btn-active ui-state-persist");
														break;
								case "all":				$footer.find("a").removeClass("ui-btn-active ui-state-persist");
														$footer.find(".all-nav-link").addClass("ui-btn-active ui-state-persist");
														break;
								case "favorites":		$footer.find("a").removeClass("ui-btn-active ui-state-persist");
														$footer.find(".favorites-nav-link").addClass("ui-btn-active ui-state-persist");
														break;
								default: break;
							}
						
						}
						$page.page();
						options.dataUrl = urlObj.href;
						$.mobile.changePage( $page, options );
					});
				}
			}
			
			function showFavoritesPage(urlObj, options)
			{
				try 
				{
					db.transaction(function(transaction) {
						transaction.executeSql('SELECT * FROM FAVORITES', [], querySuccess, errorCB);
					});
				} 
				catch(e) 
				{
					console.log("Fehler beim Laden der Favoriten. SQL ERROR: "+err.code);
				}
				function querySuccess(tx, results) 
				{
					var len = results.rows.length;
					$("#fav-list").html("");
					$.getJSON('content/json/content-min.json' ,function(json) {
						var listContent = "";
						var content;
						for (var i=0;  i < len; i++)
						{
							content = json[results.rows.item(i).category]["items"]["item_"+results.rows.item(i).contentid];
							
							var id = results.rows.item(i).category.replace("cat_","");
							
							listContent += "<li data-contentid=\""+content.content_id+"\" class=\"fav-li-item\" data-icon=\"false\" ><b data-pageurl=\"#favorites-details-page?category="+ results.rows.item(i).category +"&id="+ content.content_id +"\" class=\"fav-list-link\"><img class=\"fav-list-icon\" src=\"media/icons/cat-"+ id +"-icon@2x.png\"/><h3 class=\"fav-list-headline\">"+content.title+"</h3></b></li>";
							
		
						}
						$favlist = $('#fav-list');
						$favlist.append(listContent);
						var $page = $( "#favorites" );
						$header = $page.find( ":jqmData(role=header)" );
						$header.find('h1').html("Favoriten (" + len + ")");
						$favlist.attr("data-favcount",len);
						$page.page();
						options.dataUrl = urlObj.href;
						$.mobile.changePage( $page, options );
						$favlist.listview('refresh');
					});
					
				}

				function errorCB(err) {
					console.log("Error processing SQL: "+err.code);
				}
			}
			function showFavoritesDetailsPage( urlObj, options ,fromPage)
			{
				var tmp = urlObj.hash.replace( "#favorites-details-page?", "" );
				var data = tmp.split("&");
				var catId = data[0].replace("category=","");
				var contentId = "item_" + data[1].replace("id=","");
				var pageSelector = urlObj.hash.replace( /\?.*$/, "" );
				if ( contentId ) 
				{
					var $page = $( pageSelector );
					var shouldRefresh = $("#favorites-details-page").attr("data-refresh");
					if(shouldRefresh == "true")
					{
						$.getJSON('content/json/content-min.json' ,function(json) {
							var content = json[catId]["items"][contentId];
							$header = $page.find( ":jqmData(role=header)" ),
							$content = $page.find( ":jqmData(role=content)" ),
							$footer = $page.find( ":jqmData(role=footer)" );
							var favListBtn = $header.find(".add-to-fav-list-btn");
							var favoritesDetailsItem = $content.find("#favorites-main-details-item");
							var slider = $content.find("#favorites-slider");
							var position = 0;
							var stoper = false;
							var totalFavs = 0;
							$("#fav-list").children("li").each(function() {
								if($(this).attr("data-contentid") == content.content_id && !stoper)
								{
									position +=1;
									stoper = true;
								}
								else if(!stoper)
								{
									position +=1;
								}
								totalFavs += 1;
							});
							var headline = $header.find("h1").html();
							$header.find( "h1" ).html( "Favoriten" );
							favListBtn.attr("rel", content.content_id).attr("data-catid", catId).attr("data-action","remove").removeClass("add-to-fav-list-btn-selected").addClass("add-to-fav-list-btn-selected");
							
							favoritesDetailsItem.find(".details-cat-headline").html(json[catId].cat_name).removeClass().addClass("details-cat-headline");
							
							var id = catId.replace("cat_","");
							favoritesDetailsItem.find(".details-header-container").attr("data-cat",id);
							favoritesDetailsItem.find(".details-cat-headline").addClass("color-"+id);
							favoritesDetailsItem.find(".details-cat-img").attr("src","media/icons/cat-"+id+"-icon@2x.png");
							favoritesDetailsItem.find(".details-headline").html( content.title);
							favoritesDetailsItem.find(".details-content-text").html( content.text);
							favoritesDetailsItem.find(".share-btn").attr("data-title",""+ content.title +"").attr("data-text",""+ content.text +"");
							favoritesDetailsItem.attr("data-active-id", content.content_id);
							favoritesDetailsItem.attr("data-active-cat", catId);
							slider.attr("data-slide-id", content.content_id);
							slider.attr("data-slide-cat", catId);
	
							favoritesDetailsItem.find(".tipp-counter").html("Favorit " + position + " von " + totalFavs);
						  
					
							$page.page();
							options.dataUrl = urlObj.href;
							$.mobile.changePage( $page, options );

						});
					}
					else
					{
						$page.page();
						options.dataUrl = urlObj.href;
						$.mobile.changePage( $page, options );
					}
					
				}
				
			}

			function showSingleDetailsPage( urlObj, options ,fromPage)
			{
				var tmp = urlObj.hash.replace( "#details-single-page?", "" );
				var data = tmp.split("&");
				var catId = data[0].replace("category=","");
				var contentId = "item_" + data[1].replace("id=","");
				var pageSelector = urlObj.hash.replace( /\?.*$/, "" );
				if ( contentId ) 
				{

					var $page = $( pageSelector );
					$.getJSON('content/json/content-min.json' ,function(json) {
						var content = json[catId]["items"][contentId];
						$header = $page.find( ":jqmData(role=header)" ),
						$content = $page.find( ":jqmData(role=content)" ),
						$footer = $page.find( ":jqmData(role=footer)" );
						var favListBtn = $header.find(".add-to-fav-list-btn");
						$header.find( "h1" ).html( json[catId].cat_name );
						$content.find( ".details-header-container" ).attr( "data-cat",json[catId].cat_id );
						favListBtn.attr("rel", content.content_id).attr("data-catid", catId);
						$content.find(".details-single-cat-headline").removeClass().addClass("details-single-cat-headline").html( json[catId].cat_name);
						$content.find("#details-item-category").html( json[catId].cat_name);
						$content.find("#details-item-name").html( content.title);
						$content.find("#details-item-content").html( content.text);
						$content.find(".share-btn").attr("data-title",content.title).attr("data-text",content.text);
						var id = catId.replace("cat_","");
						$content.find(".details-cat-img").attr("src","media/icons/cat-"+id+"-icon@2x.png");
						$content.find(".details-single-cat-headline").addClass("color-"+id);
                    	try 
						{
                      		db.transaction(function(transaction) {
               					transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
                           	});
                  		} 
						catch(e) 
						{
                        	alert("Favoriten konnten nicht geladen werden!");
                      	}
                        function queryFavSuccess(tx, results) 
                        {
                            var len = results.rows.length;
                            var isFav = false;
                            for(var i = 0; i < len; i++)
                            {
                              if(results.rows.item(i).contentid == content.content_id)
                              {
                                isFav = true;
                              }
                            }
                            var favListBtn = $header.find(".add-to-fav-list-btn");
                            if(!isFav)
                            {
                              favListBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
                            }
                            else
                            {
                              favListBtn.attr("data-action", "remove").addClass("add-to-fav-list-btn-selected");
                            }
                        }                                                   
                        function errorFavCB(err) 
						{
                            alert("ww-error");
                        }
						switch(fromPage)
						{
							case "category-page": 	$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".all-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							case "all":				$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".all-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							case "favorites":		$footer.find("a").removeClass("ui-btn-active ui-state-persist");
													$footer.find(".favorites-nav-link").addClass("ui-btn-active ui-state-persist");
													break;
							default: break;
						}
						$page.page();
						options.dataUrl = urlObj.href;
						$.mobile.changePage( $page, options );
					});
				}
			}
			$(".add-to-fav-list-btn").live("touchend", function(){ 
				var target = $(this).attr("rel");
				var category = $(this).attr("data-catid");
				var _this = $(this);
				if(_this.attr("data-action") == "add")
				{
					try 
					{               
                       db.transaction(function(transaction) {
                          transaction.executeSql('SELECT * FROM FAVORITES WHERE contentid = "'+ target +'"', [], querySuccess, errorCB);
                       });
                       function querySuccess(tx,results)
                       {
                           var len = results.rows.length;                
                            if(len < 1)
                            {
                                db.transaction(function(transaction) {
															  
                                        transaction.executeSql('INSERT INTO FAVORITES (contentid,title,text ,category) VALUES ("'+target+'","","","'+category+'")');
															  
                                });
                                _this.attr("data-action","remove").addClass("add-to-fav-list-btn-selected");
                            }
                        }
                        function errorCB()
                        {
                               alert("error");            
                        }
                   	} 
					catch(e) 
					{
						alert("Konnte Tip nicht zu den Favoriten hinzufügen!");
					}                                         			
				}
				else
                {
					try 
					{ 
						db.transaction(function(transaction) {
							transaction.executeSql('DELETE FROM FAVORITES WHERE contentid = "'+ target +'"');
						});
						_this.attr("data-action","add").removeClass("add-to-fav-list-btn-selected");
					} 
					catch(e) 
					{
						alert("Konnte Tip nicht von den Favoriten entfernen!");
					} 
				}
			});
			$(document).delegate('.share-btn', 'touchend', function() {
				event.stopPropagation();
				event.preventDefault();	
				var $this = $(this);
				isTouching = false;
					var $this = $(this);
					if($this.attr("id") != "info-share-btn")
					{
						var title = $this.attr("data-title");
						var text = $this.attr("data-text");
						var shareContent = "<p data-role=\"button\" onclick='window.plugins.childBrowser.showWebPage(\"http://m.facebook.com/dialog/feed?app_id=399454800104968&link=http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828&picture=http://www.next-healthlab.de/sites/default/files/images/99-Tipps-Gesundheit.png&name=99%20Tipps%20f%26uuml;r%20mehr%20Gesundheit&caption=Deine%20App%20f%26uuml;r%20mehr%20Gesundheit&description=Mit%20der%20App%2099%20Tipps%20f%26uuml;r%20mehr%20Gesundheit%20wird%20Gesundheit%20zu%20deinem%20st%26auml;ndigen%20Begleiter.%20Jetzt%20herunterladen.&redirect_uri=http://www.next-healthlab.de/\");$.mobile.sdCurrentDialog.close();return false;'>Facebook</p>";
						 shareContent += "<p data-role=\"button\" onclick='window.plugins.childBrowser.showWebPage(\"https://twitter.com/share?url=http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828&text=Mit%20der%20App%2099%20Tipps%20f%C3%BCr%20mehr%20Gesundheit%20wird%20Gesundheit%20zu%20deinem%20st%C3%A4ndigen%20Begleiter.%20Jetzt%20herunterladen%20auf:\");$.mobile.sdCurrentDialog.close();return false;'>Twitter</p>";						 
						 shareContent += "<p data-role=\"button\" onclick='sendMail(\""+title+"\",\""+text+"\");$.mobile.sdCurrentDialog.close();return false;'>Email</p>"; 
						 shareContent += '<br/><br/>';  
						 shareContent += '<a rel=\"close\" data-role=\"button\" href=\"#\" id=\"simpleclose\">Schließen</a>';  
						
					}
					else
					{
						var title = "99 Tipps für mehr Gesundheit";
						var text = "Die \"99 Tipps für mehr Gesundheit\" machen dein Leben gesünder. In einfachen Themenblöcken findest du alles, was du rund um das Thema Gesundheit wissen musst und erhälst konkrete Praxistipps für deinen Alltag. Mach' Gesundheit zu deinem Begleiter mit den \"99 Tipps für mehr Gesundheit\". Jetzt testen und herunterladen auf: <a href=\"http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828\">99 Tipps für mehr Gesundheit</a>";
						var shareContent = "<p data-role=\"button\" onclick='window.plugins.childBrowser.showWebPage(\"http://m.facebook.com/dialog/feed?app_id=399454800104968&link=http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828&picture=http://www.next-healthlab.de/sites/default/files/images/99-Tipps-Gesundheit.png&name=99%20Tipps%20f%26uuml;r%20mehr%20Gesundheit&caption=Deine%20App%20f%26uuml;r%20mehr%20Gesundheit&description=Mit%20der%20App%2099%20Tipps%20f%26uuml;r%20mehr%20Gesundheit%20wird%20Gesundheit%20zu%20deinem%20st%26auml;ndigen%20Begleiter.%20Jetzt%20herunterladen.&redirect_uri=http://www.next-healthlab.de/\");$.mobile.sdCurrentDialog.close();return false;'>Facebook</p>";
						shareContent += "<p data-role=\"button\" onclick='window.plugins.childBrowser.showWebPage(\"https://twitter.com/share?url=http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828&text=Mit%20der%20App%2099%20Tipps%20f%C3%BCr%20mehr%20Gesundheit%20wird%20Gesundheit%20zu%20deinem%20st%C3%A4ndigen%20Begleiter.%20Jetzt%20herunterladen%20auf:\");$.mobile.sdCurrentDialog.close();return false;'>Twitter</p>";
						shareContent += "<p data-role=\"button\" onclick='sendMail(\"\",\"\");$.mobile.sdCurrentDialog.close();return false;'>Email</p>"; 
						shareContent += '<br/><br/>';  
						shareContent += '<a rel=\"close\" data-role=\"button\" href=\"#\" id=\"simpleclose\">Schließen</a>';  
	
						
					}
					
					$(document).simpledialog2({
						'mode' : 'blank',
						//'prompt': false,
						'forceInput': false,
						//'useModal':true,
						'showModal':true,
						//'useDialogForceFalse':true,
						//'fullHTML' : shareContent
						'blankContent' : shareContent,
						'top':70,
						'transition':'pop-sim',
						'animate':true
						
					})

		  
				return false;
			});

$('#categories').live( 'pageinit',function(event){

	$.getJSON('content/json/content-min.json', function(json) 
	{
		var listContent = "";
		var counter = 0;
		$.each(json, function(i, category) 
		{
			counter = 0;
			$.each(category.items, function(i, catitem) 
			{
				counter += 1;
			});
			listContent += '<li class="fast-li main-list-li" data-pageurl="#category-page?category='+ category.cat_id +'"><div class="cat-list-icon"><img src="media/icons/cat-'+ category.cat_id +'-icon@2x.png" class="cat-img"/></div><h3 class="cat-list-headline color-'+category.cat_id+'">'+ category.cat_name +'</h3><p class="sub-text">Enthält '+ counter +' Tipps</p></li>';
		});
		var mcl = $('#main-category-list');
		mcl.html(listContent);
		mcl.listview('refresh');
	});
	$('#categories').bind('pageshow', function() 
	{
		activeTab = "categories";
	});
});
$('#category-page').bind('pageinit', function() 
{
	categoryScroll = new iScroll("category-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(categoryScroll)categoryScroll.refresh();
});	
$('#category-page').bind('pageshow', function() 
{
	if(categoryScroll)setTimeout(categoryScroll.refresh(),300);
});

$('#details-page').bind('pageinit', function() 
{
	new Swipe(
		document.getElementById('details-slider'),
		{
		  "startSlide" : 1,
		  "speed" : 400,
		  "slideChanged":handleDetailsSlideChange,
		  "isLoop" : true
		}
	  
	);
	$('#details-page').bind('pagehide', function() 
	{	if(myScroll)destroyScroller();
		
		var first = $('#details-slider-inner-container').children(':first');
		var last = $('#details-slider-inner-container').children(':last');
		if(first.attr("id") != undefined)
		{
			$('#details-slider-inner-container').prepend(last);
		}
		else if(last.attr("id") != undefined)
		{
			$('#details-slider-inner-container').append(first);							
		}
		$("#details-page").find(".share-btn").attr("data-title","").attr("data-text","");
		$('#details-page').unbind("changeDetailsSlideContent")	
	});

	$('#details-page').bind('pageshow', function() 
	{

		$.getJSON('content/json/content-min.json', function(json) 
		{
			
			var cat = $.urlParam("category");
			var itemId = $.urlParam("id");
			var category = json[cat];
			var sliderContent = new Array();
			var startItemPosition = 0;
			var stopCounter = false;
			$.each(category.items, function(i, catitem) 
			{
				catitem.cat_name = category.cat_name;
				catitem.cat_id = cat;
				sliderContent.push(catitem);
				
				if(catitem.content_id != itemId && !stopCounter)
				{
					startItemPosition += 1;
				}
				else
				{
					stopCounter = true
				}
				
				
			});
			$('#details-slider').attr("data-page-nr",startItemPosition);
			createDetailsSliderSubContent(sliderContent);
			$('#details-page').bind('changeDetailsSlideContent', function(e) { 
				createDetailsSliderSubContent(sliderContent);
			});
		});
		myScroll = new iScroll("details-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(myScroll)myScroll.refresh();
	});
});
function handleDetailsSlideChange(direction)
{
	var detailsSlider = $('#details-slider');
	if(direction == 1)
	{
		var first = $('#details-slider-inner-container').children(':first');
		$('#details-slider-inner-container').append(first);
		var newIndex = parseInt(detailsSlider.attr("data-page-nr")) + 1;
		detailsSlider.attr("data-page-nr",newIndex);
		$('#details-page').trigger('changeDetailsSlideContent');
	}
	else if(direction == -1)
	{
		var last = $('#details-slider-inner-container').children(':last');
		$('#details-slider-inner-container').prepend(last);
		var newIndex = parseInt(detailsSlider.attr("data-page-nr")) - 1;
		detailsSlider.attr("data-page-nr",newIndex);
		$('#details-page').trigger('changeDetailsSlideContent');
	}
	if(myScroll)myScroll.refresh();
}
function createDetailsSliderSubContent(allContent)
{
	
	var index = parseInt($('#details-slider').attr("data-page-nr"));
	var left;
	var right;
	var allContentLength = allContent.length;
	var detailsSlider = $('#details-slider');
	if(index <= 0)
	{
		if(index == 0)
		{
			left = allContentLength-1;
			right = index+1;
		}
		else
		{
			index = allContentLength-1;
			left = index-1;
			right = 0;
			detailsSlider.attr("data-page-nr",index);
		}
	}
	else if(index >= allContentLength-1)
	{
		if(index == allContentLength-1)
		{
			left = allContentLength-2;
			right = 0;
		}
		else
		{
			index = 0;
			left = allContentLength-1;
			right = index+1;
			detailsSlider.attr("data-page-nr",index);
		}
	}
	else if(index >= 1 || index <= allContentLength-1)
	{
		left = index-1;
		right = index+1;
	}
	var first = $('#details-slider-inner-container').children(':first');
	var last = $('#details-slider-inner-container').children(':last');		
	first.find(".details-headline").html( allContent[left].title);
	first.find(".details-content-text").html( allContent[left].text);
	first.find(".share-btn").attr("data-title",""+ allContent[left].title +"").attr("data-text",""+ allContent[left].text +"");
	first.find(".details-cat-headline").html(allContent[left].cat_name).removeClass().addClass("details-cat-headline");
	var id = allContent[left].cat_id.replace("cat_","");
	first.find(".details-cat-headline").addClass("color-"+id);
	first.find(".tipp-counter").html("Tipp " + (left+1) + " von " + allContentLength);
	first.attr("data-active-id",allContent[left].content_id);
	first.attr("data-active-cat",allContent[left].cat_id);
	last.find(".details-headline").html( allContent[right].title);
	last.find(".details-content-text").html( allContent[right].text);
	last.find(".share-btn").attr("data-title",""+ allContent[right].title +"").attr("data-text",""+ allContent[right].text +"");
	last.find(".details-cat-headline").html(allContent[right].cat_name).removeClass().addClass("details-cat-headline");
	var id = allContent[left].cat_id.replace("cat_","");
	last.find(".details-cat-headline").addClass("color-"+id);
	last.find(".tipp-counter").html("Tipp " + (right+1) + " von " + allContentLength);
	last.attr("data-active-id",allContent[right].content_id);
	last.attr("data-active-cat",allContent[right].cat_id);
	var currentItemId = $('#details-slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-id");
	detailsSlider.attr("data-slide-id",currentItemId);
	var currentItemCat = $('#details-slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-cat");
	detailsSlider.attr("data-slide-cat",currentItemCat);
	try 
	{
		db.transaction(function(transaction) {
			transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
		});
	} 
	catch(e) 
	{
		alert("Konnte nicht nachschauen ob der Tipp zu Deinen Favoriten gehört!");
	}
	function queryFavSuccess(tx, results) 
	{
		  
		var len = results.rows.length;
		var isFav = false;
		var currentItemId = $('#details-slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-id");
		
		for(var i = 0; i < len; i++)
		{
		  if(results.rows.item(i).contentid == currentItemId)
		  {
			isFav = true;
		  }
		}
		  
		var detailsPageFavBtn = $('#details-page').find(".add-to-fav-list-btn");
		var detailsSlider = $('#details-slider');
		
		detailsPageFavBtn.attr("rel",detailsSlider.attr("data-slide-id")).attr("data-catid",detailsSlider.attr("data-slide-cat"));
		  
		if(!isFav)
		{
		  detailsPageFavBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
		}
		else
		{
		  detailsPageFavBtn.attr("data-action", "remove").addClass("add-to-fav-list-btn-selected");
		}
	}                                                   
	function errorFavCB(err) 
	{
		alert("ww-error");
	}
}
$('#details-single-page').bind('pageinit', function() 
{
	$('#details-single-page').bind('pagehide', function() 
	{
		$('#details-single-page').find(".share-btn").attr("data-title","").attr("data-text","");	

	});
});
$('#details-single-page').bind('pagehide', function() 
{
	if(myScroll)destroyScroller();
});
$('#details-single-page').bind('pageshow', function() 
{
	myScroll = new iScroll("single-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(myScroll)myScroll.refresh();
});
$('#all').bind('pageinit', function() 
{
	$('.ui-input-text').attr("name","search");
	$.getJSON('content/json/content-min.json', function(json) 
	{
		var itemArray = new Array();
		$.each(json, function(i, category) 
		{
			$.each(category["items"], function(i, item) 
			{
				itemArray.push([category.cat_id,item]);
			});
		});
		itemArray.sort(sortByTitle);
		var listDividers = new Array();
		var listContent = "";
		var firstChar = "";
		$.each(itemArray, function(i, tip) 
		{
			firstChar = tip[1].title.charAt(0);
			if(listDividers[firstChar] == null)
			{
				listContent += '<li class=\'search-list-divider\'>'+ firstChar +'</li>';
				listDividers[firstChar] = true;
			}
			listContent += '<li data-filtertext="'+ tip[1].title + " "  + tip[1].text +'" class="fast-li" data-pageurl="#details-single-page?category=cat_'+ tip[0] +'&id='+ tip[1].content_id +'"><img class="all-list-icon" src="media/icons/cat-'+ tip[0] +'-icon@2x.png"/><h3 class="all-list-headline">'+ tip[1].title +'</h3></li>';
		});
		var searchList = $('#search-all-list');
		searchList.html(listContent);
		searchList.listview('refresh');
		allScroll = new iScroll("all-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(allScroll)allScroll.refresh();
	});
	$('.ui-input-text').keypress(function(event){
		if(event.keyCode == 13)
		{
			$(this).blur();
		}
	});
	$('.ui-input-text').blur(function(e){
		if(allScroll)allScroll.refresh();
	});
	$('.ui-input-clear').live("touchend", function(event){
		event.preventDefault();
		$('.ui-input-search input').val( "" );
		$('.ui-input-search input').trigger( "change" );
		$('.ui-input-clear').addClass( "ui-input-clear-hidden" );
		if(allScroll)allScroll.refresh();
	event.preventDefault();				 
	});
});

$('#all').bind('pageshow', function() 
{
	activeTab = "all";
});
function sortByTitle(a,b){
	var tmpA = a[1].title;
	var tmpB = b[1].title;
	
	tmpA = a[1].title.replace(/Ü/,"U");
	tmpB= b[1].title.replace(/Ü/,"U");
	return (tmpA < tmpB) ? -1 : 1;
}
$('.edit-favorites-btn').live("tap", function(){
	$(this).removeClass("edit-favorites-btn").addClass("save-favorites-btn");
	var $deleteBtn = $('<b>Löschen</b>').attr({
		'class': 'aDeleteBtn ui-btn-up-r'
	});
	$('.fav-li-item').prepend($deleteBtn);
});
$('.save-favorites-btn').live("tap", function(){
	$(this).removeClass("save-favorites-btn").addClass("edit-favorites-btn");
	$(".aDeleteBtn").remove();
});
$('.aDeleteBtn').live("tap", function(){
	var _this = $(this);
	var target = _this.parent(".fav-li-item").attr("data-contentid");
	try
	{
		db.transaction(function(transaction) {
			transaction.executeSql('DELETE FROM FAVORITES WHERE contentid = "'+ target +'"');
		});
		_this.parent(".fav-li-item").remove();	
		_this.remove();
	}
	catch(e)
	{
		alert("Konnte nicht gelöscht werden!");
	}
	try 
	{
		db.transaction(function(transaction) {
			transaction.executeSql('SELECT * FROM FAVORITES', [], function(tx, results){ var len = results.rows.length; $('#fav-headline').html("Favoriten (" + len + ")"); if(len == 0) $('.save-favorites-btn').removeClass("save-favorites-btn").addClass("edit-favorites-btn"); }, function(){});
		});
	} 
	catch(e) 
	{
	}
	return false;	
});
$('#favorites').bind('pageshow', function() 
{
	myScroll = new iScroll("favorites-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(myScroll)myScroll.refresh();
});
$('#favorites').bind('pagehide', function(event,ui) 
{
	$(".save-favorites-btn").removeClass("save-favorites-btn").addClass("edit-favorites-btn");
	$(".aDeleteBtn").remove();  
	if(myScroll)destroyScroller();
});
$('#random').bind('pageinit', function() 
{
	var slider = new Swipe(
	  document.getElementById('slider'),
	  {
		  "startSlide" : 1,
		  "speed" : 400,
		  "slideChanged":handleSlideChange,
		  "isLoop" : true
	  }
	  
	);
	var myShakeEvent = new Shake();
	myShakeEvent.start();
	myShakeEvent.shakeEventDidOccur = function() {
		handleSlideChange(1);
	}
	$('#random').bind('pageshow', function(e) { 
		myShakeEvent.start();
		$.getJSON('content/json/content-min.json', function(json) 
		{
			var allContent = new Array();
			$.each(json, function(i, category) 
			{
				allContent.push(category);
			});
			var shouldRefresh = $('#random').attr("data-refresh");
			if(shouldRefresh == "true")
			{
				createDailyContent(allContent);
				$('#random').bind('changeSlideContent', function(e) { 
					createDailyContent(allContent);
				});
			}
			$('#create-random-btn').bind('click', function(e) {
				var first = $('#slider-inner-container').children(':first');
				var last = $('#slider-inner-container').children(':last');
				if(first.attr("id") != undefined)
				{
					$('#slider-inner-container').prepend(last);
				}
				else if(last.attr("id") != undefined)
				{
					$('#slider-inner-container').append(first);							
				}
				createSingleDailyContent(allContent);
				createDailyContent(allContent);
			});
		});
		myScroll = new iScroll("random-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(myScroll)myScroll.refresh();
	});
	$('#random').bind('pagehide', function(e) { 
		myShakeEvent.stop();
		var $page = $( this );
		if($($.mobile.activePage).attr("id") != "category-page")
		{
			var first = $('#slider-inner-container').children(':first');
			var last = $('#slider-inner-container').children(':last');
			if(first.attr("id") != undefined)
			{
				$('#slider-inner-container').prepend(last);
			}
			else if(last.attr("id") != undefined)
			{
				$('#slider-inner-container').append(first);							
			}
			var randomFavBtn = $('#random').find(".add-to-fav-list-btn");
			randomFavBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
			$('#create-random-btn').unbind("click");
			$('#random').unbind("changeSlideContent").attr("data-refresh","true");	
		}
		else
		{
			$('#random').attr("data-refresh","false");	
		}
		if(myScroll)destroyScroller();
	});
});
function handleSlideChange(direction)
{
	if(direction == 1)
	{
		var first = $('#slider-inner-container').children(':first');
		$('#slider-inner-container').append(first);

		$('#random').trigger('changeSlideContent');
	}
	else if(direction == -1)
	{
		var last = $('#slider-inner-container').children(':last');
		$('#slider-inner-container').prepend(last);

		$('#random').trigger('changeSlideContent');
	}
	if(myScroll)myScroll.refresh();
}
function createDailyContent(allContent)
{
	var rand;
	var catContent;
	var targetItems;
	var randonContent;
	for(var i = 0; i < 2; i++)
	{
		rand = Math.round(Math.random()*(allContent.length-1));
		catContent = allContent[rand];
		targetItems = new Array();
		$.each(catContent['items'], function(i, item){
			targetItems.push("item_"+item.content_id);
		});
		rand = Math.round(Math.random()*(targetItems.length-1));
		randonContent = catContent["items"][targetItems[rand]];		
		if(i == 0)
		{
			var first = $('#slider-inner-container').children(':first');
			first.find(".details-headline").html( randonContent.title);
			first.find(".details-content-text").html( randonContent.text);
			first.find(".details-cat-img").attr("src","media/icons/cat-"+catContent.cat_id+"-icon@2x.png");
			first.find(".random-cat-headline").html(""+catContent.cat_name+"").removeClass().addClass("random-cat-headline").addClass("color-"+catContent.cat_id);
			first.find(".share-btn").attr("data-title",""+ randonContent.title +"").attr("data-text",""+ randonContent.text +"");
			first.attr("data-active-id",randonContent.content_id);
			first.attr("data-active-cat","cat_" + catContent.cat_id);
			first.find(".details-header-container").attr("data-cat",catContent.cat_id);
		}
		else
		{
			var last = $('#slider-inner-container').children(':last');
			last.find(".details-headline").html( randonContent.title);
			last.find(".details-content-text").html( randonContent.text);
			last.find(".details-cat-img").attr("src","media/icons/cat-"+catContent.cat_id+"-icon@2x.png");
			last.find(".random-cat-headline").html(""+catContent.cat_name+"").removeClass().addClass("random-cat-headline").addClass("color-"+catContent.cat_id);
			last.find(".share-btn").attr("data-title",""+ randonContent.title +"").attr("data-text",""+ randonContent.text +"");
			last.attr("data-active-id",randonContent.content_id);
			last.attr("data-active-cat","cat_" + catContent.cat_id);
			last.find(".details-header-container").attr("data-cat",catContent.cat_id);
		}		
	}
	var slider = $('#slider');
	var currentItemId = $('#slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-id");
	slider.attr("data-slide-id",currentItemId);
	var currentItemCat = $('#slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-cat");
	slider.attr("data-slide-cat",currentItemCat);
	try 
	{
		db.transaction(function(transaction) {
			transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
		});
	} 
	catch(e) 
	{
		alert("Konnte nicht nachschauen ob der Tipp zu Deinen Favoriten gehört!");
	}
	function queryFavSuccess(tx, results) 
	{
		var len = results.rows.length;
		var isFav = false;
		var currentItemId = $('#slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-id");
		for(var i = 0; i < len; i++)
		{
		  if(results.rows.item(i).contentid == currentItemId)
		  {
			isFav = true;
		  }
		}
		var randomFavBtn = $('#random').find(".add-to-fav-list-btn");
		var slider = $('#slider'); 
		randomFavBtn.attr("rel",slider.attr("data-slide-id")).attr("data-catid",slider.attr("data-slide-cat"));
		if(!isFav)
		{
		  randomFavBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
		}
		else
		{
		  randomFavBtn.attr("data-action", "remove").addClass("add-to-fav-list-btn-selected");
		}
	}                                                   
	function errorFavCB(err) 
	{
		alert("ww-error");
	}
}
function createSingleDailyContent(allContent)
{
	var rand = Math.round(Math.random()*(allContent.length-1));
	var catContent = allContent[rand];
	var targetItems = new Array();
	$.each(catContent['items'], function(i, item){
		targetItems.push("item_"+item.content_id);
	});
	rand = Math.round(Math.random()*(targetItems.length-1));
	var randonContent = catContent["items"][targetItems[rand]];
	var randomSlider = $("#random").find("#slider");
	var firstRand = $("#first_rand");	
	firstRand.find(".details-headline").html( randonContent.title);
	firstRand.find(".details-content-text").html( randonContent.text);
	firstRand.find(".details-cat-img").attr("src","media/icons/cat-"+catContent.cat_id+"-icon@2x.png");
	firstRand.find(".random-cat-headline").html(""+catContent.cat_name+"").removeClass().addClass("random-cat-headline").addClass("color-"+catContent.cat_id);
	firstRand.find(".share-btn").attr("data-title",""+ randonContent.title +"").attr("data-text",""+ randonContent.text +"");
	firstRand.find(".details-header-container").attr("data-cat",catContent.cat_id);
	firstRand.attr("data-active-id", randonContent.content_id);
	firstRand.attr("data-active-cat", "cat_" + catContent.cat_id);
	randomSlider.attr("data-slide-id", randonContent.content_id);
	randomSlider.attr("data-slide-cat", "cat_" + catContent.cat_id);
	try 
	{
		db.transaction(function(transaction) {
			transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
		});
	} 
	catch(e) 
	{
		alert("Favoriten konnten nicht geladen werden!");
	}
	function queryFavSuccess(tx, results) 
	{
		var len = results.rows.length;
		var isFav = false;
		for(var i = 0; i < len; i++)
		{
		  if(results.rows.item(i).contentid == randonContent.content_id)
		  {
			isFav = true;
		  }
		}
		 var randomFavBtn = $("#random").find(".add-to-fav-list-btn");
		if(!isFav)
		{
		  randomFavBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
		}
		else
		{
		  randomFavBtn.attr("data-action", "remove").addClass("add-to-fav-list-btn-selected");
		}
	}                                                   
	function errorFavCB(err) 
	{
		alert("ww-error");
	}
}
$('#info').bind('pageshow', function() 
{
	activeTab = "";
	myScroll = new iScroll("info-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(myScroll)myScroll.refresh();
});
$('#info').bind('pagehide', function() 
{
	if(myScroll)destroyScroller();
});
$('#note').bind('pageshow', function() 
{
	myScroll = new iScroll("note-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});	
		if(myScroll)myScroll.refresh();
});
$('#note').bind('pagehide', function() 
{
	if(myScroll)destroyScroller();
});
var favoritesSlider;
$('#favorites-details-page').bind('pageinit', function() 
{
	favoritesSlider = new Swipe(
		document.getElementById('favorites-slider'),
		{
		  "startSlide" : 1,
		  "speed" : 400,
		  "slideChanged":handleFavoritesSlideChange,
		  "isLoop" : true
		}
	);
	$('#favorites-details-page').bind('pagehide', function() 
	{
		if($($.mobile.activePage).attr("id") != "category-page")
		{
			var first = $('#favorites-slider-inner-container').children(':first');
			var last = $('#favorites-slider-inner-container').children(':last');
			if(first.attr("id") != undefined)
			{
				$('#favorites-slider-inner-container').prepend(last);
			}
			else if(last.attr("id") != undefined)
			{
				$('#favorites-slider-inner-container').append(first);							
			}
			$('#favorites-details-page').unbind("changeFavoritesSlideContent")
			favoritesSlider.stopWorking();
			$('#favorites-details-page').attr("data-refresh","true");	
		}
		else
		{
			$('#favorites-details-page').attr("data-refresh","false");	
		}
		if(myScroll)destroyScroller();
	});
	$('#favorites-details-page').bind('pageshow', function() 
	{
		var shouldRefresh = $('#favorites-details-page').attr("data-refresh");
		if(shouldRefresh == "true")
		{
			try 
			{
				db.transaction(function(transaction) {
					transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
				});
			} 
			catch(e) 
			{
				console.log("Konnte nicht nachschauen ob der Tipp zu Deinen Favoriten gehört!");
			}
			function queryFavSuccess(tx, results) 
			{
				var len = results.rows.length;
				if(len > 1)
				{
					favoritesSlider.stopWorking();
					favoritesSlider.startWorking();
					$.getJSON('content/json/content-min.json', function(json) 
					{
						var allFavItems = new Array();
						var startItemPosition = 0;
						var cat = $.urlParam("category");
						var itemId = $.urlParam("id");
						var stopFlag = false; 
						for(var i = 0; i < len; i++)
						{
							var obj = json[results.rows.item(i).category]["items"]["item_"+results.rows.item(i).contentid];
							obj.cat_name = json[results.rows.item(i).category].cat_name;
							obj.cat_id = json[results.rows.item(i).category].cat_id;
							allFavItems.push(obj);
							if(results.rows.item(i).contentid != itemId && !stopFlag)
							{
								startItemPosition += 1;
							}
							else
							{
								stopFlag = true;
							}
						}
						$('#favorites-slider').attr("data-page-nr",startItemPosition);
						createFavoritesSliderSubContent(allFavItems);
						$('#favorites-details-page').bind('changeFavoritesSlideContent', function(e) { 
							createFavoritesSliderSubContent(allFavItems);
						});
					});
				}
				else
				{
					favoritesSlider.stopWorking();
				}
			}
			function errorFavCB(err) 
			{
				alert("ww-error");
			}
		}
		myScroll = new iScroll("favorites-t-content-scroller",{
		useTransition: true,
		hScroll: false,
		lockDirection:true});
		if(myScroll)myScroll.refresh();
	});
});
function handleFavoritesSlideChange(direction)
{
	var favoritesSlider = $('#favorites-slider');
	
	if(direction == 1)
	{
		var first = $('#favorites-slider-inner-container').children(':first');
		$('#favorites-slider-inner-container').append(first);
		var newIndex = parseInt(favoritesSlider.attr("data-page-nr")) + 1;
		favoritesSlider.attr("data-page-nr",newIndex);
		$('#favorites-details-page').trigger('changeFavoritesSlideContent');
	}
	else if(direction == -1)
	{
		var last = $('#favorites-slider-inner-container').children(':last');
		$('#favorites-slider-inner-container').prepend(last);
		var newIndex = parseInt(favoritesSlider.attr("data-page-nr")) - 1;
		favoritesSlider.attr("data-page-nr",newIndex);
		$('#favorites-details-page').trigger('changeFavoritesSlideContent');
	}
	if(myScroll)myScroll.refresh();
}

function createFavoritesSliderSubContent(allFavItems)
{
	var index = parseInt($('#favorites-slider').attr("data-page-nr"));
	var left;
	var right;
	if(index <= 0)
	{
		if(index == 0)
		{
			left = allFavItems.length-1;
			right = index+1;
		}
		else
		{
			index = allFavItems.length-1;
			left = index-1;
			right = 0;
			$('#favorites-slider').attr("data-page-nr",index);
		}
	}
	else if(index >= allFavItems.length-1)
	{
		if(index == allFavItems.length-1)
		{
			left = allFavItems.length-2;
			right = 0;
		}
		else
		{
			index = 0;
			left = allFavItems.length-1;
			right = index+1;
			$('#favorites-slider').attr("data-page-nr",index);
		}
	}
	else if(index >= 1 || index <= allFavItems.length-1)
	{
		left = index-1;
		right = index+1;
	}
	var first = $('#favorites-slider-inner-container').children(':first');
	var last = $('#favorites-slider-inner-container').children(':last');
	if(allFavItems.length == 2)
	{
		first.find(".details-headline").html( allFavItems[right].title);
		first.find(".details-content-text").html( allFavItems[right].text);
		first.find(".details-cat-img").attr("src","media/icons/cat-"+allFavItems[right].cat_id+"-icon@2x.png");
		first.find(".details-cat-headline").html(allFavItems[right].cat_name).removeClass().addClass("details-cat-headline").addClass("color-"+allFavItems[right].cat_id);
		first.find(".tipp-counter").html("Favorit " + (right+1) + " von " + allFavItems.length);
		first.find(".share-btn").attr("data-title",""+ allFavItems[right].title +"").attr("data-text",""+ allFavItems[right].text +"");
		first.attr("data-active-id",allFavItems[right].content_id);
		first.attr("data-active-cat","cat_"+allFavItems[right].cat_id);
		first.find(".details-header-container").attr("data-cat",allFavItems[left].cat_id);
	}
	else
	{
		first.find(".details-headline").html( allFavItems[left].title);
		first.find(".details-content-text").html( allFavItems[left].text);
		first.find(".details-cat-img").attr("src","media/icons/cat-"+allFavItems[left].cat_id+"-icon@2x.png");
		first.find(".details-cat-headline").html(allFavItems[left].cat_name).removeClass().addClass("details-cat-headline").addClass("color-"+allFavItems[left].cat_id);
		first.find(".tipp-counter").html("Favorit " + (left+1) + " von " + allFavItems.length);
		first.find(".share-btn").attr("data-title",""+ allFavItems[left].title +"").attr("data-text",""+ allFavItems[left].text +"");
		first.attr("data-active-id",allFavItems[left].content_id);
		first.attr("data-active-cat","cat_"+allFavItems[left].cat_id);
		first.find(".details-header-container").attr("data-cat",allFavItems[left].cat_id);
	}
	last.find(".details-headline").html( allFavItems[right].title);
	last.find(".details-content-text").html( allFavItems[right].text);
	last.find(".details-cat-img").attr("src","media/icons/cat-"+allFavItems[right].cat_id+"-icon@2x.png");
	last.find(".details-cat-headline").html(allFavItems[right].cat_name).removeClass().addClass("details-cat-headline").addClass("color-"+allFavItems[right].cat_id);
	last.find(".tipp-counter").html("Favorit " + (right+1) + " von " + allFavItems.length);
	last.find(".share-btn").attr("data-title",""+ allFavItems[right].title +"").attr("data-text",""+ allFavItems[right].text +"");
	last.attr("data-active-id",allFavItems[right].content_id);
	last.attr("data-active-cat","cat_"+allFavItems[right].cat_id);
	last.find(".details-header-container").attr("data-cat",allFavItems[right].cat_id);
	var favoritesSlider = $('#favorites-slider');
	var currentItemId = $('#favorites-slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-id");
	favoritesSlider.attr("data-slide-id",currentItemId);
	var currentItemCat = $('#favorites-slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-cat");
	favoritesSlider.attr("data-slide-cat",currentItemCat);
	var currentItemId = $('#favorites-slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-id");
	try 
	{
		db.transaction(function(transaction) {
			transaction.executeSql('SELECT * FROM FAVORITES', [], queryFavSuccess, errorFavCB);
		});
	} 
	catch(e) 
	{
		alert("Konnte nicht nachschauen ob der Tipp zu Deinen Favoriten gehört!");
	}
	function queryFavSuccess(tx, results) 
	{
		var len = results.rows.length;
		var isFav = false;
		var currentItemId = $('#favorites-slider-inner-container .slider-content-container:nth-child(2)').attr("data-active-id");
		for(var i = 0; i < len; i++)
		{
		  if(results.rows.item(i).contentid == currentItemId)
		  {
			isFav = true;
		  }
		}
		var randomFavBtn = $('#favorites-details-page').find(".add-to-fav-list-btn");
		var slider = $('#favorites-slider'); 
		randomFavBtn.attr("rel",slider.attr("data-slide-id")).attr("data-catid",slider.attr("data-slide-cat"));
		if(!isFav)
		{
		  randomFavBtn.attr("data-action", "add").removeClass("add-to-fav-list-btn-selected");
		}
		else
		{
		  randomFavBtn.attr("data-action", "remove").addClass("add-to-fav-list-btn-selected");
		}
	}                                                   
	function errorFavCB(err) 
	{
		alert("ww-error");
	}
}
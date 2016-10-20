var tabBar;
var childbrowser;
var isVisibleAds = false;	
var db;
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	try
	{
		var nr = parseInt(device.version);
		if(nr < 5)
		{
			$("#search-all-list").css("-webkit-transform","none");
		}
	}
	catch(e)
	{
	}
	$.mobile.defaultHomeScroll = 0;
	var networkState = navigator.connection.type;
	var _innerWidth = window.innerWidth;
	var _innerHeight = window.innerHeight;
	if(networkState == "none" || networkState == "unknown" || networkState == "" || networkState == null)
	{
		isVisibleAds = false;
		if(_innerWidth <= 320 && _innerHeight == 460)
		{ 
			var val = 338 + "px";
			$(".scroller").css("height",val );		
		}
		else if(_innerWidth <= 320 && _innerHeight == 548)
		{
			
			var val = 426 + "px";
			$(".scroller").css("height",val );	
		}
		else if(_innerWidth <= 320 && _innerHeight == 568)
		{
			var val = 426 + "px";
			$(".scroller").css("height",val );	
		}
		else if(_innerWidth <= 768 && _innerHeight == 1004)
		{
			var val = 882 + "px";
			$(".scroller").css("height",val );	
		}
	}
	else
	{ 
		isVisibleAds = true;
		if(_innerWidth <= 320 && _innerHeight == 460)
		{ 
			var val = 288 + "px";
			$(".scroller").css("height",val );		
		}
		else if(_innerWidth <= 320 && _innerHeight == 548)
		{
			var val = 376 + "px";
			$(".scroller").css("height",val );	
		}
		else if(_innerWidth <= 768 && _innerHeight == 1004)
		{
			var val = 808 + "px";
			$(".scroller").css("height",val );	
		}
	}
	initTabbar();
	new iScroll("categories-content-scroller",{useTransition: true, hScroll: false, hScrollbar: false, momentum: true});
	initChildBrowser();
	db = window.openDatabase("Database", "1.0", "NextHelthlabDB", 200000);
	db.transaction(populateDB, errorCB, successCB);
}
function populateDB(tx) {
	 tx.executeSql('CREATE TABLE IF NOT EXISTS FAVORITES (id unique, contentid, title, text, category)');
}
function errorCB(tx, err) {
}
function successCB() {
}
function initTabbar()
{
		tabBar = plugins.tabBar;
		tabBar.init()
		tabBar.create()
		tabBar.createItem("homeTab", "Themen", "/www/media/icons/categories-tab.png", {"onSelect": function() { $.mobile.changePage( "#categories", { transition:"none" } ); }})
		tabBar.createItem("searchTab", "Suchen", "/www/media/icons/all-tab.png", {"onSelect": function() { $.mobile.changePage( "#all", { transition:"none" } ); }})
		tabBar.createItem("favTab", "Favoriten", "/www/media/icons/favorites-tab.png", {"onSelect": function() { $.mobile.changePage( "#favorites", { transition:"none" } ); }})
		tabBar.createItem("randomTab", "Zufall", "/www/media/icons/random-tab.png", {"onSelect": function() { $.mobile.changePage( "#random", { transition:"none" } ); }})
		tabBar.createItem("infoTab", "Info", "/www/media/icons/info-tab.png", {"onSelect": function() { $.mobile.changePage( "#info", { transition:"none" } ); }})
		if(!isVisibleAds)
		{
			tabBar.repositionTabBar();	
		}
		else
		{
		}
		tabBar.show()
		tabBar.showItems("homeTab", "searchTab", "favTab", "randomTab", "infoTab")
		tabBar.selectItem("homeTab");
		$("body").css("visibility","visible");
}
function initChildBrowser()
{
	childbrowser = window.plugins.childBrowser;;
	childbrowser.onLocationChange = checkIfChildBrowserHasToClose;
}
function checkIfChildBrowserHasToClose(loc)
{
	if(loc.search("facebook") == -1 && loc.search("twitter") == -1)
	{
		childbrowser.close();
	}
	else if(loc.search("tweet/complete") != -1)
	{
		childbrowser.close();
	}
}
function sendMail(subject,text,to)
{
    if(text == "" && subject == "")
    {
        to = "";
        subject = "99 Tipps für mehr Gesundheit";
        text = "Die \"99 Tipps für mehr Gesundheit\" machen dein Leben gesünder. In einfachen Themenblöcken findest du alles, was du rund um das Thema Gesundheit wissen musst und erhälst konkrete Praxistipps für deinen Alltag. Mach' Gesundheit zu deinem Begleiter mit den \"99 Tipps für mehr Gesundheit\". Jetzt testen und herunterladen auf: <a href=\"http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828\">http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828</a>";
    }
    else if(text != "" && subject != "")
    {
        to = "";
        text += "<br\><br\><br\>";
        text += "Weitere gesunde Tipps und klare Antworten auf deine Gesundheitsfragen gibt's mit der App \"99 Tipps für mehr Gesundheit\". Jetzt testen und herunterladen auf: <a href='http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828'>http://itunes.apple.com/de/app/99-tipps-fur-mehr-gesundheit/id532135828</a>";
    } 
    window.plugins.emailComposer.showEmailComposer(subject,text,to,"","",true);
}
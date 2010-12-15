var map;
var bel;
var osb;
var mapnik;
var markers;
var selectControl;
var popup;
var cops;
var features;
var brokenContentSize;

function style_osm_feature(feature) {
    alert(0);
}

var proto;

function loadfeatures(url) {
    if (features) {
        features.destroy();
    }
    openSidebar({title: "Features", content: "&nbsp;"});
    features = new OpenLayers.Layer.Vector("Features", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        style: {
            strokeColor: "blue",
            strokeWidth: 3,
            strokeOpacity: 0.5,
            fillOpacity: 0.2,
            fillColor: "lightblue",
            pointRadius: 6
        },
        onFeatureInsert: addfeature,
        displayInLayerSwitcher: false,
        protocol: proto = new OpenLayers.Protocol.HTTP({
            url: url,
            format: new OpenLayers.Format.OSM()
        })
    });
    map.addLayer(features);
}

function scheck(s) {
    if (s) return s;
    return "";
}

var editing = null;
var oldvalue = null;

var objmodified = {};

var objdownloaded = {};

function addedit(o) {
    if (!editing) {
        var w = o.clientWidth;
        var h = o.clientHeight;
        o.innerHTML = "<input id='"+ o.id +"_edit' type='text' value=\"" + o.innerHTML + "\" />";
        o.onblur = function () {
            removeedit(o);
        }
        editing = o;
        oldvalue = o.children[0].value;
        o.children[0].style.width = w + "px";
        o.children[0].style.height = h + "px";
        o.children[0].focus();
    } else {
        removeedit(editing);
        addedit(o);
    }
}

function removeedit(o) {
    if (editing) {
        var s = o.children[0].value;
        if (s != oldvalue) {
            o.parentNode.style.backgroundColor = "#eaf0f0";
            objmodified[o.parentNode.id] = true;
        }
        s = stringmap(s, [[/&/g, "&amp;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/</g, "&lt;"], [/>/g, "&gt;"]]);
        o.innerHTML = s;
        editing = null;
    }
}

function getnext(a) {
    if (a.length == 0) return;
    var i = a.shift();
    OpenLayers.Request.GET({url: "/api/0.6/" + stringmap(i, [[".","/"]]), params: {}, success: function (o) {
            $("log").innerHTML += ("<br />" + stringmap(o.responseText, [[/&/g, "&amp;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/</g, "&lt;"], [/>/g, "&gt;"]]));
            objdownloaded[i] = OpenLayers.parseXMLString(o.responseText);
            getnext(a);
        }
    });
}

function startupload() {
    var q = [];
    for(var i in objmodified) {
        q.push(i);
    }
    getnext(q);
}

function addfeature(feature) {
    if (feature.data["name"] == null) return;
    var t = $("transtable");
    if (t == null) {
        openSidebar({title: "Features", content: "<table id='transtable' cellspacing='0'><thead><tr><th>name</th><th>name:be</th><th>name:ru</th></tr></thead><tbody></tbody></table><center><button id='okay'>Okay</button</center><p>Log:</p><p id='log'></p>"});
        $("okay").onclick = startupload;
        t = $("transtable");
    } else {
        editing = null;
    }
    t = $("transtable").children[1];
    var r = document.createElement("tr");
    r.id = feature.fid;
    foreach(["name", "name:be", "name:ru"], function (n) {
        var e = document.createElement("td");
        e.appendChild(document.createTextNode(scheck(feature.data[n])));
        e.id = feature.fid + "." + n;
        e.onclick = function () {
            addedit(e);
        }
        r.appendChild(e);
    });
    t.appendChild(r);
}

function init() {
    brokenContentSize = $("content").offsetWidth == 0;
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.Util.onImageLoadErrorColor = "transparent";
    OpenLayers.Control.Permalink.prototype.updateLink = function() {
        var href = this.base;
        if (href.indexOf('#') != -1) {
            href = href.substring( 0, href.indexOf('#') );
        }
        if (href.indexOf('?') != -1) {
            href = href.substring( 0, href.indexOf('?') );
        }

        var query = OpenLayers.Util.getParameterString(this.createParams());
        if (query != "") query = "?" + query;

	href += query;
	if (this.hash) 
        	href += this.hash;

        this.element.href = href;
    }

    if (!location.hash) {
        //location.hash="#";
    }

    var options = {
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508, -20037508,
                                         20037508, 20037508.34),
        controls: [
          new OpenLayers.Control.MouseDefaults(), 
          new OpenLayers.Control.PanZoomBar(), 
          new OpenLayers.Control.Attribution(), 
          new OpenLayers.Control.ScaleLine(), 
          new OpenLayers.Control.MousePosition(),
          new OpenLayers.Control.LayerSwitcher(),
          new OpenLayers.Control.Permalink(null, null, {"hash": document.location.hash}),
          new OpenLayers.Control.Permalink("editlink", "http://openstreetmap.org/edit", {"hash": document.location.hash}),
          new OpenLayers.Control.Permalink("mini", "http://latlon.org/", {"hash": document.location.hash}),
          new OpenLayers.Control.Permalink("maxi", "http://latlon.org/maxi", {"hash": document.location.hash}),
          new OpenLayers.Control.Permalink("transport", "http://latlon.org/pt", {"hash": document.location.hash}),
          new OpenLayers.Control.Permalink("sketchlink", "http://latlon.org/sketch", {"hash": document.location.hash})
        ]
    };

    map = new OpenLayers.Map('map', options);
    mapnik = new OpenLayers.Layer.OSM();

    var date = new Date();
    bel = new OpenLayers.Layer.OSM("Беларуская", "http://tile.latlon.org/tiles/${z}/${x}/${y}.png", {isBaseLayer: true,  type: 'png', displayOutsideMaxExtent: true, transitionEffect: "resize"});

    map.addLayers([mapnik, bel]);
    openSidebar({title: "Features", content: "&nbsp;"});

    //map.addLayers([osbLayer]);
    //cafes.preFeatureInsert = style_osm_feature; 

    var control = new OpenLayers.Control();
    OpenLayers.Util.extend(control, {
        draw: function () {
            // this Handler.Box will intercept the shift-mousedown
            // before Control.MouseDefault gets to see it
            this.box = new OpenLayers.Handler.Box( control,
                {"done": this.notice},
                {keyMask: OpenLayers.Handler.MOD_SHIFT});
            this.box.activate();
        },

        notice: function (bounds) {
            var ll = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.left, bounds.bottom)); 
            ll.transform(map.projection,map.displayProjection);
            var ur = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.right, bounds.top)); 
            ur.transform(map.projection,map.displayProjection);
            /*alert(ll.lon.toFixed(4) + ", " + 
                  ll.lat.toFixed(4) + ", " + 
                  ur.lon.toFixed(4) + ", " + 
                  ur.lat.toFixed(4));*/
            loadfeatures("/api/0.6/map?bbox=" + ll.lon.toFixed(4) + "," + 
                  ll.lat.toFixed(4) + "," + 
                  ur.lon.toFixed(4) + "," + 
                  ur.lat.toFixed(4));
        }
    });
    map.addControl(control);

    if (!map.getCenter()) {
        var lonlat, zoom;
        if (OpenLayers.Util.getParameters().mlon == null) {
            lonlat = new OpenLayers.LonLat(27.56813, 53.90313);
            zoom = 7;
        } else {
            lonlat = new OpenLayers.LonLat(OpenLayers.Util.getParameters().mlon,OpenLayers.Util.getParameters().mlat);
            if (OpenLayers.Util.getParameters().zoom == null) {
                zoom = 17;
            } else {
                zoom = OpenLayers.Util.getParameters().zoom;
            }
            markers.addMarker(new OpenLayers.Marker(lonlat));
        }
        lonlat.transform(map.displayProjection,map.projection);
        map.setCenter(lonlat, zoom);
        map.panTo(lonlat);
    }

    handleResize();

    window.onload = handleResize;
    window.onresize = handleResize;
    
    var sorry = document.createElement("div");
    sorry.innerHTML = OpenLayers.i18n("This tools is still a work-in-progress. Please report any bugs you find to the author.");
    sorry.id = "sorry";
    document.body.insertBefore(sorry, $("content"));
}


OpenLayers.Lang.ru = OpenLayers.Util.extend(OpenLayers.Lang.ru, {
    "Say": "Сообщить",
    "Your message:": "Комментарий",
    "Bump": "Спящий полицейский",
    "Speedcam": "Камера",
    "Type:": "Вид:",
    "Your name:": "Представьтесь:",
    "NoName": "Кто-то",
    "Please fill in your name": "Представьтесь, пожалуйста",
    "Comment is required": "Впишите, пожалуйста, комментарий",
    "Something's wrong": "Ошибка на карте",
    "Description": "Описание",
    "Comment": "Комментарий",
    "Permalink": "Постоянная ссылка",
    "Zoom": "Приблизить",
    "Unresolved Error": "Неисправленная неточность",
    "Comment/Close": "Изменить",
    "Traffic Calming": "",
    "Nickname": "Представьтесь",
    "New bumps can be added on zoom level 17 or greater<br/>More info can be found <a href='http://blog.latlon.org/2010/11/16/otmetki-o-lezhachikh-policejjskikh-v-osm/'>here</a>": "Добавлять сведения можно только на максимальном уровне детализации<br/>Подробности <a href='http://blog.latlon.org/2010/11/16/otmetki-o-lezhachikh-policejjskikh-v-osm/'>здесь</a>"
});


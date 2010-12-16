var map;
var bel;
var osb;
var mapnik;
var markers;
var selectControl;
var popup;
var box = null, boxes;
var features = null;
var brokenContentSize;

var proto;

var uploading = false;

var modifiedstyle = {
    strokeColor: "green",
    strokeWidth: 3,
    strokeOpacity: 0.5,
    fillOpacity: 0.2,
    fillColor: "green",
    pointRadius: 6
};

var selectstyle = {
    strokeColor: "blue",
    strokeWidth: 3,
    strokeOpacity: 0.5,
    fillOpacity: 0.2,
    fillColor: "blue",
    pointRadius: 6
};

var hidestyle = {
    strokeColor: "transparent",
    fillColor: "transparent"
};


function loadfeatures(url) {
    if (uploading) return;
    if (features) {
        features.destroy();
    }
    objmodified = {};
    objdownloaded = {};
    openSidebar({title: "Features", content: "Loading data... <img src='/images/spin.gif'/>"});
    features = new OpenLayers.Layer.Vector("Features", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        style: hidestyle,
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

function highlightfeature(id, style) {
    features.drawFeature(features.getFeatureByFid(id), style);
}

function addedit(o) {
    if (uploading) return;
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
        highlightfeature(o.parentNode.id, selectstyle);
    } else {
        removeedit(editing);
        addedit(o);
    }
}

function removeedit(o) {
    if (uploading) return;
    if (editing) {
        var s = o.children[0].value;
        if (s != oldvalue) {
            o.parentNode.style.backgroundColor = "#eaf0f0";
            var id = o.id;
            id = id.replace(/(node|way|relation)\.\d+\./, "");
            if (!objmodified[o.parentNode.id]) {
                objmodified[o.parentNode.id] = {};
            }
            objmodified[o.parentNode.id][id] = s;
            features.getFeatureByFid(o.parentNode.id).style = modifiedstyle;
            highlightfeature(o.parentNode.id, modifiedstyle);
        }
        s = stringmap(s, [[/&/g, "&amp;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/</g, "&lt;"], [/>/g, "&gt;"]]);
        if (!objmodified[o.parentNode.id]) {
            highlightfeature(o.parentNode.id, hidestyle);
        } else {
            highlightfeature(o.parentNode.id, modifiedstyle);
        }
        o.innerHTML = s;
        editing = null;
    }
}

function getnext(a) {
    if (a.length == 0) {
        openchangeset();
        return;
    }
    var i = a.shift();
    OpenLayers.Request.GET({url: "/api/0.6/" + stringmap(i, [[".","/"]]), params: {}, success: function (o) {
            $("log").innerHTML += ("Downloading " + stringmap(i, [["."," "]]) + "...<br />");
            objdownloaded[i] = OpenLayers.parseXMLString(o.responseText);
            var w = objdownloaded[i].documentElement.firstElementChild;
            foreach(usefultags, function (e) {
                var tags = w.getElementsByTagName("tag");
                var l = tags.length;
                var j;
                var matches = 0;
                for (j = 0; j < l; j++) {
                    if (tags[j].attributes["k"].value == e) {
                        if (objmodified[i][e])
                            tags[j].setAttribute("v", objmodified[i][e]);
                        matches++;
                    }
                }
                if (matches == 0) {
                    if ((objmodified[i][e]) && (objmodified[i][e] != "")) {
                        var t = osmchanges.createElement("tag");
                        t.setAttribute("k", e);
                        t.setAttribute("v", objmodified[i][e]);
                        w.appendChild(t);
                    }
                }
            });
            osmchanges.documentElement.firstElementChild.appendChild(w);
            setTimeout(function() {
                getnext(a);
            }, 0);
            /* tailcall(getnext, a); */
        }
    });
}

var osmchanges;
var changesetid;

function openchangeset() {
    var changesetreq = "<?xml version='1.0' encoding='UTF-8'?><osm version='0.6' generator='JOSM'><changeset id='0' open='false'><tag k='comment' v='on-line edits' /><tag k='created_by' v='http://go.latlon.org/tt/' /></changeset></osm>";
    $("log").innerHTML += ("Opening the new changeset...");
    OpenLayers.Request.PUT({url: "/api/0.6/changeset/create", data: changesetreq, success: function (o) {
            changesetid = o.responseText;
            $("log").innerHTML += (" " + changesetid + "<br />Uploading changes...");
            var m = osmchanges.documentElement.firstElementChild;
            foreach(m.children, function (e) {
                e.setAttribute("changeset", changesetid);
                //e.setAttribute("version", parseInt(e.attributes["version"].value)+1);
            });
            OpenLayers.Request.POST({url: "/api/0.6/changeset/" + changesetid + "/upload", data: osmchanges, success: function (o) {
                    $("log").innerHTML += (" done<br />Closing the changeset...");
                    OpenLayers.Request.PUT({url: "/api/0.6/changeset/" + changesetid + "/close", success: function (o) {
                            $("wait").style.display = "none";
                            $("log").innerHTML += (" success!<br />");
                        }, failure: function (o) {
                            uploading = false;
                            $("wait").style.display = "none";
                            $("log").innerHTML += " failure.";
                        }
                    });
                }, failure: function (o) {
                    uploading = false;
                    $("wait").style.display = "none";
                    $("log").innerHTML += " failure.";
                }
            });
        }, failure: function (o) {
            uploading = false;
            $("wait").style.display = "none";
            $("log").innerHTML += " failure.";
        }
    });
}

function startupload() {
    if (uploading) return;
    uploading = true;
    osmchanges = OpenLayers.parseXMLString("<osmChange version='0.3' generator='go.latlon.org/tt/'><modify></modify></osmChange>");
    var q = [];
    for(var i in objmodified) {
        q.push(i);
    }
    $("wait").style.display = "inline";
    getnext(q);
}

var usefultags = ["name", "name:be", "name:ru"];

function addfeature(feature) {
    if (feature.data["name"] == null) return;
    var t = $("transtable");
    if (t == null) {
        openSidebar({title: "Features", content: "<table id='transtable' cellspacing='0'><thead><tr><th>name</th><th>name:be</th><th>name:ru</th></tr></thead><tbody></tbody></table><center><button id='okay'>Okay</button</center><p>Log:</p><p><span id='log'></span><img id='wait' style='display: none;' src='/images/spin.gif'/></p>"}); // TODO: use usefultags
        $("okay").onclick = startupload;
        t = $("transtable");
    } else {
        editing = null;
    }
    t = $("transtable").children[1];
    var r = document.createElement("tr");
    r.id = feature.fid;
    foreach(usefultags, function (n) {
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

    boxes  = new OpenLayers.Layer.Boxes("Boxes", {displayInLayerSwitcher: false});
    
    map.addLayers([mapnik, bel, boxes]);
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
                {keyMask: OpenLayers.Handler.MOD_CTRL});
            this.box.activate();
        },

        notice: function (bounds) {
            var ll = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.left, bounds.bottom)); 
            var ur = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.right, bounds.top)); 
            if (box) {
                boxes.removeMarker(box);
                box.destroy();
            }
            boxes.addMarker(box = new OpenLayers.Marker.Box(new OpenLayers.Bounds(ll.lon.toFixed(4), ll.lat.toFixed(4), ur.lon.toFixed(4), ur.lat.toFixed(4))));
            ll.transform(map.projection,map.displayProjection);
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
    sorry.innerHTML = OpenLayers.i18n("Ctrl-Drag to select the area to translate.<br />This tool is still a work-in-progress. Please report any bugs you find to the author.");
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


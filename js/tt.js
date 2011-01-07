var map;
var bel, belsn;
var osb;
var mapnik;
var markers;
var selectControl;
var popup;
var box = null, boxes;
var features = null;
var brokenContentSize;
var questionform;

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

var autostyle = {
    strokeColor: "#b9b900",
    strokeWidth: 3,
    strokeOpacity: 0.5,
    fillOpacity: 0.2,
    fillColor: "#b9b900",
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
    removeedit(editing);
    if (uploading) return;
    if (modified) {
        questionform.innerHTML = "<div style='width: 300px; height: 100px;'>" +
         "<p style='text-align: center;'>You have unsaved changes. If you proceed, these changes will be lost</p>" +
         "<p style='text-align: center;'><button id='cancelbtn'>Cancel</button>" +
         "<button id='discardbtn'>Discard changes</button></p></div>";
        questionform.style.display = "block";
        $("cancelbtn").onclick = function () {
            questionform.style.display = "none";
            return false;
        }
        $("discardbtn").onclick = function () {
            questionform.style.display = "none";
            actuallyloadfeatures(url);
            return false;
        }
        return;
    }
    actuallyloadfeatures(url);
}

var actualdata = 0;

function actuallyloadfeatures(url) {
    if (features) {
        features.destroy();
    }
    objmodified = {};
    objdownloaded = {};
    modified = false;

    var d = new Date();
    d = d.getTime();
    actualdata = d;
    openSidebar({title: "Features", content: "Loading data... <img src='/images/spin.gif'/>"});
    setTimeout(function () {
        $("sidebar_content").innerHTML = "Timed out waiting for data to load.";
    }, 90000);
    features = new OpenLayers.Layer.Vector("Features", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        style: hidestyle,
        onFeatureInsert: function () {
            if (actualdata != d) return;
            addfeature();
        },
        displayInLayerSwitcher: false,
        protocol: proto = new OpenLayers.Protocol.HTTP({
            url: url,
            format: new OpenLayers.Format.OSM()
        })
    });
    map.addLayer(features);
}

var editing = null;
var oldvalue = null;

var modified = false;
var objmodified = {};

var objdownloaded = {};

function highlightfeature(id, style) {
    var feature = features.getFeatureByFid(id);
    feature.style = style;
    features.drawFeature(feature, style);
}

function handlekey(key) {
    switch (key) {
        case "Escape": {
            removeedit(editing);
        } break;
        case "Up": {
            if (editing.parentNode.previousElementSibling) {
                var id = editing.id;
                id = id.replace(/(node|way|relation)\.\d+\./, "");
                addedit($(editing.parentNode.previousElementSibling.id + "." + id));
            }
        } break;
        case "Enter":
        case "Down": {
            if (editing.parentNode.nextElementSibling) {
                var id = editing.id;
                id = id.replace(/(node|way|relation)\.\d+\./, "");
                addedit($(editing.parentNode.nextElementSibling.id + "." + id));
            }
        } break;
        case "Left": {
            if (editing && (editing.children[0].selectionEnd == editing.children[0].selectionStart)) {
                if (editing.children[0].selectionStart == 0) {
                    if (editing.previousElementSibling)
                        addedit(editing.previousElementSibling);
                    return false;
                }
            }
            return true;
        } break;
        case "Right": {
            if (editing && (editing.children[0].selectionEnd == editing.children[0].selectionStart)) {
                if (editing.children[0].selectionEnd == editing.children[0].textLength) {
                    if (editing.nextElementSibling)
                        addedit(editing.nextElementSibling);
                    return false;
                }
            }
            return true;
        } break;
    }
    return false;
}

var tagspopup = null;

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
        tagspopup = $("tagspopup");
        var s = "<ul id='tagslist'>", t, f = features.getFeatureByFid(o.parentNode.id).data;
        for (t in f) {
            s += ("<li>" + stringmap(t + "=" + f[t], [[/&/g, "&amp;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/</g, "&lt;"], [/>/g, "&gt;"]]) + "</li>");
        }
        s += "</ul>";
        tagspopup.innerHTML = s;
        tagspopup.className = "form";
        tagspopup.style.left = "0px";
        tagspopup.style.right = "auto";
        tagspopup.style.height = "";
        tagspopup.style.height = cond(tagspopup.scrollHeight > 100, 100, (tagspopup.scrollHeight)) + "px";
        if ((o.parentNode.offsetTop - $("sidebar_content").offsetTop) < ($("sidebar_content").offsetHeight/2)) {
            tagspopup.style.top = "";
            tagspopup.style.bottom = "0px";
        } else {
            tagspopup.style.top = $("sidebar_title").offsetHeight + "px";
            tagspopup.style.bottom = "";
        }
    } else {
        if (editing == o) return;
        removeedit(editing);
        if (o)
            addedit(o);
    }
}

function removeedit(o) {
    if (uploading) return;
    if (editing) {
        var s = o.children[0].value;
        if (s != oldvalue) {
            o.parentNode.className = "modifiedrow";
            var id = o.id;
            id = id.replace(/(node|way|relation)\.\d+\./, "");
            if (!objmodified[o.parentNode.id]) {
                objmodified[o.parentNode.id] = {};
            }
            objmodified[o.parentNode.id][id] = s;
            highlightfeature(o.parentNode.id, modifiedstyle);
            modified = true;
        }
        s = stringmap(s, [[/&/g, "&amp;"], [/"/g, "&quot;"], [/'/g, "&#39;"], [/</g, "&lt;"], [/>/g, "&gt;"]]);
        if (!objmodified[o.parentNode.id]) {
            highlightfeature(o.parentNode.id, hidestyle);
        } else {
            highlightfeature(o.parentNode.id, modifiedstyle);
        }
        o.innerHTML = s;
        editing = null;
        tagspopup.className = "form hidden";
    }
}

function getnext(a) {
    if (a.length == 0) {
        openchangeset();
        return;
    }
    var i = a.shift();
    $("log").innerHTML += ("Downloading " + stringmap(i, [["."," "]]) + "...");
    OpenLayers.Request.GET({url: "/api/0.6/" + stringmap(i, [[".","/"]]), params: {}, success: function (o) {
            $("log").innerHTML += "<br />";
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
                            uploading = false;
                            $("wait").style.display = "none";
                            $("log").innerHTML += (" success!<br />");
                            var r = $("transtable").rows;
                            var l = r.length;
                            var i;
                            for (i = 1; i < l; i++) {
                                if ((r[i].className == "modifiedrow") || (r[i].className == "autorow")) {
                                    r[i].className = "savedrow";
                                }
                            }
                            modified = false;
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

var maintag = "name";
var usefultags = ["name", "name:be", "name:ru"];

function decodehtml(html) {
    var e = document.createElement("div");
    e.innerHTML = "<input value=\""+ html + "\"/>";
    return e.children[0].value;
}

function filltags(tag) {
    removeedit(editing);
    var r = $("transtable").rows;
    var l = r.length;
    var i, id, v;
    var tm = {};
    for (i = 1; i < l; i++) {
        id = r[i].id;
        v = $(id + "." + maintag).innerHTML;
        if (!tm[v]) {
            tm[v] = $(id + "." + tag).innerHTML;
        }
    }
    for (i = 1; i < l; i++) {
        id = r[i].id;
        v = $(id + "." + maintag).innerHTML;
        if ($(id + "." + tag).innerHTML == "") {
            if (tm[v]) {
                $(id + "." + tag).innerHTML = tm[v];
            } else {
                $(id + "." + tag).innerHTML = v;
            }
            $(id).className = "autorow";
            if (!objmodified[id]) {
                objmodified[id] = {};
            }
            objmodified[id][tag] = decodehtml(v);
            modified = true;
            highlightfeature(id, autostyle);
        }
    }
}

function dumbfilltags(tag) {
    removeedit(editing);
    var r = $("transtable").rows;
    var l = r.length;
    var i, id;
    for (i = 1; i < l; i++) {
        id = r[i].id;
        if ($(id + "." + tag).innerHTML == "") {
            $(id + "." + tag).innerHTML = $(id + "." + maintag).innerHTML;
            $(id).className = "autorow";
        }
    }
}

function addfeature(feature) {
    if (feature.data[maintag] == null) return;
    var t = $("transtable");
    if (t == null) {
        var h = "";
        foreach(usefultags, function (x) {
            h += ("<th>" + cond(x == maintag, x, "<a href='#' title='Autofill' id='head." + x +"'>&#8801;</a>" + x) + "</th>");
        });
        openSidebar({title: "Features", content: "<table id='transtable' cellspacing='0'><thead><tr>" + h + "</tr></thead><tbody></tbody></table><center><button id='okay'>Okay</button</center><p>Log:</p><p><span id='log'></span><img id='wait' style='display: none;' src='/images/spin.gif'/></p>"});
        foreach(usefultags, function (x) {
            if (x != maintag) {
                $("head." + x).onclick = function () {
                    filltags(x);
                    return false;
                }
            }
        });
        $("okay").onclick = startupload;
        t = $("transtable");
    } else {
        editing = null;
    }
    t = $("transtable").children[1];
    var r = document.createElement("tr");
    r.id = feature.fid;
    var i = 0;
    foreach(usefultags, function (n) {
        var e = document.createElement("td");
        e.appendChild(document.createTextNode(scond(feature.data[n], feature.data[n])));
        e.id = feature.fid + "." + n;
        if (i == 0) {
            e.className = feature.fid.replace(/\.\d+/, "") + "obj";
        }
        i++;
        e.onclick = function (ev) {
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
    belsn = new OpenLayers.Layer.OSM("Беларуская (kosmosnimki)", "http://91.208.39.18/kosmo-be/${z}/${x}/${y}.png", {isBaseLayer: true,  type: 'png', displayOutsideMaxExtent: true, transitionEffect: "resize"});

    boxes  = new OpenLayers.Layer.Boxes("Boxes", {displayInLayerSwitcher: false});
    
    map.addLayers([mapnik, bel, belsn, boxes]);
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
    foreach(["Left", "Up", "Down", "Right", "Enter", "Escape"], function (key) {
        shortcut.add(key, function () {
            return handlekey(key);
        });
    });

    window.onload = handleResize;
    window.onresize = handleResize;
   
    tagspopup = document.createElement("div");
    tagspopup.id = "tagspopup";
    tagspopup.className = "form hidden";
    $("sidebar").appendChild(tagspopup);

    questionform = document.createElement("form");
    questionform.innerHTML = OpenLayers.i18n("Are you sure?");
    questionform.id = "question";
    questionform.className = "form attention hidden";
    document.body.insertBefore(questionform, $("content"));
    
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


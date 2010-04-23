  var epsg4326 = new OpenLayers.Projection("EPSG:4326");

  function osm_getTileURL(bounds)
  {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();
    var limit = Math.pow(2, z);

    if (y < 0 || y >= limit)
    {
      return OpenLayers.Util.getImagesLocation() + "404.png";
    }
    else
    {
      x = ((x % limit) + limit) % limit;
      return this.url + "x=" + x + "&y=" + y + "&z=" + z;
    }
  }

  function osmt_getTileURL(bounds)
  {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();
    var limit = Math.pow(2, z);

    if (y < 0 || y >= limit)
    {
      return OpenLayers.Util.getImagesLocation() + "404.png";
    }
    else
    {
      x = ((x % limit) + limit) % limit;
      return this.url + z + "/" + x + "/" + y+".png";
    }
  }

  function osmn_getTileURL(bounds)  {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();
    var limit = Math.pow(2, z);

    if (y < 0 || y >= limit)
    {        return OpenLayers.Util.getImagesLocation() + "404.png";    }
    else
    {  x = ((x % limit) + limit) % limit;
      function zAlignedStr(az,bz){return((new Array(bz+1)).join("0").substr(0,bz-String(az).length)+String(az))};
     return this.url + zAlignedStr(x,8)+","+zAlignedStr(limit-y-1,8)+","+zAlignedStr(z,2);
      //return this.url + z + "/" + x + "/" + y+".png";
    }
  }

  function getStyle(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value || value == 'auto') {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  }

  function foreach(arr, lambda) {
      for(var i = arr.length - 1; i >= 0; i--) {
        lambda(arr[i]);
      }
  }

  function stringmap(s, pairs) {
      for(var i = pairs.length - 1; i >= 0; i--) {
        s = s.replace(pairs[i][0], pairs[i][1]);
      }
      return s;
  }

  var onclose;

  function openSidebar(options) {
    options = options || {};

    if (onclose) {
       onclose();
       onclose = null;
    }

    if (options.title) { $("sidebar_title").innerHTML = options.title; }
    if (options.content) { $("sidebar_content").innerHTML = options.content; }

    if (options.width) { $("sidebar").style.width = options.width; }
    else { $("sidebar").style.width = "30%"; }

    $("sidebar").style.display = "block";

    handleResize();

    onclose = options.onclose;
  }

  function closeSidebar() {
    $("sidebar").style.display = "none";

    handleResize();

    if (onclose) {
       onclose();
       onclose = null;
    }
  }

  function updateSidebar(title, content) {
    $("sidebar_title").innerHTML = title;
    $("sidebar_content").innerHTML = content;
  }

  function handleResize() {
    var centre = map.getCenter();
    var zoom = map.getZoom();
    var sidebar_width = getStyle($("sidebar"), "width");

    if (sidebar_width > 0) {
      sidebar_width = sidebar_width + 5
    }

    var content = $("content");
    var contentHeight = parseInt(getStyle(content, "height"));
    var diff = document.documentElement.clientHeight - content.offsetTop - contentHeight;
    contentHeight += diff;
    content.style.height = (contentHeight) + "px";

    document.getElementById("map").style.left = (sidebar_width) + "px";
    document.getElementById("map").style.width = (document.getElementById("content").offsetWidth - sidebar_width) + "px";
    document.getElementById("map").style.height = (document.getElementById("content").offsetHeight - 2) + "px";
    document.getElementById("sidebar").style.height = (document.getElementById("content").offsetHeight - 2) + "px";

    map.setCenter(centre, zoom);
  }

  function handleMeasure(event)
  {
      if (event.order==1) // LINEAR
      {
          var mydiv=document.getElementById("distance");
          mydiv.style.display="inline";
          mydiv.innerHTML=event.measure.toFixed(3) + " " + event.units;
      }
      else // POLYGON
      {
          var area = event.measure.toFixed(3) + " " + event.units;
          var a = map.getControlsByClass('OpenLayers.Control.Measure');
          var ctrl = a[0];
          var length = (ctrl.getBestLength(event.geometry)[0]).toFixed(3) + " " + ctrl.getBestLength(event.geometry)[1];
      }
  }

  function hideDistance(event) {
      var mydiv=document.getElementById("distance");
      mydiv.style.display="none";
      mydiv.innerHTML="";
  }


  function mini() {
    mapnik = new OpenLayers.Layer.OSM();

    bel = new OpenLayers.Layer.TMS(
        "Беларуская", 
        "http://d.tile.latlon.org/tiles/", 
        {
          numZoomLevels: 18, 
          isBaseLayer: true,  
          type: 'png', 
          getURL: osmt_getTileURL, 
          displayOutsideMaxExtent: true
        }
    );
  }

  function miniadd() {
    map.addLayers([mapnik, bel]);
  }

  function maxi() {
    mini();
    road = new OpenLayers.Layer.TMS(
        "Mapsurfer Road",
        "http://tiles1.mapsurfer.net/tms_r.ashx?",
        {
          numZoomLevels: 19, 
          isBaseLayer: true,  
          type: 'png', 
          getURL: osm_getTileURL, 
          displayOutsideMaxExtent: true
        }
    );

    yasat = new OpenLayers.Layer.TMS(
        "yandex.ru retiling", 
        "http://wms.latlon.org/?request=GetTile&layers=yasat&", 
        { 
          umZoomLevels: 19,  
          isBaseLayer: true,  
          type: 'png', 
          getURL: osm_getTileURL, 
          displayOutsideMaxExtent: true
        }
    );

    gshtab = new OpenLayers.Layer.TMS(
        "BY Genshtab 100k", 
        "http://wms.latlon.org/?request=GetTile&layers=gshtab&", 
        {  
          numZoomLevels: 19,  
          isBaseLayer: true,  
          type: 'png', 
          getURL: osm_getTileURL, 
          displayOutsideMaxExtent: true
        }
    );

    irs = new OpenLayers.Layer.TMS(
        "kosmosnimki.ru IRS", 
        "http://wms.latlon.org/?request=GetTile&layers=irs&", 
        {  
          numZoomLevels: 16,  
          isBaseLayer: true,  
          type: 'png', 
          getURL: osm_getTileURL, 
          displayOutsideMaxExtent: true 
        }
    );

    pt = new OpenLayers.Layer.TMS(
        "Public Transport", 
        "http://tile.latlon.org/pt/", 
        {  
          numZoomLevels: 18,  
          isBaseLayer: false,  
          type: 'png', 
          getURL: osmt_getTileURL, 
          displayOutsideMaxExtent: true, 
          visibility: true
        }
    );
  }

  function maxiadd() {
    map.addLayers([mapnik, bel, yasat, irs, gshtab, road/*, pt*/]);
  }

  function sketch() {
    vector = new OpenLayers.Layer.Vector("Editable Vectors");
  }

  function sketchadd() {
    map.addLayers([vector]);
  }

  function gpx(url) {
    lgpx = new OpenLayers.Layer.GML("GPX track", url, {
      format: OpenLayers.Format.GPX,
      style: {strokeColor: "red", strokeWidth: 5, strokeOpacity: 0.6},
      projection: new OpenLayers.Projection("EPSG:4326")
    });
  }

  function gpxadd() {
    map.addLayer(lgpx);
  }

  function loginshow() {
    if ($("loginform").style.display != "block") {
        if (uo.user != undefined) {
          $("user").style.display = "none";
          $("password").style.display = "none";
          $("logonprogress").className = "";
          $("logonprogress").style.display = "inline";
          $("logonprogress").innerHTML = "Sure to log out?";
        } else {
          $("logonprogress").style.display = "none";
          $("user").style.display = "inline";
          $("password").style.display = "inline";
        }
        $("submit").style.display = "inline";
        $("loginform").style.display = "block";
    } else {
        $("loginform").style.display = "none";
    }
    return false;
  }

  function uploadshow() {
    if ($("uploadform").style.display != "block") {
        $("uploadform").style.display = "block";
    } else {
        $("uploadform").style.display = "none";
    }
    return false;
  }

  function updateSignIn() {
    OpenLayers.Request.GET({url: "/user/get", params: {"fields": "user"}, success: function (o) {
        var r = "uo = " + o.responseText;
        eval(r);
        if (uo.user != undefined)
        {
          $("logonprogress").className = "";
          $("logonprogress").innerHTML = "Logged out.";
          $("loginlink").innerHTML = "Welcome, " + uo.user + ".";
          $("submit").value = "Log out";
          $("posturl").title = "/user/logout";
          $("uploadlink").style.display = "inline";
          $("uploadlink").style.color = "black";
        }
        else
        {
          $("loginlink").innerHTML = "sign in";
          $("submit").value = "Log in";
          $("posturl").title = "/user/login";
        }
        $("loginlink").style.color = "black";
        $("loginform").style.display = "none";
        $("uploadform").style.display = "none";
    }, failure: function (o) {
        $("loginlink").innerHTML = "sign in";
        $("loginlink").style.color = "black";
        $("loginform").style.display = "none";
        $("uploadlink").style.color = "transparent";
        $("uploadlink").style.display = "none";
        $("uploadform").style.display = "none";
        $("submit").value = "Log in";
        $("posturl").title = "/user/login";
    }, scope: this});
  }

  function login() {
    if (uo.user != undefined) {
        $("logonprogress").className = "spin";
        $("logonprogress").style.display = "inline";
        $("logonprogress").innerHTML = "Logging out...";
        $("submit").style.display = "none";
        OpenLayers.Request.GET({url: $("posturl").title, success: function (o) {
          $("logonprogress").className = "";
          $("logonprogress").innerHTML = "Logged out.";
          updateSignIn();
        }, scope: this});
    } else {
        var user = $("user").value;
        var password = $("password").value;
        
        $("user").style.display = "none";
        $("password").style.display = "none";
        $("submit").style.display = "none";
        $("logonprogress").className = "spin";
        $("logonprogress").style.display = "inline";
        $("logonprogress").innerHTML = "Logging in...";
        OpenLayers.Request.GET({url: $("posturl").title, params: {"user": user, "password": password}, success: function (o) {
          $("logonprogress").className = "";
          $("logonprogress").innerHTML = "Logged in.";
          updateSignIn();
        }, failure: function (o) {
          $("logonprogress").className = "";
          $("logonprogress").innerHTML = "Not logged in.";
        }, scope: this});
    }
    return false;
  }

  function startUpload() {
        $("uploadprogress").innerHTML = "Preparing upload...";
        $("uploadprogress").className = "spin";
        $("uploadprogress").style.display = "inline";
        var f = $("uploadform");
        f.setAttribute("action", "/tracks/" + uo.user + "/");
        OpenLayers.Request.GET({url: "/tracks/", params: {"op": "create", "subdir": uo.user}, success: function (o) {
          $("uploadprogress").innerHTML = "Uploading...";
          $("uploadprogress").className = "spin";
          $("uploadprogress").style.display = "inline";
          var f = $("uploadform");
          AIM.submit(f, {'onComplete': completeUpload});
          f.submit();
        }, failure: function (o) {
          $("uploadprogress").className = "";
          $("uploadprogress").innerHTML = "Error preparing upload.";
        }, scope: this});
        return false;
  }

  function completeUpload() {
      $("uploadprogress").className = "";
      $("uploadprogress").innerHTML = "Uploaded.";
  }

  function featuremonitor(e) {
      var li;
      $("points").innerHTML = "";
      $("lines").innerHTML = "";
      $("polygons").innerHTML = "";
      foreach(e.object.features, 
        function (f) {
            switch (f.geometry.CLASS_NAME) {
              case "OpenLayers.Geometry.Point": {
                li = document.createElement("li");
                li.innerHTML = f.geometry;
                $("points").appendChild(li)
              } break;
              case "OpenLayers.Geometry.LineString": {
                li = document.createElement("li");
                li.innerHTML = f.geometry;
                $("lines").appendChild(li)
              } break;
              case "OpenLayers.Geometry.Polygon": {
                li = document.createElement("li");
                li.innerHTML = f.geometry;
                $("polygons").appendChild(li)
              } break;
            }
        }
      );
      $("wmslink").href = getwmslink("osm", 300);
  }

  function getMapExtent() {
      return map.getExtent().clone().transform(map.getProjectionObject(), epsg4326);
  }


  function getwmslink(lay, width) {
      //
      var geom = wkt.write(vector.features);
      geom = stringmap(geom, [['((', '('], ['))', ')'], ['GEOMETRYCOLLECTION(', ''], [/^\(/, ""], [/\)$/, ""]]);
      if (geom.length > 0) geom = "&wkt=" + geom;
      return 'http://wms.latlon.org/?format=image/png&layers=' + lay + '&width=' + width + '&bbox=' + getMapExtent().left + ',' + getMapExtent().bottom + ',' + getMapExtent().right + ',' + getMapExtent().top + "" + geom;
  }

/**
*
*  AJAX IFRAME METHOD (AIM)
*  http://www.webtoolkit.info/
*
**/
/* License: CC-BY-SA 2.0 */

AIM = {
 
  frame : function(c) {
 
    var n = 'f' + Math.floor(Math.random() * 99999);
    var d = document.createElement('DIV');
    d.innerHTML = '<iframe style="display:none" src="about:blank" id="'+n+'" name="'+n+'" onload="AIM.loaded(\''+n+'\')"></iframe>';
    document.body.appendChild(d);
 
    var i = document.getElementById(n);
    if (c && typeof(c.onComplete) == 'function') {
      i.onComplete = c.onComplete;
    }
 
    return n;
  },
 
  form : function(f, name) {
    f.setAttribute('target', name);
  },
 
  submit : function(f, c) {
    AIM.form(f, AIM.frame(c));
    if (c && typeof(c.onStart) == 'function') {
      return c.onStart();
    } else {
      return true;
    }
  },
 
  loaded : function(id) {
    var i = document.getElementById(id);
    if (i.contentDocument) {
      var d = i.contentDocument;
    } else if (i.contentWindow) {
      var d = i.contentWindow.document;
    } else {
      var d = window.frames[id].document;
    }
    if (d.location.href == "about:blank") {
      return;
    }
 
    if (typeof(i.onComplete) == 'function') {
      i.onComplete(d.body.innerHTML);
    }
  }
 
}

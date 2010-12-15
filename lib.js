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

  function handleResize() {
    var centre = map.getCenter();
    var zoom = map.getZoom();
    var sidebar_width = 0; // $("sidebar").offsetWidth;

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
    maxi();
    vector = new OpenLayers.Layer.Vector("Editable Vectors");
  }

  function sketchadd() {
    map.addLayers([mapnik, bel, yasat, gshtab, road, vector]);
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
        $("loginform").style.display = "block"
    } else {
        $("loginform").style.display = "none";
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
          $("loginlink").innerHTML = "Welcome, " + uo.user;
          $("submit").value = "Log out";
          $("posturl").title = "/user/logout";
        }
        else
        {
          $("loginlink").innerHTML = "sign in";
          $("submit").value = "Log in";
          $("posturl").title = "/user/login";
        }
        $("loginlink").style.color = "black";
        $("loginform").style.display = "none";
    }, failure: function (o) {
        $("loginlink").innerHTML = "sign in";
        $("loginlink").style.color = "black";
        $("loginform").style.display = "none";
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



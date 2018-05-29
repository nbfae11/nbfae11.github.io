/* Enumerations */
var MapType = {
	Roadmap: 10,
	Satellite: 20,
	Hybrid: 30,
	Terrain: 40
}

var infoType = {
	InfoWindow: "InfoWindow",
	InfoBox: "InfoBox"
}

var markerZoomLevel = 9;

/* List of supported languages https://spreadsheets.google.com/spreadsheet/pub?key=0Ah0xU81penP1cDlwZHdzYWkyaERNc0xrWHNvTTA1S1E&gid=1 */
var MapLanguage = {
	Arabic: "ar",
	Basque: "eu",
	Bulgarian: "bg",
	Bengali: "bn",
	Catalan: "ca",
	Czech: "cs",
	Danish: "da",
	German: "de",
	Greek: "el",
	English: "en",
	Spanish: "es",
	Basque: "eu",
	Farsi: "fa",
	Finnish: "fi",
	Filipino: "fil",
	French: "fr",
	Galician: "gl",
	Gujarati: "gu",
	Hindi: "hi",
	Croatian: "hr",
	Hungarian: "hu",
	Indonesian: "id",
	Italian: "it",
	Hebrew: "iw",
	Japanese: "ja",
	Kannada: "kn",
	Korean: "ko",
	Lithuanian: "lt",
	Latvian: "lv",
	Malayalam: "ml",
	Marathi: "mr",
	Dutch: "nl",
	Norwegian: "no",
	Polish: "pl",
	Portuguese: "pt",
	Romanian: "ro",
	Russian: "ru",
	Slovak: "sk",
	Slovenian: "sl",
	Serbian: "sr",
	Swedish: "sv",
	Tagalog: "tl",
	Tamil: "ta",
	Telugu: "te",
	Thai: "th",
	Turkish: "tr",
	Ukrainian: "uk",
	Vietnamese: "vi"
}

var MapLocationType = {
	Marker: 10,
	Polygon: 20,
	PolyLine: 30
}

/* Object declarations */
function Coordinate(latitude, longitude) {
	this.Latitude = latitude;
	this.Longitude = longitude;
}

function Location(coordinates, locationtype, icon, bordercolor, borderweight, fillcolor, message, tag) {
	this.Coordinates = coordinates;
	this.LocationType = locationtype;
	this.Icon = icon;
	this.Message = message;
	this.Marker = null;
	this.Polygon = null;
	this.PolyLine = null;
	this.Grouped = true;

	this.BorderColor = bordercolor;
	if (borderweight == "undefined") {
		this.BorderWeight = settings.drawingBorderWeight;
	}
	else {
		this.BorderWeight = borderweight;
	}
	this.FillColor = fillcolor;
	this.Tag = tag;
}

function PolyLine(coordinates, bordercolor, borderweight, message, tag) {
	return new Location(coordinates, MapLocationType.PolyLine, null, bordercolor, borderweight, null, message, tag);
}

function Polygon(coordinates, bordercolor, borderweight, fillcolor, message, tag) {
	return new Location(coordinates, MapLocationType.Polygon, null, bordercolor, borderweight, fillcolor, message, tag);
}

function Marker(coordinates, icon, message, tag) {
	return new Location(coordinates, MapLocationType.Marker, icon, null, null, null, message, tag);
}

/* Methods */
String.format = function () {
	var s = arguments[0];
	for (var i = 0; i < arguments.length - 1; i++) {
		var reg = new RegExp("\\{" + i + "\\}", "gm");
		s = s.replace(reg, arguments[i + 1]);
	}
	return s;
}

function IsTinyMcePresent() {
	return (typeof tinymce != 'undefined');
}

/* JQuery editor extension function */
$.fn.initializeGoogleMapEditor = function (options) {
	var mapObject;
	//Default property values for map
	var defaults = {
		enableEdit: true,               //Enable editing
		onlyOneLocationEditor: true,    //Clear all locations when new location added
		drawingBorderColor: "red",      //Default polygon color used when drawing
		drawingBorderWidth: 2,          //Width of polygon border
		drawingFillColor: "black",      //Default polygon filled color used when drawing
		markerIcon: null,               //Path to icon for marker. Default is null which will use google default marker icon
		markerIconOptions: new Array()  //List of icon paths to be displayed in editor
	}
	settings = $.extend({}, defaults, options);
	settings.mapContainer = this.attr("id");
	var tinyMceUrl = "//tinymce.cachefly.net/4.0/tinymce.min.js";

	if (settings.richTextEditor) {
		if (!IsTinyMcePresent()) {
			$.getScript(tinyMceUrl);
		}
	}

	mapObject = $("#" + settings.mapContainer).initializeGoogleMap(settings);
	return mapObject;

}

//JQuery viewer extension function
$.fn.initializeGoogleMap = function (options) {
	this.settings = null;
	this.map = null;
	this.activePin = null;
	this.drawingManager = null;
	var editPoly = null;
	var tooltip = null;
	this.tooltip = null;
	//var tinyMceScriptUrl = '../tinymce/tinymce.min.js';
	//var tinyMceScriptUrl = 'http: //localhost:1081/Website/scripts/tinymce/jquery.tinymce.min.js';

	var mapObject = this;
	//Default property values for map
	var defaults = {
	    defaultLatitude: 24.466728,             //Default location of the map
	    defaultLongitude: 54.366660,            //Default location of the map
		mapZoom: 15,                            //Default zoom of the map
		mapHeight: 0,                           //Height of map. If 0 then width of container tag is used.
		mapWidth: 0,                            //Width of map. If 0 then width of container tag is used.
		zoomControl: true,                      //Show zoom controls
		panControl: true,                       //Show pan control
		scaleControl: true,
		mapTypeControl: true,                   //Allow map type change by client
		streetViewControl: true,                //Show street view control
		mapLanguage: MapLanguage.English,       //Map language
		mapContainer: "",                       //Element that contains map. It is set after initialization
		mapType: MapType.Hybrid,                //Type of the map
		focusOnClick: true,                     //Focus location after click on it
		tooltipClass: "GoogleMapTooltip",       //Class that will be applied to tooltip container
		mouseOverOpacity: 0.6,                  //Polygon opacity on mouse over
		mouseOutOpacity: 0.4,                   //Polygon opacity on mouse out
		enableEdit: false,                      //Editor mode only
		onlyOneLocationEditor: true,            //Editor mode only
		drawingBorderWeight: 1,                 //Editor mode only
		drawingBorderColor: "black",            //Editor mode only
		drawingFillColor: "black",              //Editor mode only
		markerIcon: null,                       //Editor mode only - default marker add icon
		fitToLocations: true,                   //Fit map to all locations
		richTextEditor: true,                   //Use tiny MCE in edit mode
		drawingTools: {
			Marker: true,
			Polygon: true,
			PolyLine: true
		},                                      //Editor mode only
		mapLocations: [],                       //Location on the map
		mapStyle: null,                         //Style to be applied to map (use wizard http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html)
		decodeMessage: false, 		            //Html decode message when loading into map
		InfoType: infoType.InfoBox,             //How to display map viewer popup tooltip balloons
		infoBoxOptions: {
			pixelOffsetLeft: -32,
			pixelOffsetTop: -32,
			alignBottom: true

		},                                      //Infobox options except content http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/docs/reference.html
		scrollwheel: false,                     //Zoom map on scroll
		showSearch: true,                       //Show search bar in edit mode
		tooltipOnHover: true,                   //Show tooltip on hover
		markerGrouping: false,
		OnMapLoaded: null,                      //Map is fully loaded
		OnPolygonTransform: null,               //Polygon object is transformed
		OnLocationClick: null,                  //Location click handler
		OnLocationRemove: null,                 //Location remove handler
		OnLocationDragEnd: null,                //Drag end handler
		OnNewLocationAdd: null,                 //Location added by user
		OnImageRender: null,                    //Reised when GetMapImage is invoked
		OnMapZoom: null,                        //Map zoom event handler
		OnPopupClose: null,                     //Popup close event handler
		OnLocationAdd: null,                    //Location add event handler
		OnLocationHover: null,                  //Location Mouseover event
		OnLocationOut: null                     //Location Mouseout event
	}
	settings = $.extend({}, defaults, options);
	settings.mapContainer = this.attr("id");
	if (settings.mapWidth > 0) {
		this.width(settings.mapWidth);
	}
	if (settings.mapHeight > 0) {
		this.height(settings.mapHeight);
	}
	var tooltipTemplate = '<div class="' + settings.tooltipClass + '">{0}</div>'
	var tooltipEditTemplate = '<textarea>{0}</textarea><input type=\"button\" value=\"Save changes\" class=\"save-location-button\" /><input type=\"button\" value=\"Delete\" class=\"del-location-button\" /><label for=\"poly_border\">border color</label><input type="text" id="poly_border" /><label for=\"poly_fill\">fill color</label><input type="text" id="poly_fill" /><label for=\"poly_line\">border width</label><input type="text" id="poly_line" /><input type=\"checkbox\" id=\"grouped\" name=\"grouped\"/><label for=\"grouped\">grouped</label>'
	var tooltipMarkerIconSelect = "<select id=\"markerIcon\"></select>";
	var deleteLocQuestion = "Delete this location?";
	var mapApiUrl = "//maps.google.ae/maps/api/js?sensor=false&callback=mapApiLoaded"; //"//maps.googleapis.com/maps/api/js?sensor=false&callback=mapApiLoaded";

	if (settings.mapLanguage != "") {
		mapApiUrl += "&language=" + settings.mapLanguage;
	}
	if (settings.enableEdit) {
		mapApiUrl += "&libraries=drawing";
		if (settings.showSearch) {
			mapApiUrl += ",places";
		}
	}



	if ((typeof google !== "undefined" && google !== null ? google.maps : void 0) == null) {
		$.getScript(mapApiUrl);

		window.mapApiLoaded = function () {
			initializeMap();
			if (!settings.enableEdit) {
			    //$.getScript("//google-maps-utility-library-v3.googlecode.com/svn-history/r49/trunk/infobox/src/infobox.js");
			    $.getScript("/scripts/plugins/infobox.js");
			}
		};
	}
	else {
		initializeMap();
	}

	function stripHtml(htmlValue) {
		return $("<div/>").html(htmlValue).text();
	}

	function initializeMap() {
		var googleMapType = google.maps.MapTypeId.ROADMAP

		settings.infoBoxOptions.pixelOffset = new google.maps.Size(settings.infoBoxOptions.pixelOffsetLeft, settings.infoBoxOptions.pixelOffsetTop);

		switch (settings.mapType) {
			case 10:
				googleMapType = google.maps.MapTypeId.ROADMAP;
				break;
			case 20:
				googleMapType = google.maps.MapTypeId.SATELLITE;
				break;
			case 30:
				googleMapType = google.maps.MapTypeId.HYBRID;
				break;
			case 40:
				googleMapType = google.maps.MapTypeId.TERRAIN;
				break;
		}

		this.map = new google.maps.Map(document.getElementById(settings.mapContainer), {
			zoom: settings.mapZoom,
			center: new google.maps.LatLng(settings.defaultLatitude, settings.defaultLongitude),
			mapTypeId: googleMapType,
			zoomControl: settings.zoomControl,
			panControl: settings.panControl,
			scaleControl: settings.scaleControl,
			streetViewControl: settings.streetViewControl,
			zoom_changed: function () {
				if (settings.OnMapZoom != null) {
					settings.OnMapZoom(this.getZoom());
				}
			}
		});

		map.setOptions({ scrollwheel: settings.scrollwheel });

		if (settings.mapStyle != null) {
			map.setMapTypeId("mapstyle");
			map.mapTypes.set("mapstyle", new google.maps.StyledMapType(settings.mapStyle, { name: 'Custom map style' }));
		}

		google.maps.event.addListenerOnce(map, 'idle', function () {

			if (settings.enableEdit) {
				google.maps.event.addListener(map, 'click', function () {
					deselectPolygons();
				});
			}

			if (settings.OnMapLoaded != null) {
				settings.OnMapLoaded();
			}
			if (settings.mapLocations != null) {
				var location;
				var locations = settings.mapLocations;
				settings.mapLocations = [];
				$(this).AddLocations(locations)
			}
		});

	    /* START// ADDED BY SANAL ON 23-DEC-2014 */
		var minZoomLevel = 7;
		var strictBounds;

		google.maps.event.addListener(map, 'tilesloaded', function () {
		    strictBounds = map.getBounds();

		    google.maps.event.clearListeners(map, 'tilesloaded');
		});


		google.maps.event.addListener(map, 'dragend', function () {
		    if (strictBounds.contains(map.getCenter())) return;

		    var c = map.getCenter(),
                x = c.lng(),
                y = c.lat(),
                maxX = strictBounds.getNorthEast().lng(),
                maxY = strictBounds.getNorthEast().lat(),
                minX = strictBounds.getSouthWest().lng(),
                minY = strictBounds.getSouthWest().lat();

		    if (x < minX) x = minX;
		    if (x > maxX) x = maxX;
		    if (y < minY) y = minY;
		    if (y > maxY) y = maxY;

		    map.setCenter(new google.maps.LatLng(y, x));
		});

		google.maps.event.addListener(map, 'zoom_changed', function () {
		    if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
		    settings.mapZoom = map.getZoom();
		});

	    /* END// ADDED BY SANAL ON 23-DEC-2014 */

		//google.maps.event.addListener(map, 'zoom_changed', function () {
		//	settings.mapZoom = map.getZoom();
		//});

		if (settings.enableEdit) {
			if (settings.showSearch) {
				//Add search text input
				var searchMarkers = [];
				$("#" + settings.mapContainer).parent().prepend("<input id=\"map-editor-search-input\" class=\"controls\" type=\"text\" placeholder=\"Search Box\" />");
				var input = document.getElementById('map-editor-search-input');
				map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
				var searchBox = new google.maps.places.SearchBox(input);
				google.maps.event.addListener(searchBox, 'places_changed', function () {
					var places = searchBox.getPlaces();
					for (var i = 0, marker; marker = searchMarkers[i]; i++) {
						marker.setMap(null);
					}
					// For each place, get the icon, place name, and location.
					var bounds = new google.maps.LatLngBounds();
					for (var i = 0, place; place = places[i]; i++) {
						var image = {
							url: place.icon,
							size: new google.maps.Size(71, 71),
							origin: new google.maps.Point(0, 0),
							anchor: new google.maps.Point(17, 34),
							scaledSize: new google.maps.Size(25, 25)
						};
						// Create a marker for each place.
						var marker = new google.maps.Marker({
							map: map,
							icon: image,
							title: place.name,
							position: place.geometry.location
						});
						searchMarkers.push(marker);
						bounds.extend(place.geometry.location);
					}
					map.fitBounds(bounds);
				});
				google.maps.event.addListener(map, 'bounds_changed', function () {
					var bounds = map.getBounds();
					searchBox.setBounds(bounds);
				});
			}
			var drawingOptions = [];

			if (settings.drawingTools.Marker) {
				drawingOptions.push(google.maps.drawing.OverlayType.MARKER);
			}
			if (settings.drawingTools.Polygon) {
				drawingOptions.push(google.maps.drawing.OverlayType.POLYGON);
			}
			if (settings.drawingTools.PolyLine) {
				drawingOptions.push(google.maps.drawing.OverlayType.POLYLINE);
			}

			drawingManager = new google.maps.drawing.DrawingManager({
				drawingMode: google.maps.drawing.OverlayType.MARKER,
				drawingControl: true,
				polygonOptions: {
					draggable: true,
					fillOpacity: settings.mouseOutOpacity,
					strokeWeight: settings.drawingBorderWidth
				},
				markerOptions: {
					//icon: settings.markerIcon
				},
				drawingControlOptions: {
					position: google.maps.ControlPosition.TOP_CENTER,
					drawingModes: drawingOptions
				}
			});

			if (settings.markerIcon != null && settings.markerIcon != "") {
				$(this).SetDrawingMarkerIcon(settings.markerIcon);
			}

			$(this).SetDrawingBorderColor(settings.drawingBorderColor);
			$(this).SetDrawingFillColor(settings.drawingFillColor);

			google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
				if (settings.onlyOneLocationEditor) {
					$(this).ClearLocations();
				}
				var location = null;
				e.overlay.set("draggable", true);
				if (settings.drawingTools.Marker && e.type == google.maps.drawing.OverlayType.MARKER) {
					e.overlay.set("animation", google.maps.Animation.DROP);
					location = new Marker([new Coordinate(e.overlay.getPosition().lat(), e.overlay.getPosition().lng())], "", "", "");
					location.Marker = e.overlay;
					attachMarkerHandlers(e.overlay);
				}
				else if ((settings.drawingTools.Polygon || settings.drawingTools.PolyLine) && (e.type == google.maps.drawing.OverlayType.POLYGON || e.type == google.maps.drawing.OverlayType.POLYLINE)) {
					var coordinates;
					if (e.type == google.maps.drawing.OverlayType.POLYGON) {
						coordinates = attachPolygonEventHandlers(e.overlay);
					}
					if (e.type == google.maps.drawing.OverlayType.POLYLINE) {
						coordinates = attachPolylineEventHandlers(e.overlay);
					}

					for (i = 0; i < e.overlay.getPath().length; i++) {
						coordinates.push(new Coordinate(e.overlay.getPath().getAt(i).lat(), e.overlay.getPath().getAt(i).lng()))
					}

					if (e.type == google.maps.drawing.OverlayType.POLYGON) {
						location = new Polygon(coordinates, settings.drawingBorderColor, settings.drawingBorderWidth, settings.drawingFillColor, "", "");
						location.Polygon = e.overlay;
					}
					else if (e.type == google.maps.drawing.OverlayType.POLYLINE) {
						location = new PolyLine(coordinates, settings.drawingBorderColor, settings.drawingBorderWidth, "", "");
						location.PolyLine = e.overlay;
					}
				}
				if (location != null) {
					e.overlay.set("location", location);
					settings.mapLocations.push(location);
				}
				else {
					e.overlay.setMap(null);
				}
				if (settings.OnLocationAdd != null) {
					settings.OnLocationAdd(location);
				}
				if (settings.OnNewLocationAdd != null) {
					settings.OnNewLocationAdd(location);
				}
			});
			drawingManager.setMap(map);
		}
	}

	function readPolyColors() {

		$("#" + settings.mapContainer + " input#poly_fill").simpleColorPicker({
			colorsPerLine: 16
		});
		$("#" + settings.mapContainer + " input#poly_fill").val(activePin.location.FillColor);
		$("#" + settings.mapContainer + " input#poly_border").simpleColorPicker({
			colorsPerLine: 16
		});
		$("#" + settings.mapContainer + " input#poly_border").val(activePin.location.BorderColor);
		$("#" + settings.mapContainer + " input#poly_line").val(activePin.location.BorderWeight);
		$("#" + settings.mapContainer + " input#poly_line").numericInput();

		$("#" + settings.mapContainer + " input#grouped").attr("checked", activePin.location.Grouped);

		if (activePin.location.LocationType == 30) {
			$("#" + settings.mapContainer + " input#poly_fill").remove();
			$("#" + settings.mapContainer + " label[for='poly_fill']").remove();
		}

		if (activePin.location.LocationType == 10) {
			$("#" + settings.mapContainer + " input[type='text']").remove();
			$("label").remove();
		}
	}

	function getPolygonBounds(polygon) {
		var bounds = new google.maps.LatLngBounds();
		for (j = 0; j < polygon.location.Coordinates.length; j++) {
			bounds.extend(new google.maps.LatLng(polygon.location.Coordinates[j].Latitude, polygon.location.Coordinates[j].Longitude));
		}
		return bounds;
	}

	function toggleBounce(obj) {
		if (obj.getAnimation() != null) {
			obj.setAnimation(null);
		} else {
			stopBounce();
			obj.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function () {
				obj.setAnimation(null);
			}, 750);
		}
	}

	function stopBounce() {
		for (var k = 0; k < settings.mapLocations.length; k++) {
			if (settings.mapLocations[k].Marker != null) {
				if (settings.mapLocations[k].Marker.getAnimation() != null) {
					settings.mapLocations[k].Marker.setAnimation(null);
				}
			}
		}
	}

	function attachPolygonEventHandlers(polygon) {
		var coordinates = [];
		google.maps.event.addListener(polygon, 'dragend', function (event) {
			coordinates = [];
			for (i = 0; i < this.getPath().length; i++) {
				coordinates.push(new Coordinate(this.getPath().getAt(i).lat(), this.getPath().getAt(i).lng()))
			}
			this.location.Coordinates = coordinates;
			if (settings.OnLocationDragEnd != null) {
				settings.OnLocationDragEnd(this.location);
			}
			if (tooltip != null) {
				tooltip.close();
				tooltip = null;
			}
			if (settings.OnLocationDragEnd != null) {
				settings.OnLocationDragEnd(location);
			}
		});

		google.maps.event.addListener(polygon.getPath(), 'set_at', function (index, object) {
			var transformCoordinates = [];
			for (i = 0; i < this.length; i++) {
				transformCoordinates.push(new Coordinate(this.getAt(i).lat(), this.getAt(i).lng()))
			}

			if (editPoly != null) {
				editPoly.location.Coordinates = transformCoordinates;
			}

			if (settings.OnPolygonTransform != null) {
				settings.OnPolygonTransform(editPoly.location)
			}

		});

		google.maps.event.addListener(polygon.getPath(), 'insert_at', function (index, object) {
			var transformCoordinates = [];
			for (i = 0; i < this.length; i++) {
				transformCoordinates.push(new Coordinate(this.getAt(i).lat(), this.getAt(i).lng()))
			}
			if (editPoly != null) {
				editPoly.location.Coordinates = transformCoordinates;
			}
			if (settings.OnPolygonTransform != null) {
				settings.OnPolygonTransform(editPoly.location)
			}
		});

		google.maps.event.addListener(polygon, 'click', function (e) {

			polygon.set("editable", settings.enableEdit);

			if (settings.focusOnClick) {
				map.fitBounds(getPolygonBounds(this));
			}

			if (settings.OnLocationClick != null) {
				settings.OnLocationClick(polygon.location);
			}
			if (tooltip != null) {
				tooltip.close();
				tooltip = null;
			}
			if (!settings.enableEdit) {
				var loadedMessage;
				if (settings.decodeMessage) {
					loadedMessage = String.format(tooltipTemplate, htmlDecode(this.location.Message));
				}
				else {
					loadedMessage = String.format(tooltipTemplate, this.location.Message);
				}
				if (settings.InfoType == infoType.InfoWindow) {
					tooltip = new google.maps.InfoWindow({
						content: loadedMessage
					});
				}
				else {
					settings.infoBoxOptions.content = loadedMessage;
					tooltip = new InfoBox(settings.infoBoxOptions);
				}
			}
			else {
				if (editPoly != null) {
					editPoly.set("editable", false);
				}
				tooltip = new google.maps.InfoWindow({
					content: String.format(tooltipTemplate, String.format(tooltipEditTemplate, this.location.Message)),
					polygon: this
				});
				google.maps.event.addListener(tooltip, 'closeclick', function (event) {
					if (settings.OnPopupClose != null) {
						settings.OnPopupClose(this.polygon.location);
					}
					activePin = null;
				});
			}
			activePin = polygon;
			editPoly = polygon;

			google.maps.event.addListener(tooltip, 'domready', function () {
				if (settings.enableEdit) {
					if (IsTinyMcePresent()) {
						if (settings.richTextEditor) {
							initializeTinyMceEditor();
						}
					}
					$(".del-location-button").click(function () {
						if (confirm(deleteLocQuestion)) {
							$(this).RemoveLocation(activePin.location);
							tooltip.close();
						}
					});
					$(".save-location-button").click(function () {
						polygon.set("editable", false);
						if (IsTinyMcePresent()) {
							tinyMCE.triggerSave();
						}
						polygon.location.Message = $("." + settings.tooltipClass).find("textarea").val();
						if ($("." + settings.tooltipClass).find("#poly_fill").length > 0) {
							polygon.location.FillColor = $("." + settings.tooltipClass).find("#poly_fill").val();
							polygon.location.BorderColor = $("." + settings.tooltipClass).find("#poly_border").val();
							polygon.location.BorderWeight = $("." + settings.tooltipClass).find("#poly_line").val();
							polygon.location.Grouped = $("." + settings.tooltipClass).find("#grouped").is(':checked');
							polygon.setOptions({
								fillColor: polygon.location.FillColor,
								strokeColor: polygon.location.BorderColor,
								strokeWeight: polygon.location.BorderWeight
							});
						}
						tooltip.close();
						if (settings.OnPopupClose != null) {
							settings.OnPopupClose(polygon.location);
						}
						activePin = null;
					});

					readPolyColors();
				}
			});
			tooltip.setPosition(getPolygonBounds(this).getCenter());
			if (settings.enableEdit) {
				tooltip.open(map);
			}
			else if (this.location.Message != null && stripHtml(this.location.Message).trim() != "") {
				tooltip.open(this.map);
			}
		});
		google.maps.event.addListener(polygon, "mouseover", function () {

			if (settings.OnLocationHover != null) {
				settings.OnLocationHover(polygon.location);
			}

			if (tooltip != null) {
				tooltip.close();
				tooltip = null;
			}

			if (settings.tooltipOnHover && this.location.Message != null && this.location.Message != "" && stripHtml(this.location.Message) != "") {
				var loadedMessage = "";
				if (settings.decodeMessage) {
					loadedMessage = String.format(tooltipTemplate, htmlDecode(this.location.Message));
				}
				else {
					loadedMessage = String.format(tooltipTemplate, this.location.Message);
				}

				if (settings.InfoType == infoType.InfoWindow) {
					tooltip = new google.maps.InfoWindow({
						content: loadedMessage
					});
				}
				else {
					settings.infoBoxOptions.content = loadedMessage;
					tooltip = new InfoBox(settings.infoBoxOptions);
					tooltip.setPosition(getPolygonBounds(polygon).getCenter());
				}
				tooltip.open(this.map);
			}

			this.setOptions({
				fillOpacity: settings.mouseOverOpacity
			});
		});
		google.maps.event.addListener(polygon, "mouseout", function () {
			if (settings.OnLocationOut != null) {
				settings.OnLocationOut(polygon.location);
			}

			if (settings.tooltipOnHover) {
				if (tooltip != null) {
					tooltip.close();
					tooltip = null;
				}
			}

			this.setOptions({
				fillOpacity: settings.mouseOutOpacity
			});
		});
		return coordinates;
	}

	//POLY LINE
	function attachPolylineEventHandlers(polyline) {
		var coordinates = [];

		google.maps.event.addListener(polyline.getPath(), 'set_at', function (index, object) {
			var transformCoordinates = [];
			for (i = 0; i < this.length; i++) {
				transformCoordinates.push(new Coordinate(this.getAt(i).lat(), this.getAt(i).lng()))
			}

			if (editPoly != null) {
				editPoly.location.Coordinates = transformCoordinates;
			}

			if (settings.OnPolygonTransform != null) {
				settings.OnPolygonTransform(editPoly.location)
			}

		});

		google.maps.event.addListener(polyline.getPath(), 'insert_at', function (index, object) {
			var transformCoordinates = [];
			for (i = 0; i < this.length; i++) {
				transformCoordinates.push(new Coordinate(this.getAt(i).lat(), this.getAt(i).lng()))
			}

			if (editPoly != null) {
				editPoly.location.Coordinates = transformCoordinates;
			}
			if (settings.OnPolygonTransform != null) {
				settings.OnPolygonTransform(editPoly.location)
			}
		});


		google.maps.event.addListener(polyline, 'dragend', function (event) {
			coordinates = [];
			for (i = 0; i < this.getPath().length; i++) {
				coordinates.push(new Coordinate(this.getPath().getAt(i).lat(), this.getPath().getAt(i).lng()))
			}
			this.location.Coordinates = coordinates;
			if (settings.OnLocationDragEnd != null) {
				settings.OnLocationDragEnd(this.location);
			}
			if (tooltip != null) {
				tooltip.close();
				tooltip = null;
			}
			if (settings.OnLocationDragEnd != null) {
				settings.OnLocationDragEnd(location);
			}
		});

		google.maps.event.addListener(polyline, 'click', function (e) {
			polyline.set("editable", settings.enableEdit);

			if (settings.focusOnClick) {
				map.fitBounds(getPolygonBounds(this));
			}

			if (settings.OnLocationClick != null) {
				settings.OnLocationClick(polyline.location);
			}
			if (tooltip != null) {
				tooltip.close();
				tooltip = null;
			}
			if (!settings.enableEdit) {
				var loadedMessage;
				if (settings.decodeMessage) {
					loadedMessage = String.format(tooltipTemplate, htmlDecode(this.location.Message));
				}
				else {
					loadedMessage = String.format(tooltipTemplate, this.location.Message);
				}

				if (settings.InfoType == infoType.InfoWindow) {
					tooltip = new google.maps.InfoWindow({
						content: loadedMessage
					});
				}
				else {
					settings.infoBoxOptions.content = loadedMessage;
					tooltip = new InfoBox(settings.infoBoxOptions);
				}
			}

			else {
				if (editPoly != null) {
					editPoly.set("editable", false);
				}
				tooltip = new google.maps.InfoWindow({
					content: String.format(tooltipTemplate, String.format(tooltipEditTemplate, this.location.Message)),
					polyline: this
				});

				google.maps.event.addListener(tooltip, 'closeclick', function (event) {
					if (settings.OnPopupClose != null) {
						settings.OnPopupClose(this.polyline.location);
					}
					activePin = null;
				});
			}
			activePin = polyline;
			editPoly = polyline;

			google.maps.event.addListener(tooltip, 'domready', function () {
				if (settings.enableEdit) {
					readPolyColors();
					if (IsTinyMcePresent()) {
						if (settings.richTextEditor) {
							initializeTinyMceEditor();
						}
					}
					$(".del-location-button").click(function () {
						if (confirm(deleteLocQuestion)) {
							$(this).RemoveLocation(activePin.location);
							tooltip.close();
						}
					});
					$(".save-location-button").click(function () {
						polyline.set("editable", false);
						if (IsTinyMcePresent()) {
							tinyMCE.triggerSave();
						}
						polyline.location.Message = $("." + settings.tooltipClass).find("textarea").val();
						if ($("." + settings.tooltipClass).find("#poly_line").length > 0) {
							polyline.location.BorderColor = $("." + settings.tooltipClass).find("#poly_border").val();
							polyline.location.BorderWeight = $("." + settings.tooltipClass).find("#poly_line").val();
							polyline.setOptions({
								strokeColor: polyline.location.BorderColor,
								strokeWeight: polyline.location.BorderWeight
							});
						}
						tooltip.close();
						if (settings.OnPopupClose != null) {
							settings.OnPopupClose(activePin.location);
						}
						activePin = null;
					});
				}
			});
			tooltip.setPosition(getPolygonBounds(this).getCenter());
			if (settings.enableEdit) {
				tooltip.open(map);
			}
			else if (this.location.Message != null && this.location.Message != "") {
				tooltip.open(map);
			}
		});
		google.maps.event.addListener(polyline, "mouseover", function () {
			this.setOptions({
				fillOpacity: settings.mouseOverOpacity
			});
		});
		google.maps.event.addListener(polyline, "mouseout", function () {
			this.setOptions({
				fillOpacity: settings.mouseOutOpacity
			});
		});
		return coordinates;
	}
	// POLY LINE

	function initializeTinyMceEditor() {
		tinymce.init({
			selector: "." + settings.tooltipClass + " textarea",
			plugins: ["code image link media table textcolor"],
			resize: false,
			toolbar: "bold italic | forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | code",
			menubar: false,
			statusbar: false
		});

	}

	function attachMarkerHandlers(marker) {
		//google.maps.event.addListener(marker, "mouseover", function () {


		//    if (settings.OnLocationHover != null) {
		//        settings.OnLocationHover(marker.location);
		//    }

		//    //settings.infoBoxOptions.closeBoxURL = '';

		//    if (tooltip != null) {
		//        tooltip.close();
		//        tooltip = null;
		//    }


		//    if (!settings.enableEdit) {
		//        var loadedMessage;
		//		/*
		//        if (settings.decodeMessage) {
		//            loadedMessage = String.format(tooltipTemplate, htmlDecode(this.location.Message));
		//        }
		//        else {
		//            loadedMessage = String.format(tooltipTemplate, this.location.Message);
		//        }

		//        if (settings.InfoType == infoType.InfoWindow) {

		//            tooltip = new google.maps.InfoWindow({
		//                content: loadedMessage
		//            });
		//        }
		//        else {
		//            settings.infoBoxOptions.content = loadedMessage;
		//            tooltip = new InfoBox(settings.infoBoxOptions);
		//            tooltip.setPosition(marker.position);
		//        }
		//		*/
		//    }
		//    else {
		//        //deselectPolygons();
		//    }

		//    //console.log( "MARKER HOVER: " + this.location.Message);

		//    if (loadedMessage != null && stripHtml(loadedMessage) != "") {
		//        tooltip.open(this.map);
		//        //tooltip.open(this.map);
		//        //alert(this.map.title);
		//        //tooltip.open(map);
		//        //tooltip.open(marker.getMap());
		//    }
		//});

		//google.maps.event.addListener(marker, 'mouseout', function (event) {

		//    if (settings.OnLocationOut != null) {
		//        settings.OnLocationOut(marker.location);
		//    }

		//    if (tooltip != null) {
		//        tooltip.close();
		//        tooltip = null;
		//    }
		//});

		google.maps.event.addListener(marker, 'dragend', function (event) {
			var draggedLocation = this.location;
			draggedLocation.Coordinates = [];
			draggedLocation.Coordinates.push(new Coordinate(event.latLng.lat(), event.latLng.lng()));
			if (settings.OnLocationDragEnd != null) {
				settings.OnLocationDragEnd(draggedLocation);
			}
		});

		google.maps.event.addListener(marker, 'mouseover', function () {
		    markerZoomLevel = map.getZoom();
		});


	    //ADDED BY SANAL on 13-OCT-15
		function triggerLocationAccordianByCords(latLon) {
		    var cords = latLon;
		    var id = $('.tab-content:not(.js-tab-hidden) ul.locations-list').find("[data-Coordinate='" + latLon + "']").attr('data-Location');

		    triggerLocationAccordian(id);
		}

		function triggerLocationAccordian(id) {
		    var idName = "#" + id + " .opener";
		    var accordion = $(idName);
		    accordion.click();
		    setTimeout(function () {
		    	accordion.parents('.development-map-locations')
		    	//$('.tab-content:not(.js-tab-hidden) .development-map-locations')
		    		.data('jsp')
		    		.scrollToElement(accordion, true, true);
		    }, 600);
		    return false;
		}
	    //END OF CODE 13-OCT-15

		google.maps.event.addListener(marker, 'click', function () {
		    //deselectPolygons();
		    //ADDED by SANAL on 06-JAN-2015
		    var cordLatLong = Math.round(marker.position.lat() * 1000000) / 1000000 + ',' + Math.round(marker.position.lng() * 1000000) / 1000000;
		    triggerLocationAccordianByCords(cordLatLong);
		    map.setZoom(markerZoomLevel);


            //END OF 06-JAN-2015

			if (settings.focusOnClick) {
				map.panTo(this.position);
			}

			if (settings.OnLocationClick != null) {
				settings.OnLocationClick(this.location);
			}

			if (tooltip != null) {
				tooltip.close();
				tooltip = null;
			}

			if (!settings.enableEdit) {
				var loadedMessage;
				if (settings.decodeMessage) {
					loadedMessage = String.format(tooltipTemplate, htmlDecode(this.location.Message));
				}
				else {
					loadedMessage = String.format(tooltipTemplate, this.location.Message);
				}

				if (settings.InfoType == infoType.InfoWindow) {
					tooltip = new google.maps.InfoWindow({
						content: loadedMessage
					});
				}
				else {
					settings.infoBoxOptions.content = loadedMessage;
					tooltip = new InfoBox(settings.infoBoxOptions);
					tooltip.setPosition(marker.position);
				}
			}

			else {
				var tooltipContent = String.format(tooltipEditTemplate, this.location.Message);
				if (settings.markerIconOptions.length > 0) {
					tooltipContent += tooltipMarkerIconSelect;
				}

				tooltip = new google.maps.InfoWindow({
					content: String.format(tooltipTemplate, tooltipContent),
					marker: this
				});


				google.maps.event.addListener(tooltip, 'closeclick', function (event) {
					if (settings.OnPopupClose != null) {
						settings.OnPopupClose(this.marker.location);
					}
					activePin = null;
				});
			}
			activePin = marker;

			google.maps.event.addListener(tooltip, 'domready', function () {
				if (settings.enableEdit) {

					//Add icons
					if ($("select#markerIcon").length > 0) {
						$("select#markerIcon").empty();
						$("#markerIcon").append("<option></option>");

						for (i = 0; i < settings.markerIconOptions.length; i++) {
							if (this.marker.location.Icon.toLowerCase() == settings.markerIconOptions[i].toLowerCase()) {
								$("#markerIcon").append("<option style='background-image:url(" + settings.markerIconOptions[i] + ");' value='" + settings.markerIconOptions[i] + "' selected=\"selected\">&nbsp;</option>");
							}
							else {
								$("#markerIcon").append("<option style='background-image:url(" + settings.markerIconOptions[i] + ");' value='" + settings.markerIconOptions[i] + "'>&nbsp;</option>");
							}

						}
						$("#markerIcon").change(function () {
							$(this).css("background-image", "url(" + $(this).val() + ")");
						});
					}
					if (IsTinyMcePresent()) {
						if (settings.richTextEditor) {
							initializeTinyMceEditor();
						}
					}
					$(".del-location-button").click(function () {
						if (confirm(deleteLocQuestion)) {
							$(this).RemoveLocation(activePin.location);
							tooltip.close();
						}
					});
					//$(".save-location-button").off("click");
					$(".save-location-button").click(function () {
						if (IsTinyMcePresent()) {
							tinyMCE.triggerSave();
						}
						if ($("#markerIcon").val() != "") {
							activePin.setIcon(new google.maps.MarkerImage($("#markerIcon").val()));
							activePin.location.Icon = $("#markerIcon").val();
						}

						activePin.location.Message = $("." + settings.tooltipClass).find("textarea").val();
						tooltip.close();
						if (settings.OnPopupClose != null) {
							settings.OnPopupClose(activePin.location);
						}
						activePin = null;
					});
					readPolyColors();
				}
			});
			if (settings.enableEdit) {
				tooltip.open(map, this);
			}
			else if (this.location.Message != null && stripHtml(this.location.Message) != "") {
				tooltip.open(map, this);
			}
			toggleBounce(this);
		});
	}

	function getMapBounds() {
		var bounds = new google.maps.LatLngBounds();
		for (i = 0; i < settings.mapLocations.length; i++) {
			for (j = 0; j < settings.mapLocations[i].Coordinates.length; j++) {
				bounds.extend(new google.maps.LatLng(settings.mapLocations[i].Coordinates[j].Latitude, settings.mapLocations[i].Coordinates[j].Longitude));
			}
		}
		return bounds;
	}

	function getMapGroupedBounds() {
		var bounds = new google.maps.LatLngBounds();
		for (i = 0; i < settings.mapLocations.length; i++) {
			if (settings.mapLocations[i].Grouped == true) {
				for (j = 0; j < settings.mapLocations[i].Coordinates.length; j++) {
					bounds.extend(new google.maps.LatLng(settings.mapLocations[i].Coordinates[j].Latitude, settings.mapLocations[i].Coordinates[j].Longitude));
				}
			}
		}
		return bounds;
	}


	function htmlEncode(value) {
		return $('<div/>').text(value).html();
	}

	function htmlDecode(value) {
		return $('<div/>').html(value).text();
	}

	function deselectPolygons() {
		for (i = 0; i < settings.mapLocations.length; i++) {
			if (settings.mapLocations[i].Polygon != null) {
				settings.mapLocations[i].Polygon.set("editable", false);
				editPoly = null;
			}
			if (settings.mapLocations[i].PolyLine != null) {
				settings.mapLocations[i].PolyLine.set("editable", false);
				editPoly = null;
			}
		}
	}

	//Extension methods
	$.fn.AddLocation = function (location) {
		if (location.LocationType == MapLocationType.Marker) {
			var markerPosition = new google.maps.LatLng(location.Coordinates[0].Latitude, location.Coordinates[0].Longitude);
			var image = null;
			if (location.Icon != null) {
				image = new google.maps.MarkerImage(location.Icon);
			}
			var marker = new google.maps.Marker({
				draggable: settings.enableEdit,
				icon: image,
				map: map,
				position: markerPosition,
				//animation: google.maps.Animation.DROP,
				location: location
			});
			location.Marker = marker;
			attachMarkerHandlers(marker);

		}
		else if (location.LocationType == MapLocationType.Polygon) {
			var poligonCorners = [];
			for (c = 0; c < location.Coordinates.length; c++) {
				var polygonCorner = new google.maps.LatLng(location.Coordinates[c].Latitude, location.Coordinates[c].Longitude)
				poligonCorners.push(polygonCorner);
			}
			polygon = new google.maps.Polygon({
				path: poligonCorners,
				strokeWeight: location.BorderWeight,
				fillOpacity: settings.mouseOutOpacity,
				strokeColor: location.BorderColor,
				fillColor: location.FillColor,
				draggable: settings.enableEdit,
				location: location
			});
			polygon.setMap(map);
			location.Polygon = polygon;
			attachPolygonEventHandlers(polygon);
		}
		else if (location.LocationType == MapLocationType.PolyLine) {
			var polylineCorners = [];
			for (c = 0; c < location.Coordinates.length; c++) {
				var polylineCorner = new google.maps.LatLng(location.Coordinates[c].Latitude, location.Coordinates[c].Longitude)
				polylineCorners.push(polylineCorner);
			}

			polyline = new google.maps.Polyline({
				path: polylineCorners,
				strokeWeight: location.BorderWeight,
				fillOpacity: settings.mouseOutOpacity,
				strokeColor: location.BorderColor,
				draggable: settings.enableEdit,
				//editable: settings.enableEdit,
				location: location
			});
			polyline.setMap(map);
			location.PolyLine = polyline;
			attachPolylineEventHandlers(polyline);
		}

		settings.mapLocations.push(location);
		if (settings.OnLocationAdd != null) {
			settings.OnLocationAdd(location);
		}
	}

	$.fn.RemoveLocation = function (location) {
		settings.mapLocations.splice(settings.mapLocations.indexOf(location), 1);
		if (location.Marker != null) {
			location.Marker.setMap(null);
		}
		if (location.Polygon != null) {
			location.Polygon.setMap(null);
		}
		if (location.PolyLine != null) {
			location.PolyLine.setMap(null);
		}

		if (settings.OnLocationRemove != null) {
			settings.OnLocationRemove(location);
		}
	}

	$.fn.AddLocations = function (locations) {

		//alert("Add locations");

		for (i = 0; i < locations.length; i++) {
			mapObject.AddLocation(locations[i]);
		}
		if (settings.fitToLocations && locations.length > 0) {
			if (locations.length == 1) {
				map.setZoom(settings.mapZoom);
				map.setCenter(new google.maps.LatLng(locations[0].Coordinates[0].Latitude, locations[0].Coordinates[0].Longitude));
			}
			else {
				map.fitBounds(getMapBounds());
				map.setZoom(settings.mapZoom);

				//alert("TEST");

				/*
				setTimeout(function () {
				//map.setZoom(6);
				alert("here");
				}, 1000);
				*/
			}
		}

		if (settings.markerGrouping) {
			$.getScript("/scripts/markerclusterer.js", function () {
				var clusterMarkers = [];
				for (i = 0; i < settings.mapLocations.length; i++) {
					//mapObject.AddLocation(locations[i]);
					clusterMarkers.push(settings.mapLocations[i].Marker);
				}

				var markerClusterer;
				if (!settings.enableEdit) {

					if (markerClusterer) {
						markerClusterer.clearMarkers();
					}

					markerClusterer = new MarkerClusterer(map, clusterMarkers, {
						maxZoom: 13,
						gridSize: 50,
						styles: [{
							url: '/images/cluster.png',
							height: 59,
							width: 59,
							anchor: [0, 0],
							textColor: '#ffffff',
							opt_textColor: 'white',
							textSize: 18,
							fontFamily: 'Open Sans,​Arial,​Helvetica,​sans-serif'
						}]
					});
					markerClusterer
				}
			});



		}

	}


	$.fn.FitBounds = function () {
		map.fitBounds(getMapBounds());
	}

	$.fn.SetMessage = function (location, message) {
		location.Message = message;
	}

	$.fn.ClearLocations = function () {
		for (i = 0; i < settings.mapLocations.length; i++) {
			if (settings.mapLocations[i].Marker != null) {
				settings.mapLocations[i].Marker.setMap(null);
			}
		}
		for (i = 0; i < settings.mapLocations.length; i++) {
			if (settings.mapLocations[i].Polygon != null) {
				settings.mapLocations[i].Polygon.setMap(null);
			}
		}
		if (tooltip != null) {
			tooltip.close();
			tooltip = null;
		}

		settings.mapLocations = [];
	}

	$.fn.ResizeMap = function (width, height) {
		$("#" + settings.mapContainer).width(width);
		$("#" + settings.mapContainer).height(height);

		if (map != null) {
			google.maps.event.trigger(map, "resize");
		}
	}

	$.fn.SetMapWidth = function (width) {
		$("#" + settings.mapContainer).width(width);
		if (map != null) {
			google.maps.event.trigger(map, "resize");
		}
	}

	$.fn.SetMapHeight = function (height) {
		$("#" + settings.mapContainer).height(height);
		if (map != null) {
			google.maps.event.trigger(map, "resize");
		}
	}

	$.fn.SetDrawingBorderColor = function (color) {
		if (drawingManager != null) {
			settings.drawingBorderColor = color;
			drawingManager.get('polygonOptions').strokeColor = settings.drawingBorderColor;
			drawingManager.get('polylineOptions');
		}
	}


	$.fn.SetDrawingBorderWeight = function (weight) {
		if (drawingManager != null) {
			settings.drawingBorderColor = color;
			drawingManager.get('polygonOptions').strokeWeight = settings.drawingBorderWeight;
		}
	}


	$.fn.SetDrawingFillColor = function (color) {
		if (drawingManager != null) {
			settings.drawingFillColor = color;
			drawingManager.get('polygonOptions').fillColor = settings.drawingFillColor;
		}
	}

	$.fn.SetDrawingMarkerIcon = function (icon) {
		if (drawingManager != null) {
			settings.markerIcon = icon;
			drawingManager.get('markerOptions').icon = settings.markerIcon;
		}
	}

	$.fn.GetLocations = function () {
		return settings.mapLocations;
	}

	$.fn.GetMapObject = function () {
		return map;
	}

	$.fn.GetSettings = function () {
		return settings;
	}

	$.fn.FitToGroupedLocations = function () {
		map.fitBounds(getMapGroupedBounds());
	}

	$.fn.FitToLocations = function () {
		map.fitBounds(getMapBounds());
	}

	$.fn.ZoomToLocation = function (location) {
		map.setZoom(17);
		map.panTo(location.Marker.getPosition());
	}

	$.fn.SetPolygonFillColor = function (location, color) {
		if (location.Polygon != null) {
			location.BorderColor = color;
			location.Polygon.setOptions({
				fillColor: color
			});
		}
	}

	$.fn.SetPolygonBorderColor = function (location, color) {
		if (location.Polygon != null) {
			location.FillColor = color;
			location.Polygon.setOptions({
				strokeColor: color
			});
		}
	}

	$.fn.SetInfoboxOptions = function (options) {
		if (tooltip != null) {
			if (!settings.enableEdit) {
				if (typeof options.pixelOffsetLeft != 'undefined' && typeof options.pixelOffsetTop != 'undefined') {
					options.pixelOffset = new google.maps.Size(options.pixelOffsetLeft, options.pixelOffsetTop);
					settings.infoBoxOptions.pixelOffsetLeft = options.pixelOffsetLeft;
					settings.infoBoxOptions.pixelOffsetTop = options.pixelOffsetTop;
					settings.infoBoxOptions.pixelOffset = new google.maps.Size(options.pixelOffsetLeft, options.pixelOffsetTop);
				}
				tooltip.setOptions(options);
			}
		}
	}

	$.fn.SetMarkerIcon = function (location, icon) {
		if (location.Marker != null) {
			location.Icon = icon;
			location.Marker.setIcon(new google.maps.MarkerImage(icon));
		}
	}

	$.fn.GetActiveLocation = function () {
		if (!(typeof activePin === 'undefined') && activePin != null) {
			return activePin.location;
		}
		else {
			return null;
		}
	}

	$.fn.SetActiveLocation = function (location, popup, animate) {

		if (typeof animate === 'undefined') animate = true;
		if (tooltip != null) {
			tooltip.close();
			tooltip = null;
			activePin = null;
		}
		if (location.LocationType == MapLocationType.Polygon) {
			activePin = location.Polygon;
			if (settings.enableEdit) {
				editPoly = location.Polygon;
			}
			if (!settings.enableEdit) {
				var loadedMessage;
				if (settings.decodeMessage) {
					loadedMessage = String.format(tooltipTemplate, htmlDecode(location.Message));
				}
				else {
					loadedMessage = String.format(tooltipTemplate, location.Message);
				}

				if (settings.InfoType == infoType.InfoWindow) {
					tooltip = new google.maps.InfoWindow({
						content: loadedMessage
					});
				}
				else {
					settings.infoBoxOptions.content = loadedMessage;
					tooltip = new InfoBox(settings.infoBoxOptions);
				}
			}

			else {
				tooltip = new google.maps.InfoWindow({
					content: String.format(tooltipTemplate, String.format(tooltipEditTemplate, location.Message)),
					polygon: location.Polygon
				});
				google.maps.event.addListener(tooltip, 'closeclick', function (event) {
					location.Message = $("." + settings.tooltipClass).find("textarea").val();
					if (settings.OnPopupClose != null) {
						settings.OnPopupClose(location);
					}
					activePin = null;
				});
			}

			tooltip.setPosition(getPolygonBounds(location.Polygon).getCenter());
			if (popup) {
				tooltip.open(map);
			}
		}
		else if (location.LocationType == MapLocationType.Marker) {
			activePin = location.Marker;
			editPoly = null;
			if (!settings.enableEdit) {
				var loadedMessage;
				if (settings.decodeMessage) {
					loadedMessage = String.format(tooltipTemplate, htmlDecode(location.Message));
				}
				else {
					loadedMessage = String.format(tooltipTemplate, location.Message);
				}
				if (settings.InfoType == infoType.InfoWindow) {
					tooltip = new google.maps.InfoWindow({
						content: loadedMessage
					});
				}
				else {
					settings.infoBoxOptions.content = loadedMessage;
					tooltip = new InfoBox(settings.infoBoxOptions);
				}

			}

			else {
				tooltip = new google.maps.InfoWindow({
					content: String.format(tooltipTemplate, String.format(tooltipEditTemplate, location.Message) + tooltipMarkerIconSelect),
					marker: location.Marker
				});
				google.maps.event.addListener(tooltip, 'closeclick', function (event) {
					location.Message = $("." + settings.tooltipClass).find("textarea").val();
					if (settings.OnPopupClose != null) {
						settings.OnPopupClose(location);
					}
					activePin = null;
				});

				google.maps.event.addListener(tooltip, 'domready', function () {
					if (settings.enableEdit) {
						if (IsTinyMcePresent()) {
							if (settings.richTextEditor) {
								initializeTinyMceEditor();
							}
						}
						$(".del-location-button").click(function () {
							if (confirm(deleteLocQuestion)) {
								$(this).RemoveLocation(activePin.location);
								tooltip.close();
								activePin = null;
							}
						});

						$(".save-location-button").click(function () {
							tooltip.close();
							activePin = null;
						});

						readPolyColors();
					}
				});
			}

			if (location.Message != "") {
				tooltip.open(map, location.Marker);
			}
			else {
				map.panTo(new google.maps.LatLng(location.Coordinates[0].Latitude, location.Coordinates[0].Longitude));
			}


			if (animate) {
				toggleBounce(location.Marker);
			}
		}
	};
	$.fn.FindLocationByTag = function (tag) {
		for (i = 0; i < settings.mapLocations.length; i++) {
			if (settings.mapLocations[i].Tag == tag) {
				return settings.mapLocations[i];
			}
		}
		return null;
	}
	function rad(x) {
		return x * Math.PI / 180;
	}
	$.fn.FindClosestMarker = function (latitude, longitude) {
		var lat = latitude;
		var lng = longitude;
		var R = 6371; /* radius of earth in km */
		var distances = [];
		var closest = -1;
		for (i = 0; i < settings.mapLocations.length; i++) {
			if (settings.mapLocations[i].LocationType == MapLocationType.Marker) {
				if (settings.mapLocations[i].Coordinates[0].Latitude != latitude && settings.mapLocations[i].Coordinates[0].Longitude != longitude) {
					var mlat = settings.mapLocations[i].Coordinates[0].Latitude;
					var mlng = settings.mapLocations[i].Coordinates[0].Longitude;
					var dLat = rad(mlat - lat);
					var dLong = rad(mlng - lng);
					var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
					Math.cos(rad(lat)) * Math.cos(rad(lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
					var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
					var d = R * c;
					distances[i] = d;
					if (closest == -1 || d < distances[closest]) {
						closest = i;
					}
				}
			}
		}
		return settings.mapLocations[closest];
	}
	$.fn.GetLocationsJSON = function () {
		return JSON.stringify(mapObject.GetLocations(), ["Coordinates", "Latitude", "Longitude", "LocationType", "Icon", "Message", "BorderColor", "BorderWeight", "FillColor", "Tag", "Grouped"]);
	}
	return $(this);
}

/*
Simple color picker https: //github.com/rachel-carvalho/simple-color-picker
*/

$.fn.simpleColorPicker = function (options) {
	var defaults = {
		colorsPerLine: 8,
		colors: ['#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff'
		, '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff'
		, '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'
		, '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd'
		, '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0'
		, '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79'
		, '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'
		, '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4C1130'],
		showEffect: '',
		hideEffect: '',
		onChangeColor: false
	};
	var opts = $.extend(defaults, options);
	return this.each(function () {
		var txt = $(this);
		var colorsMarkup = '';
		var prefix = txt.attr('id').replace(/-/g, '') + '_';
		for (var i = 0; i < opts.colors.length; i++) {
			var item = opts.colors[i];
			var breakLine = '';
			if (i % opts.colorsPerLine == 0)
				breakLine = 'clear: both; ';
			if (i > 0 && breakLine && $.browser && $.browser.msie && $.browser.version <= 7) {
				breakLine = '';
				colorsMarkup += '<li style="float: none; clear: both; overflow: hidden; background-color: #fff; display: block; height: 1px; line-height: 1px; font-size: 1px; margin-bottom: -2px;"></li>';
			}
			colorsMarkup += '<li id="' + prefix + 'color-' + i + '" class="color-box" style="' + breakLine + 'background-color: ' + item + '" title="' + item + '"></li>';
		}
		var box = $('<div id="' + prefix + 'color-picker" class="color-picker" style="position: absolute; left: 0px; top: 0px;"><ul>' + colorsMarkup + '</ul><div style="clear: both;"></div></div>');
		$('body').append(box);
		box.hide();
		box.find('li.color-box').click(function () {
			if (txt.is('input')) {
				txt.val(opts.colors[this.id.substr(this.id.indexOf('-') + 1)]);
				txt.blur();
			}
			if ($.isFunction(defaults.onChangeColor)) {
				defaults.onChangeColor.call(txt, opts.colors[this.id.substr(this.id.indexOf('-') + 1)]);
			}
			hideBox(box);
		});
		$('body').live('click', function () {
			hideBox(box);
		});

		box.click(function (event) {
			event.stopPropagation();
		});

		var positionAndShowBox = function (box) {
			var pos = txt.offset();
			var left = pos.left + txt.outerWidth() - box.outerWidth();
			if (left < pos.left) left = pos.left;
			box.css({
				left: left,
				top: (pos.top + txt.outerHeight())
			});
			showBox(box);
		}

		txt.click(function (event) {
			event.stopPropagation();
			if (!txt.is('input')) {
				// element is not an input so probably a link or div which requires the color box to be shown
				positionAndShowBox(box);
			}
		});

		txt.focus(function () {
			/* Hide all pickers before showing */
			$(".color-picker").each(function (index) {
				hideBox($(this));
			});
			positionAndShowBox(box);
		});

		function hideBox(box) {
			if (opts.hideEffect == 'fade')
				box.fadeOut();
			else if (opts.hideEffect == 'slide')
				box.slideUp();
			else
				box.hide();
		}

		function showBox(box) {
			if (opts.showEffect == 'fade')
				box.fadeIn();
			else if (opts.showEffect == 'slide')
				box.slideDown();
			else
				box.show();
		}
	});
};

/* Allow only numeric */
$.fn.numericInput = function () {
	this.keydown(function (event) {
		// Allow: backspace, delete, tab, escape, and enter
		if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
		// Allow: Ctrl+A
			(event.keyCode == 65 && event.ctrlKey === true) ||
		// Allow: home, end, left, right
			(event.keyCode >= 35 && event.keyCode <= 39)) {
			// let it happen, don't do anything
			return;
		}
		else {
			// Ensure that it is a number and stop the keypress
			if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
				event.preventDefault();
			}
		}
	});
}
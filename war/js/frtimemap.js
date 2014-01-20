// Removes the 404 error on loading /undefinedimages/message*.png
SimileAjax.Graphics.pngIsTranslucent = false;

// Disables history management
// Suppress WARNING: No file found for: /__history__.html
SimileAjax.History.enabled = false;

TimeMap.loaders.placemarks_gss = function(options) {
	var loader = new TimeMap.loaders.gss(options), extraColumns = options.extraColumns
			|| [];
	// We want the transform function, but not as such;
	// save it under a different name and clear the function
	loader.oldTransform = loader.transform;
	loader.transform = function(data) {
		return data;
	};
	// Transform in the preload function
	loader.preload = function(data) {
		// basic preload: get rows
		var rows = data.feed.entry, items = [], item, i, coords = [];
		for (i = 0; i < rows.length; i++) {

			// empty the coords array
			coords.length = 0;

			// call the original loader transform to get the formatted object
			item = loader.oldTransform(rows[i]);

			// trim the location string
			// before tokenizing coords with the whitespace delimiter
			coords = $.trim(item.options["Location"]).split(" ");

			if (coords.length == 1) {
				// Point placemark
				item.point = TimeMap.util.makePoint(item.options["Location"],
						true);

			} else if (coords.length > 1) {
				// Polyline placemark

				item.polyline = TimeMap.util.makePoly(item.options["Location"],
						true);
				// Set point as null
				// so that it will not interfere with the rendering of the
				// polyline
				item.point = null;
			}

			items.push(item);
		}

		return items;
	}
	// return the customized loader
	return loader;
};

var tm;
$(function() {

	// Create an array of styles.
	var styles = [ {
		featureType : "water",
		elementType : "all",
		stylers : [ {
			//hue : "#00ffe6"
		}, {
			saturation : -20
		} ]
	}, {
		featureType : "road",
		elementType : "all",
		stylers : [ {
			saturation : -100
		} ]
	} ];

	// Create a new StyledMapType object, passing it the array of styles,
	// as well as the name to be displayed on the map type control.
	var styledMapType = new google.maps.StyledMapType(styles, {
		name : "failrailstyle"
	});
	
	// zoomOut is the initial zoom level
	// Minimum zoom level 15 required to view train station names on Google Maps
	var zoomOut = 13, zoomIn = 15;

	// custom theme for Upper band of the timeline
	var upperTheme = Timeline.ClassicTheme.create();
	upperTheme.mouseWheel = "zoom";
	upperTheme.firstDayOfWeek = 1; // Monday

	// custom theme for Lower band of the timeline
	var lowerTheme = Timeline.ClassicTheme.create();
	lowerTheme.mouseWheel = "zoom";

	var themeOptions = {
		color : '#414c43',
		eventIconPath : '../images/',
		eventIconImage : 'grey-circle.png'
	};
	TimeMap.themes.grey = TimeMapTheme.create("grey", themeOptions);

	tm = TimeMap
			.init({
				mapId : "map", // Id of map div element (required)
				timelineId : "timeline", // Id of timeline div element
				// (required)
				scrollTo : "latest",
				options : {
					centerOnItems : false,
					mapCenter : new mxn.LatLonPoint(1.320458, 103.843843), //Novena station
					// mapCenter : new mxn.LatLonPoint(1.350899, 103.848126), //Bishan station
					mapZoom : zoomOut,
					// mapType : "normal",
					eventIconPath : "../images/",
					lineWeight : 4,

				},
				datasets : [ {
					id : "disruptions",
					title : "Train Service Disruptions",
					type : "placemarks_gss",
					options : {
						key : "0AkdFf0ojY-LPdG52LWlpYU5kOG5USVpVbHAxMW5YSXc",
						paramMap : {
							start : "Started",
							// end : "Ended",
							title : "Category"
						},

						// load extra data from non-standard spreadsheet columns
						extraColumns : [ "Location", "incident", "Category",
								"Started", "Ended", "line", "commuters",
								"buses", "staff", "operator", "theme", "Links" ],

						infoTemplate : "<div id='event-details'>"
								+ "<p><span class='label'>Incident</span> {{incident}}</p>"
								+ "<p class='justify'><span class='label'>Description</span> {{description}}</p>"
								+ "<p><span class='label'>Started</span> {{Started}}</p>"
								+ "<p><span class='label'>Ended</span> {{Ended}}</p>"
								+ "<p><span class='label'>Category</span> {{Category}}</p>"
								+ "<p><span class='label'>Rail Line</span> {{line}} (<em>{{operator}}</em>)</p>"
								+ "<p><span class='label'>Commuters Affected</span> {{commuters}}-</p>"
								+ "<p><span class='label'>Buses Deployed</span> {{buses}}-</p>"
								+ "<p><span class='label'>Staff Deployed</span> {{staff}}-</p>"
								+ "</div>",

						openInfoWindow : function() {
							var item = this, html, links, placemark = item.placemark;
							
							
							if (item.getType() === 'polyline') {
								// Set the map info bubble to show
								// at the first point of the polyline
								// instead of the mid point
								item.opts.infoPoint = placemark.points[0];
								
							} 
							// pan to the new center if inside the map viewport
							item.map.setCenter(item.getInfoPoint(),{pan:true});
							item.map.setZoom(zoomIn);

							
							if (!item.opts.linksHtml) {

								item.opts.linksHtml = "<div class='pagination'><ul>"
										+ "<li><a href='#'>Sources</a></li>";

								// tokenize each link from the concat string
								links = item.opts.Links.split(" ");

								$
										.each(
												links,
												function(i, link) {
													if (link) {
														item.opts.linksHtml += "<li><a href='"
														item.opts.linksHtml += link;
														item.opts.linksHtml += "' target='_blank'>";
														item.opts.linksHtml += (i + 1);
														item.opts.linksHtml += "</a></li>";
													}
												});

								item.opts.linksHtml += "</ul></div>";
							}

							if (!item.opts.eventInfo) {
								// load the info template and cache it
								item.opts.eventInfo = item.getInfoHtml();
							}

							// initialize toaster message
							toastr.options = {
								positionClass : 'toast-bottom-right',
								timeOut : 9000,
								tapToDismiss : true
							}
							toastr.info(item.opts.eventInfo);

							// Overwrite the infoHtml
							// because the map info window is not using the
							// infoTemplate
							item.opts.infoHtml = "<div id='mapinfowindow'><p><i class='icon-map-marker'></i> <strong>"
									+ item.opts.Category
									+ "</strong>: "
									+ item.opts.incident
									+ "</p>"
									+ item.opts.linksHtml + "</div>";
							
							TimeMapItem.openInfoWindowBasic.call(item);

						}
					}
				} ],

				bandInfo : [ {
					width : "80%",
					intervalUnit : Timeline.DateTime.WEEK,
					intervalPixels : 140, // must match the zoom index
					theme : upperTheme,
					zoomIndex : 4,
					zoomSteps : new Array({
						// zoomIndex [0]
						pixelsPerInterval : 280,
						unit : Timeline.DateTime.DAY
					}, {
						// zoomIndex [1]
						pixelsPerInterval : 140,
						unit : Timeline.DateTime.DAY
					}, {
						// zoomIndex [2]
						pixelsPerInterval : 70,
						unit : Timeline.DateTime.DAY
					}, {
						// zoomIndex [3]
						pixelsPerInterval : 280,
						unit : Timeline.DateTime.WEEK
					}, {
						// zoomIndex [4]
						pixelsPerInterval : 140,
						unit : Timeline.DateTime.WEEK
					}, {
						// zoomIndex [5]
						pixelsPerInterval : 70,
						unit : Timeline.DateTime.WEEK
					})

				}, {
					width : "20%",
					intervalUnit : Timeline.DateTime.MONTH,
					intervalPixels : 100,
					showEventText : false,
					overview : true,
					theme : lowerTheme,
					zoomIndex : 2,
					zoomSteps : new Array({
						// zoomIndex [0]
						pixelsPerInterval : 400,
						unit : Timeline.DateTime.MONTH
					}, {
						// zoomIndex [1]
						pixelsPerInterval : 200,
						unit : Timeline.DateTime.MONTH
					}, {
						// zoomIndex [2]
						pixelsPerInterval : 100,
						unit : Timeline.DateTime.MONTH
					}, {
						// zoomIndex [3]
						pixelsPerInterval : 400,
						unit : Timeline.DateTime.YEAR
					}, {
						// zoomIndex [4]
						pixelsPerInterval : 200,
						unit : Timeline.DateTime.YEAR
					}, {
						// zoomIndex [5]
						pixelsPerInterval : 100,
						unit : Timeline.DateTime.YEAR
					})
				} ]
			});

	// filter function for rail line
	var filterRailLine = function(item) {
		// if no line was hidden, everything passes
		if (window.hiddenLines.length == 0)
			return true;

		// the item's line is not filtered
		if (item.opts.line && window.hiddenLines.indexOf(item.opts.line) == -1)
			return true;

		return false;

	};

	// By default, all lines are shown
	// Hence hidden lines are initialized as empty array
	window.hiddenLines = [];

	// add our new function to the map and timeline filters
	tm.addFilter("map", filterRailLine); // hide map markers on fail
	tm.addFilter("timeline", filterRailLine); // hide timeline events on fail
	
	$('#ewl-filter, #nsl-filter, #nel-filter, #ccl-filter, #bplrt-filter, #pglrt-filter')
			.click(
					function() {
						var id = $(this).attr('id');
						var line = $(this).val();
						
						if ($(this).is('.active')) {
							// Button was active before the click
							// User clicks to turn on the filter: hide events

							if ($.inArray(line, window.hiddenLines) == -1) {
								window.hiddenLines.push(line);
							}
							
							//console.debug(line + " filter is turned ON");

						} else {
							// Button was NOT active before the click
							// User clicks to turn off the filter: show events

							window.hiddenLines.splice(window.hiddenLines
									.indexOf(line), 1);
							//console.debug(line + " filter is turned OFF");
						}
						//console.debug("window.hiddenLines: " + window.hiddenLines.toString());
						
						if (id === 'ewl-filter') {
							$(this).toggleClass('btn-green');
						} else if (id === 'nsl-filter') {
							$(this).toggleClass('btn-danger');
						} else if (id === 'nel-filter') {
							$(this).toggleClass('btn-purple');
						} else if (id === 'ccl-filter') {
							$(this).toggleClass('btn-warning');
						} else if (id === 'bplrt-filter') {
							$(this).toggleClass('btn-cyan');
						} else if (id === 'pglrt-filter') {
							$(this).toggleClass('btn-muskgrey');
						} 
						
						// run filters
						tm.filter('map');
						tm.filter('timeline');
					});

	// set the map to our custom style
	var gmap = tm.getNativeMap();
	gmap.mapTypes.set("failrailstyle", styledMapType);
	gmap.setMapTypeId("failrailstyle");
	gmap.setOptions({
		disableDefaultUI : false
	});
});


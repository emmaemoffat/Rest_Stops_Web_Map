// final project javascript

require([
    "esri/config",
    "esri/Map", // basemap
    "esri/views/MapView",
    "esri/layers/FeatureLayer", // rest stops
    "esri/widgets/Legend", // add legend
    "esri/Graphic", // add graphics
    "esri/geometry/Point", // points, location
    "esri/geometry/geometryEngine", // for buffer
    "esri/layers/GraphicsLayer", // for buffer
    "esri/widgets/Locate", // location widget
    "esri/geometry/Extent", // extent widget to reset view
    "esri/widgets/ScaleBar", // scale bar
    "esri/rest/route",//module used for calculating route
    "esri/rest/support/RouteParameters",//module specifies parameters for route calc
    "esri/rest/support/FeatureSet",//module used for defining stops for route calc
], function(esriConfig, Map, MapView, FeatureLayer, Legend, Graphic, Point, geometryEngine, GraphicsLayer, Locate, Extent, ScaleBar, route, RouteParameters, FeatureSet) {  // remember to add the new require

//set up API key
esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurD7MtTwDtavBOT0IGGy0Y7EGJifhRf8WzgVwz694wHaWmGVHdTHZRxfni-GqIpkwLe4ZIKk-dkGoYZyn8-ZRugHANrBs6fbLBOMUtLOrJyPbSyXghNGJHFeKJ397vgMA9VGG8LwMI3nvbxbfheGK1FdxNJ9NE4cO0PGKL1BgCZNY1zu1wutvlFaKIO7rnsXfoG2kqzvDyaPht8QludW3yDs.AT1_Sgag9hoS";

let userLocation; // define userLocation at a higher scope

//common properties for points
var commonProperties ={
  type: "simple-marker",
  size: 7.5,
  style: "circle",
  outline: {
    width: 1,
    color: "black"
  }
}

//symbol for existing rest area
var existingRestAreaSymbol = {
  ...commonProperties,
  color: "#0056a9" //TxDOT blue
}

//symbol for new/renovated/reconstructed rest area
var newRestAreaSymbol = {
  ...commonProperties,
  color: "#d90d0d" //TxDOT red
}

//symbol for travel information center
var travelInformationCenterSymbol = {
  ...commonProperties,
  color: "#ffffff" //white
}

// Set renderer for unique values
var RestAreaRenderer = {
  type: "unique-value",
  legendOptions: {
    title: "Rest Area Type"
  },
  field: "Rest_Area_Description",
  uniqueValueInfos: [
    {
      value: "Existing Rest Area",
      symbol: existingRestAreaSymbol,
      label: "Existing Rest Area"
    },
    {
      value: "New/Renovated/Reconstructed Rest Area",
      symbol: newRestAreaSymbol,
      label: "New/Renovated/Reconstructed Rest Area"
    },
    {
      value: "Travel Information Center",
      symbol: travelInformationCenterSymbol,
      label: "Travel Information Center"
    }
  ]
};

//Template for popups
var popupSafetyRestArea = {
  title: "{Rest_Area_Name}",
  fieldInfos:[
    {
      fieldName: "Route Name",
      label: "RTE_NM",
    },
    {
      fieldName: "Mile Post",
      label: "Mile_Post",
      format: {
        places: 0,
        digitSeperator: true
      }
    },
    {
      fieldName: "Location",
      label: "Location",
    },
    {
      fieldName: "Features",
      label: "Features",
    },
    {
      fieldName: "More Information",
      label: "Website_Link",
    },
  ],
  // Includes unique image for each rest area
  content: [
    {
      type: "media",
      mediaInfos: [{
        type: "image",
        value: {
          sourceURL: "./images/rest_areas/{Images}.jpg"
        }
      }]
    },
    {
      type: "text",
      text: "<b>Route Name:</b> {RTE_NM}<br>" +
            "<b>Mile Post:</b> {Mile_Post}<br>" +
            "<b>Location:</b> {Location}<br>" +
            "<b>Features:</b><br>{Features}" +
            "<br><br><a href='{Website_Link}' target='_blank' style='color:rgb(189, 88, 44);'><b>More Information<b></a>"
    }
  ]
};

// Defines feature layer
var RestAreaLayer = new FeatureLayer({
  url:"https://services1.arcgis.com/M68M8H7oABBFs1Pf/arcgis/rest/services/Safety_Rest_Area_With_Features/FeatureServer",
  renderer: RestAreaRenderer,
  title: "Safety Rest Areas",
  popupTemplate: popupSafetyRestArea
});

var map = new Map({
  basemap: "streets",  // https://www.arcgis.com/apps/mapviewer/index.html?layers=de26a3cf4cc9451298ea173c4b324736
  layers: [RestAreaLayer]
});

// create mapview
var view = new MapView({
    container: "viewDiv", // reference view container
    map: map,
    zoom: 5,  // zoom level to focus on texas
    center: [-99.9018, 31.9686] // Centered on middle of Texas
});

// Adds legend
view.ui.add(new Legend({ view }), "bottom-left");

var graphicsLayer = new GraphicsLayer();
map.add(graphicsLayer);

// Store the initial map extent
let initialExtent;
view.when(() => {
    // Store the initial extent
    initialExtent = new Extent({
        xmin: -106.645646,
        ymin: 25.837377,
        xmax: -93.508292,
        ymax: 36.500704,
        spatialReference: { wkid: 4326 }
    });

// Add the full extent button
  const fullExtentButton = document.getElementById("fullExtentButton");

  fullExtentButton.addEventListener("click", () => {
    console.log("Full extent button clicked");
      view.goTo({
        target: initialExtent,
        duration: 1000  // 1 second animation
      }).catch((error) => {
        console.error("Error resetting map extent:", error);
      });
    });
});

// Create location widget
var locateWidget = new Locate({
    view: view, // Add widget to map
    useHeadingEnabled: false,
    goToOverride: function(view, options) {
        options.target.scale = 20000; // Set zoom level
        return view.goTo(options.target);
    }
});

view.ui.add(locateWidget, "top-left"); // Place locate widget on map

let fullExtentButton = document.getElementById("fullExtentButton"); // Check if the button already exists

// Add event handler to locate me and reset full extent when clicked
if (!fullExtentButton) {
    fullExtentButton = document.createElement("button");
    fullExtentButton.id = "fullExtentButton";
    fullExtentButton.className = "full-extent-button";
    fullExtentButton.textContent = "Full Extent";
    view.ui.add(fullExtentButton, "top-left");
    console.log("Full extent button created and added to the UI");

    fullExtentButton.onclick = () => {
        console.log("Full extent button clicked"); // Log button click
        console.log("Going to initial extent:", initialExtent); // Log initial extent before goTo
        view.goTo(initialExtent).then(() => {
            console.log("Map reset to initial extent"); // Log success
        }).catch((error) => {
            console.error("Error resetting map extent:", error); // Log error
        });
    };
}

locateWidget.on("locate", function(evt) {
    userLocation = new Point({
        longitude: evt.position.coords.longitude,
        latitude: evt.position.coords.latitude,
        spatialReference: { wkid: 4326 }
    });

    console.log("User location:", userLocation);

    // Create the buffer around the locate me
    var buffer = geometryEngine.geodesicBuffer(userLocation, 20, "miles");
    console.log("Buffer created:", buffer);

    // Buffer graphic
    var bufferGraphic = new Graphic({
        geometry: buffer,
        symbol: {
            type: "simple-fill",
            color: [210, 180, 140, 0.6],
            outline: {
                color: [72, 209, 204], // teal
                width: 2
            }
        }
    });

    // Location (locate me) marker
    var markerGraphic = new Graphic({
        geometry: userLocation,
        symbol: {
            type: "simple-marker",
            color: [210, 180, 140, 0.6], // changed color to a beige to match earth tone scheme
            size: "12px",
            outline: {
                color: [210, 180, 140], // beige
                width: 1
            }
        }
    });

    graphicsLayer.add(bufferGraphic);
    graphicsLayer.add(markerGraphic);

    console.log("Graphics added to layer");

    // Adjust the view to fit the buffer size
    view.goTo({
        target: buffer.extent.expand(1.5), // the zoom was not far enough out, added expand
        padding: 50
    });
});

// add scale bar
var scaleBar = new ScaleBar({
  view: view,
  unit: "dual"  // dual, metric, or non-metric
});

// position of the map scale
view.ui.add(scaleBar, {
  position: "bottom-right"
});

// add class to the scale bar - map disappers when this is active
view.ui.add(scaleBar, { position: "bottom-right" });
// set margin-bottom to move the scale bar above the footer
const scaleBarContainer = scaleBar.container; scaleBarContainer.style.marginBottom = "60px";

    //**START OF QUERY CODE**

 //array that contains rest stops features
 const uniqueFeatures = [
     "Air-conditioned lobby and restrooms", "Bilingual staff (English and Spanish)", "Diaper changing stations",
     "Drinking water", "Family/assisted restroom", "Group picnic facility", "Handicap access",
     "Interpretive displays", "Men's and women's restrooms", "Picnic arbors", "Picnic tables",
     "Playground", "Professional travel counselor", "Security guards (5 p.m to 8 a.m.)",
     "Security surveillance", "Separate truck and passenger parking", "Storm shelter",
     "Two sets of men's and women's restrooms", "US 290: walking trail", "Vending machines",
     "Video theater", "Walking trail", "Weather information", "Wireless internet access",
     " 'Welcome to Texas' photo area"
 ];

//array that contains the rest stop type
 const uniqueRestAreaTypes = [
        "Existing Rest Area",
        "New / Renovated / Reconstructed Rest Area",
        "Travel Information Center"
    ];

 //assigns featuresCheckboxes element ID in HTML to featuresContainer. this container will have all the checkboxes and labels for query
 const featuresContainer = document.getElementById("featuresCheckboxes");

 //creating checkboxes and labels for features
 uniqueFeatures.forEach(feature => {                    //for each feature in the array...
     const label = document.createElement("label");     //creates label element; container for checkbox and text (accessbility feature that allows you to click the text, not just checkbox)
     const checkbox = document.createElement("input");  //creates input element; defines the type (checkbox) and value (rest stop features)
     checkbox.type = "checkbox";
     checkbox.value = feature;
     label.appendChild(checkbox);                               //add checkbox to the label
     label.appendChild(document.createTextNode(" " + feature)); //adds a reaadble text (the feature) next to each checkbox
     featuresContainer.appendChild(label);                      //add label and checkbox to the dropdown container
 });

//assigns restAreaTypeCheckboxes element ID in HTML to restAreaContainer. this container will have all the checkboxes and labels for query.
 const restAreaContainer = document.getElementById("restAreaTypeCheckboxes");

//creating checkboxes and labels for rest area types
 uniqueRestAreaTypes.forEach(type => {                 //for each feature in the array...
     const label = document.createElement("label");    //creates label element; container for checkbox and text (accessbility feature that allows you to click the text, not just checkbox)
     const checkbox = document.createElement("input"); //creates input element; defines the type (checkbox) and value (rest stop features)
     checkbox.type = "checkbox";
     checkbox.value = type;
     label.appendChild(checkbox);                             //add checkbox to the label
     label.appendChild(document.createTextNode(" " + type));  //adds a reaadble text (the rest area type) next to each checkbox
     restAreaContainer.appendChild(label);                    //add label and checkbox to the dropdown container
 });

 //set up click event for runQuery button
 document.getElementById("runQuery").addEventListener("click", function() {
   const selectedFeatures = Array.from(featuresContainer.querySelectorAll("input[type='checkbox']:checked"))   //retrieve all features that are checked in query and puts into array
       .map(cb => cb.value.replace(/'/g, "''").toLowerCase().trim());                                          //replaces " ' " to " '' ", turns all letters to lowercase, and removes extra whitespace

   const selectedRestAreaTypes = Array.from(restAreaContainer.querySelectorAll("input[type='checkbox']:checked")) //retrieve all types that are checked in query and puts into array
             .map(cb => cb.value.replace(/'/g, "''").trim());                                                     //replaces " ' " to " '' ", removes extra white space

  //creating an array that combines the results from the features and rest area types selected in the query
   let queryParts = [];
         if (selectedFeatures.length) {
             queryParts.push(selectedFeatures.map(feature => `LOWER(features) LIKE '%${feature}%'`).join(" AND ")); //if features are selected, it creates a query expression string (ex: LOWER(features) LIKE '%playground%' AND LOWER(features) LIKE '%restrooms% AND...')
         }
         if (selectedRestAreaTypes.length) {
             queryParts.push(selectedRestAreaTypes.map(type => `Rest_Area_Description = '${type}'`).join(" AND ")); //if rest area types are selected, it creates a query expression string
         }

   //assigns a definition expression to the rest stops feature layer
   RestAreaLayer.definitionExpression = queryParts.length //checks to see if there is at least one feature/rest stop type that was selected in dropdown containers
       ? queryParts.join(" AND ") //combines the elements in the array into a single string
       : ""; //if nothing is selected, all features are displayed

   RestAreaLayer.queryFeatures({                   //query is performed on feature layer
       where: RestAreaLayer.definitionExpression,  //the query is based on the definitionExpression defined above
       outFields: ["*"],
       returnGeometry: true
   }).then(displayResults).catch(error => console.error("Error querying features:", error));  //if query is successful, display results; if not, log error in console
});

// Set up click event for clearQuery button
document.getElementById("clearQuery").addEventListener("click", function() {
   graphicsLayer.removeAll();                                                     //clear query results from map
   RestAreaLayer.definitionExpression = "";                                      //reset definitionExpression
   document.getElementById("printResults").innerText = "Select Features and/or Rest Area Type";       //reset the printResults html element
   view.popup.close();                                                           //close popups
   featuresContainer.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false); //uncheck boxes
   restAreaContainer.querySelectorAll("input[type='checkbox']").forEach(cb => (cb.checked = false)); //uncheck boxes
});

//function for displaying query results
function displayResults(results) {
   graphicsLayer.removeAll();                             //clear all previous graphics from the graphics layer
   const graphics = results.features.map(feature => {    //creates an array with features from the query results, which will be turned into a graphic object
       return new Graphic({                   //.map returns a new graphic for each feature
           geometry: feature.geometry,        //symbolize features
           symbol: {
               type: "simple-marker",
               style: "circle",
               color: "#808000",
               size: 7.5,
               outline: { color: "black", width: 1 }
           },
           attributes: feature.attributes,   //atributes for features
           popupTemplate: popupSafetyRestArea    //popups for features
       });
   });

   //add the generated graphics to the graphics layer
   graphicsLayer.addMany(graphics);


   view.popup.dockEnabled = true;       // Enable docking to enforce static behavior

   view.popup.dockOptions = {
        buttonEnabled: false,    // Disable docking button
        breakpoint: false,        // Keep docked mode on all screen sizes
    };

    view.popup.open({
        features: graphics,    // Display all features in the popup
        featureMenuOpen: false, // Keep the feature menu closed
        updateLocationEnabled: false // Disable automatic location updates

    });

   //update the printResults element in HTML to display the number of results found in the query
   const printResults = document.getElementById("printResults");
    if (graphics.length > 0) {
        printResults.innerText = `${graphics.length} result${graphics.length > 1 ? 's' : ''} found!`; // add an "s" to results if there are more than 1 result
    } else {
        printResults.innerText = "0 results found!";
    }
}
    //**END OF QUERY CODE**

    //**START OF ROUTE DISTANCE CALCULATOR CODE***

let calcEnabled = false;                     //tracks toggle state; false=off and true=on
let points = [];                            //create an empty array to store the clicked start and end points

    //ON-OFF TOGGLE FOR DISTANCE CALCULATOR
document.getElementById("toggleButton").onclick = () => {
    //toggles the value of calcEnabled and changes the text on the button based on the value of calcEnabled
    calcEnabled = !calcEnabled;
    document.getElementById("toggleButton").textContent = calcEnabled ? "Reset Distance Calculator" : "Enable Distance Calculator";  //cjb

    if (!calcEnabled) {                //if calculator is disabled...
        points.length = 0;            //...points array is emptied...
        view.graphics.removeAll();    //...all graphics removed from map...
        document.getElementById("distanceOutput").innerHTML = "Distance: Not calculated yet"; //..and HTML is updated
    }
};

    //FUNCTION TO CALCULATE ROUTE AND DISTANCE
function calcRoute(start, end) {                  //define a function that takes two arguments (the start and end points)
    const routeParams = new RouteParameters({     //RouteRarameters is an object used to set up parameters for the route
        stops: new FeatureSet({                       //this parameter specifies the locations used in the route calculator, which is a FeatureSet...
            features: [start, end]                    //...containing the start and end points
        }),
        returnDirections: true                       //this parameter returns the turn-by-turn directions, but we will only be needing it to get the total route distance value
    });

    route.solve("https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World", routeParams)   //the route.solve function sends a request to ArcGIS World Route Service to calculate the route between the two clicked points

        //this part of the code runs when the route.solve promise is resolved correctly (i.e. when the data from ArcGIS World Route Service is retreived successfully)
        .then(response => {                                         //response is just a name given to the data the promise returns after successfully completed
            const routeLine = response.routeResults[0].route;      //.route is a property inside the routeResults array that contains the actual geometry of the route (the line between the two points)
            routeLine.symbol = {                                   //style for the route line
                type: "simple-line",
                color: "#bdb9b9",
                width: 4
            };
            view.graphics.add(routeLine);                          //adds the route line to the map

            const directions = response.routeResults[0].directions;     //retreives the turn-by-turn directions...
            const totalDistance = directions.totalLength.toFixed(2);    //...to get the total route distance, and round to 2 decimals
            document.getElementById("distanceOutput").innerHTML = "Distance: " + totalDistance + " miles";  //updates distance output div in HTML with actual route distance
        })

        //this part of the code runs if the promise is not resolved
        .catch(error => {
            console.error("Error calculating route:", error);
        });
}

    //CLICK EVENT FOR START AND END POINTS
view.on("click", function (event) {
    if (!calcEnabled) return;
      const point = new Graphic({
          geometry: event.mapPoint,    //mapPoint gets the geographic coordinates (lat and long) of the click on the map
          symbol: {
              type: "simple-marker",
              color: "#bdb9b9",
              size: "12px"
          }
      });

    view.graphics.add(point);                     //adds clicked point to map
    points.push(point);                           //adds clicked point to array

    //CALCULATE ROUTE FROM TWO POINTS
    if (points.length === 2) {                   //calculate the route between the two points only when two points are added
        calcRoute(points[0], points[1]);
    } else if (points.length > 2) {              //if there are more than 2 points in points array...
        points = [point];                        //reassigns the points array to contain only the most recent clicked point to the map
        view.graphics.removeAll();               //remove all previous points from map
        view.graphics.add(point);                //add the most recent clicked point to the map
        document.getElementById("distanceOutput").innerHTML = "Distance: Not calculated yet";  //updates distance output div in HTML to say "Distance: Not calculated yet"
    }
});

    //***END OF ROUTE DISTANCE CALCULATOR CODE***

    //**START OF BUFFER CALCULATOR CODE***
           // need to use buffercalc and distance calc difference
 let bufferEnabled = false; //tracks toggle state; false=off and true=on
 let bufferCalcEnabled = false; // added so that both the buffer calc and distance calc cannot be active at the same time
 let bufferRadius = 60; // default radius in miles

// buffer calculator toggle button
  document.getElementById("toggleButton3").onclick = () => {
  bufferEnabled = !bufferEnabled;
  if (bufferEnabled) {
    bufferCalcEnabled = false; // disable distance calculator if buffer calculator is enabled
    document.getElementById("toggleButton").disabled = true;
    document.getElementById("toggleButton3").textContent = "Reset Buffer Calculator"; // opposite text to distance calculator
    document.getElementById("distanceOutput3").style.display = "block"; // Show the radius select
  } else {
    view.graphics.removeAll();               //remove all previous points from map
    document.getElementById("toggleButton").disabled = false;
    document.getElementById("toggleButton3").textContent = "Enable Buffer Calculator";
    document.getElementById("distanceOutput3").style.display = "block"; // Keep the radius select visible
    document.getElementById("radiusSelect").value = "5"; // Reset to default value
      }
};

    // radius dropdown event listener
    document.getElementById("radiusSelect").addEventListener("change", function() {
      bufferRadius = parseInt(this.value);
      console.log("Buffer Radius Selected:", bufferRadius); // debugging log
    });

  // click event for buffer calculator
  view.on("click", function(event) {
    if (bufferEnabled && !bufferCalcEnabled) {
      console.log("Map Clicked for Buffer:", event.mapPoint); // debugging log
      // Clear previous graphics
      view.graphics.removeAll();
      const point = new Graphic({
        geometry: event.mapPoint,
        symbol: {
          type: "simple-marker",
          color: "#f4a460", // match the color of option 3 box
          size: "8px"
        }
      });
      view.graphics.add(point);

      // Get current buffer radius from select
      bufferRadius = parseInt(document.getElementById("radiusSelect").value);

      const buffer = geometryEngine.geodesicBuffer(point.geometry, bufferRadius, "miles");
      console.log("Buffer Created:", buffer); // debugging log

      const bufferGraphic = new Graphic({
        geometry: buffer,
        symbol: {
          type: "simple-fill",
          color: [244, 164, 96, 0.25], // lighter color relative to the selected drop-down
          outline: {
            color: [244, 164, 96],
            width: 2
          }
        }
      });
      view.graphics.add(bufferGraphic);
    }
  });
//**END OF BUFFER CALCULATOR CODE***
});

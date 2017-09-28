# mapboard

_(work in progress)_

![Atlas](http://i.imgur.com/GcZpsgX.png)

Mapboard is a framework for building web applications that answer questions about locations in a city, such as:

- Who owns this property?
- What building permits have been issued here?
- What's the neighborhood school for this address?

The goal of this framework is to make it easier to build mapping apps that meet the model of "clickable map on one side, address details on the other". This encompasses a range of common municipal tools such as parcel viewers, permit lookup apps, polling place locators, crime maps, etc.

Mapboard has been written to serve the needs of the City of Philadelphia, but with some effort it could be adapted to fit other cities -- and perhaps regional governments -- as well.

From a technical standpoint, Mapboard is a JavaScript library that accepts a config object and an empty DOM element, and the rest is handled for you. Your config defines:

- The content you want to show for an address
- Your APIs
- How the map looks
- How geocoding should work

Under the hood, Mapboard uses Vue.js for rendering and Leaflet for mapping.

## Todo

- Write real docs
- Generalize how parcels are handled so other cities can use Mapboard
- Extract Vue+Leaflet bindings into their own package
- Get to the top of Reddit

## Publishing

To publish a new version of Mapboard to NPM:

1. Commit your changes to `master`.
2. Bump the NPM version with `npm version major|minor|patch`.
3. Push with tags: `git push --tags`.
4. Update wiki docs to reflect new version and/or dependency changes.

Travis will now run a build and publish to NPM.

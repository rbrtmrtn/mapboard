export default {
  methods: {
    fetchData(feature) {
      const dataSources = this.$config.dataSources || {};
      for (let [dataSourceKey, dataSource] of Object.entries(dataSources)) {
        const type = dataSource.type;

        // TODO null out existing data in state

        // check to make sure the data source should run (aka has necessary
        // state dependencies)
        const readyFn = dataSource.ready;
        if (readyFn) {
          const state = this.$store.state;
          const isReady = readyFn(state);
          if (!isReady) {
            return;
          }
        }

        this.$store.commit('setSourceStatus', {
          key: dataSourceKey,
          status: 'waiting'
        });

        switch(type) {
          case 'json':
            this.fetchJson(feature, dataSource, dataSourceKey);
            break;
          case 'esri':
            this.fetchEsri(feature, dataSource, dataSourceKey);
            break;
          case 'esri-nearby':
            this.fetchEsriNearby(feature, dataSource, dataSourceKey);
            break;
          default:
            break;
        }
      } // end of loop
    },

    assignFeatureIds(features, dataSourceKey) {
      // console.log('assignFeatureIds', dataSourceKey)
      const featuresWithIds = [];

      // REVIEW this was not working with Array.map for some reason
      // it was returning an object when fetchJson was used
      // that is now converted to an array in fetchJson
      for (let i = 0; i < features.length; i++) {
        const id = `feat-${dataSourceKey}-${i}`;
        const feature = features[i];
        // console.log(dataSourceKey, feature);
        try {
          feature._featureId = id;
        }
        catch (e) {
          console.warn(e);
        }
        featuresWithIds.push(feature);
      }

      // console.log(dataSourceKey, features, featuresWithIds);
      return featuresWithIds;
    },


    didFetchData(key, status, responseData) {

      //TODO - pick which of these to useful

      // const dataOrNull = status === 'error' ? null : data;
      // let stateData = dataOrNull;
      //
      // // if this is an array, assign feature ids
      // if (Array.isArray(stateData)) {
      //   stateData = this.assignFeatureIds(stateData, key);
      // }

      const data = status === 'error' ? null : responseData;
      const dataWithIds = this.assignFeatureIds(data, key);
      // console.log(key, data, dataWithIds);

      // put data in state
      this.$store.commit('setSourceData', {
        key,
        data: dataWithIds,
      });

      // update status
      this.$store.commit('setSourceStatus', {
        key,
        status,
      });
    },

    evaluateParams(feature, dataSource) {
      const params = {};
      const paramEntries = Object.entries(dataSource.options.params);
      const state = this.$store.state;

      for (let [key, valOrGetter] of paramEntries) {
        let val;

        if (typeof valOrGetter === 'function') {
          val = valOrGetter(feature, state);
        } else {
          val = valOrGetter;
        }

        params[key] = val;
      }

      return params;
    },

    fetchJson(feature, dataSource, dataSourceKey) {
      // console.log('fetchJson is running with', dataSource.url);
      const params = this.evaluateParams(feature, dataSource);
      const url = dataSource.url;
      const options = dataSource.options;
      const successFn = options.success;

      // if the data is not dependent on other data
      this.$http.get(url, { params }).then(response => {
        // TODO pick which to use
        // let data = response.body;
        // if (successFn) {
        //   data = successFn(data);
        // }
        // this.didFetchData(dataSourceKey, 'success', data);

        // console.log('fetchJson', dataSourceKey)
        const dataObject = response.body;
        // console.log(dataSourceKey, dataObject);
        let data
        if (dataSourceKey === 'zoningDocs' || dataSourceKey === 'nearby' || dataSourceKey === 'zoningAppeals') {
          data = Object.keys(dataObject).map(key => dataObject[key])[0];
          // console.log('if1', dataSourceKey, data);
        } else {
          data = dataObject;
          // console.log('if2', dataSourceKey, data);
        }
        try {
          this.didFetchData(dataSourceKey, 'success', data);
        }
        catch(e) {
          // console.warn(dataSourceKey, e)
        }
      }, response => {
        console.log('fetch json error', response);
        this.didFetchData(dataSourceKey, 'error');
      });
    }, // end of fetchJson

    fetchEsriSpatialQuery(dataSourceKey, url, relationship, targetGeom) {
      // console.log('fetch esri spatial query');

      const query = L.esri.query({url})[relationship](targetGeom);

      query.run((error, featureCollection, response) => {
        // console.log('did get esri spatial query', response, error);

        const data = featureCollection.features;
        const status = error ? 'error' : 'success';
        this.didFetchData(dataSourceKey, status, data);
      });
    },

    fetchEsri(feature, dataSource, dataSourceKey) {
      const options = dataSource.options;
      const url = dataSource.url;
      const relationship = options.relationship;
      const geom = feature.geometry;

      this.fetchEsriSpatialQuery(dataSourceKey, url, relationship, geom);
    },

    fetchEsriNearby(feature, dataSource, dataSourceKey) {
      // console.log('fetch esri nearby', feature);

      //const params = this.evaluateParams(feature, dataSource);
      // const url = dataSource.url;
      const {options} = dataSource;
      const dataSourceUrl = dataSource.url;
      const {geometryServerUrl} = options;

      // params.geometries = `[${feature.geometry.coordinates.join(', ')}]`
      // TODO get some of these values from map, etc.
      const params = {
        // geometries: feature => '[' + feature.geometry.coordinates[0] + ', ' + feature.geometry.coordinates[1] + ']',
        geometries: `[${feature.geometry.coordinates.join(', ')}]`,
        inSR: () => 4326,
        outSR: () => 4326,
        bufferSR: () => 4326,
        distances: () => .0015,
        unionResults: () => true,
        geodesic: () => false,
        f: () => 'json',
      };
      // console.debug('esri nearby params', params);

      // get buffer polygon
      const bufferUrl = geometryServerUrl.replace(/\/$/, '') + '/buffer';
      // console.log('im getting the points', bufferUrl);

      this.$http.get(bufferUrl, {params}).then(response => {
        // console.log('did get esri nearby buffer', response);
        const data = response.body;

        const xyCoords = data['geometries'][0]['rings'][0];
        const latLngCoords = xyCoords.map(xyCoord => [...xyCoord].reverse());

        // get nearby features using buffer
        const buffer = L.polygon(latLngCoords);
        this.fetchEsriSpatialQuery(dataSourceKey,
                                   dataSourceUrl,
                                   'within',
                                   buffer
        );
      }, response => {
        // console.log('did fetch esri nearby error', response);
        this.didFetchData(dataSource, 'error');
      });
    }, // end of fetchEsriNearby
  }
};

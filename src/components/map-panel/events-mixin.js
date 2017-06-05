export default {
  methods: {
    handleMapClick(e) {
      console.log('handleMapClick is running');
      // TODO figure out why form submits via enter key are generating a map
      // click event and remove this
      if (e.originalEvent.keyCode === 13) {
        return;
      }
      this.$store.commit('setLastSearchMethod', 'reverseGeocode')

      // METHOD 1: intersect map click latlng with parcel layers
      this.getDorParcelsByLatLng(e.latlng);
      this.getPwdParcelByLatLng(e.latlng);

      // METHOD 2: reverse geocode via AIS
      // this.getReverseGeocode(e.latlng);
    },
    handleMapMove(e) {
      this.updateCyclomediaRecordings();
    },
    handleCircleMarkerClick(e) {
      const featureId = e.target.options.data.featureId;
      this.$store.commit('setActiveFeature', featureId);
    },
    bringCircleMarkerToFront(circleMarker) {
      // put marker on top
      const el = circleMarker._path;

      // remove from parent
      const group = circleMarker._renderer._rootGroup;
      group.removeChild(el);

      // append to end (which brings it to the front)
      group.appendChild(el);
    },
    handleCircleMarkerMouseover(e) {
      const target = e.target;
      const featureId = target.options.data.featureId;
      this.$store.commit('setActiveFeature', featureId);

      // bring to front
      this.bringCircleMarkerToFront(target);
    },
    handleCircleMarkerMouseout(e) {
      this.$store.commit('setActiveFeature', null);
    },
  }
};

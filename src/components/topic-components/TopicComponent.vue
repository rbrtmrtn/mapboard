<script>
  export default {
    props: ['slots', 'options', 'item'],
    computed: {
      nullValue() {
        const options = this.options || {};
        return options.nullValue;
      },
    },
    methods: {
      evaluateSlot(valOrGetter, transforms = [], nullValue = '') {
        // check for null val/getter
        if (!valOrGetter) {
          return valOrGetter;
        }

        const valOrGetterType = typeof valOrGetter;
        let val;

        // fn
        if (valOrGetterType === 'function') {
          const state = this.$store.state;
          const getter = valOrGetter;

          // const getterText = String(getter);
          // const depsRe = /state(\.\w+)+/g;
          // const depsText = getterText.match(depsRe);
          // const deps = depsText.map(eval);

          const item = this.item;

          // if this comp is associated with an "item" (generally some object
          // from a list of things, e.g. dor parcels), pass the item itself
          // as well when evaluating
          if (item) {
            val = getter(state, item);
          } else {
            val = getter(state);
          }
        } else {
          val = valOrGetter;
        }

        // format nulls but not falses
        if (val === false) {

        } else if (!val) {
          return nullValue;
        }

        // apply transforms
        for (let transformKey of transforms) {
          // get transform definition from config by name
          const transform = this.$config.transforms[transformKey];
          // make object of (relevant) globals by filtering window object
          let globals;
          const globalKeys = transform.globals;
          if (globalKeys) {
            globals = Object.keys(window)
                          .filter(key => globalKeys.includes(key))
                          .reduce((obj, key) => {
                              obj[key] = window[key];
                              return obj;
                          }, {});
          }
          // run transform
          const fn = transform.transform;
          val = fn(val, globals);
        }

        return val;
      },

      // not sure how children can use this. `this` isn't binding correctly at
      // the time the child gets instantiated.
      // getComputedProperties() {
      //   const slots = this.slots;
      //   return Object.keys(slots).reduce((o, key) => {
      //     const valOrGetter = slots[key];
      //     // wrap slot val/getter in evaluator fn
      //     o[key] = () => {
      //       this.evaluateSlot(valOrGetter);
      //     }
      //     return o;
      //   }, {});
      // }
    },
  };
</script>

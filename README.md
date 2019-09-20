# Spark-Properties

Properties that can be calculated and can invalidate each other

## Installation

Install package with NPM :
```sh
npm install spark-properties
```

You can install it directly from github:
```sh
npm install kevthunder/spark-properties
```

## Getting started

A Spark-property will only trigger a change when the set value is different than before
```javascript
const Property = require('spark-properties')

const color = new Property({
    default: 'red',
    change: function(old){
      console.log('The apple color changed from '+old+' to '+this.color)
    }
}); // an initial log will show

color.set('red'); // does not show a log
apple.set('green'); // show a log
```

A Spark-property can be calculated from other properties and the calculation itself will only happens when needed.
```javascript
const numberOfApple = new Property({
  default: 1
});
const numberOfBanana = new Property({
  default: 1
});
const numberOfFruits = new Property({
  calcul: function(invalidator){
    console.log('calculing the number of fruits...');
    return invalidator.prop(numberOfApple) + invalidator.prop(numberOfBanana);
  }
});

console.log('no. Fruits:', numberOfFruits.get()); // will return 2 and show a "calculing" log in the console
console.log('no. Fruits:', numberOfFruits.get()); // will return 2 but will not show a "calculing" log because the value was already calculated
numberOfApple.set(2); // will not trigger a re-calcul
numberOfBanana.set(3); // will not trigger a re-calcul
console.log('no. Fruits:', numberOfFruits.get()); // will return 5 and show a "calculing" log
console.log('no. Fruits:', numberOfFruits.get()); // will return 5 with no "calculing" log

```
<base href="./Y2023/">

## Y2023 Puzzle

**Y2023**. How many integers from 1 to 100 can you form using the
digits 2, 0, 2, and 3 exactly once each, along with the operators
+, −, × (multiplication), ÷ (division), and exponentiation? We desire solutions containing
the minimum number of operators; among solutions having a
given number of operators, those using the digits in the order
2, 0, 2, 3 are preferred. Parentheses may be used; they do not
count as operators. A leading minus sign, however, does count
as an operator.

Puzzle proposed by Allan Gottlieb, MIT Technology Review.

Source: [MIT News January/February 2023](https://www.technologyreview.com/)

***

Let's write a solver for this puzzle!

[solver](./solver.html)

## Solver Logic

The approximate logic to solve the puzzle is:
1. Take the year `2023`
2. Form all possible digit groups: `[2, 0, 2, 3], [20, 2, 3], ...`
3. Then for each digit group:
    a. Form all possible math expressions (AST representation): `(20+2)+3, (20+2)-3, ...`
    b. Keep only the best solutions

Step 2 and step 3a both benefit from a recursive, DFS-style search, so it seems useful to write a generic recursion function.

## Generic Recursion

The generic recursion (abbreviated) looks like this:
```
function recurse(arr, joinFn, storeFn) {
  if (arr.length == 1) {
    return storeFn(arr);
  }
  for (let i=0; i<arr.length-1; i++) {
    for (let j=i+1; j<arr.length; j++) {
      const results = [
        ...joinFn(arr[j], arr[i]),
        ...joinFn(arr[i], arr[j])
      ];
      for (const res of results) {
        toStore = [res];
        for (let k=0; k<arr.length; k++) {
          if (k != i && k != j) {
            toStore.push(arr[k]);
          }
        }
        
        recurse(toStore, joinFn, storeFn);
      }
    }
  }
}
```

Then, custom `joinFn, storeFn` are supplied for the Step 2 "digitize" process, and the Step 3a "treefy" process.

## Javascript Workers

The whole page would freeze up when calculating solutions - using JS workers seemed to fix this!
```
worker = new Worker('./solve.js');

// Initiate solver worker
worker.postMessage({
  command: 'solve',
  year,
});

// Receive messages from worker, such as when solving is completed
worker.addEventListener('message', (message) => {
  if (message.data.command === 'end') {
    display(message.data.data);
  }
  if (message.data.command === 'setLoad') {
    setLoad(message.data.progress);
  }
  if (message.data.command === 'alert') {
    setAlert(message.data.text);
  }
});
```

Acknowledgements:
1. [Nice loading icon](https://loading.io/css/)
2. [Khan Academy - Javascript Latex renderer](https://katex.org/) - It's fast! And not buggy! (looking at you, mathjax...)

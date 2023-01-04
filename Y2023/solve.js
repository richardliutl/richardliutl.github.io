
global_year = "2023";
global_computation_limit = 150000;
// Listen for messages from the main thread.
addEventListener("message", (message) => {
  if (message.data.command === 'solve') {
    solve(message.data.year);
  }
});
function solve(value) {
  const digits = value.split("");
  main(digits);
}
function loaded(progress) {
  postMessage({
    command: 'setLoad',
    progress
  });
}
function makeAlert(text) {
  postMessage({
    command: 'alert',
    text
  });
}

class Node {
  constructor(value, ops, left, right) {
    this.value = value;
    this.ops = ops;
    this.left = left;
    this.right = right;
  }
  // Getter
  get area() {
    return this.calcArea();
  }
  get readiness() {
    return `${this.left && this.left.readiness || ""}` + 
           `${!"+-*/**".includes(this.value) && this.value || ""}` +
           `${this.right && this.right.readiness || ""}`;
  }
  get yearReadiness() {
    return this.readiness == global_year;
  }
  get score() {
    let x = "+-*/**".indexOf(this.value);
    if (x == -1) {
      x = parseInt(this.value)/10000;
    }
    return x + (this.left && this.left.score || 0) + (this.right && this.right.score || 0);
  }
  // Method
  toString() {
    if (this.right) {
      return `(${this.left.toString()}${this.value}${this.right.toString()})`
    }
    if (this.left) {
      return `(${this.value}${this.left.toString()})`;
    }
    return this.value;
  }
  toLatex(ignoreParen = false) {
    if (this.right) {
      if (this.value == "**") {
        return `{${this.left.toLatex()}}^{${this.right.toLatex()}}`
      }
      if (this.value == "/") {
        return `\\frac{${this.left.toLatex()}}{${this.right.toLatex()}}`
      }
      let value = "";
      if (this.value == "*") {
        value = `${this.left.toLatex()} \\cdot ${this.right.toLatex()}`
      } else {
        value = `${this.left.toLatex()}${this.value}${this.right.toLatex()}`
      }
      if (ignoreParen) {
        return value;
      }
      return `(${value})`;
    }
    if (this.left) {
      const value = `${this.value}${this.left.toLatex()}`;
      if (ignoreParen) {
        return value;
      }
      return `(${value})`;
    }
    return this.value;
  }
  toText(ignoreParen = false) {
    if (this.right) {
      let value = "";
      if (this.value == "**") {
        value = `${this.left.toText()}^${this.right.toText()}`
      } else {
        value = `${this.left.toText()}${this.value}${this.right.toText()}`
      }
      if (ignoreParen) {
        return value;
      }
      return `(${value})`;
    }
    if (this.left) {
      const value = `${this.value}${this.left.toText()}`;
      if (ignoreParen) {
        return value;
      }
      return `(${value})`;
    }
    return this.value;
  }
  betterThan(that) {
    if (this.ops == that.ops) {
      if (this.yearReadiness == that.yearReadiness) {
        return this.score > that.score;
      }
      return this.yearReadiness > that.yearReadiness;
    }
    return this.ops < that.ops;
  }
}
function main(digits) {
  loaded(0.05);
  const nums = digitize(digits);
  loaded(0.1);
  const data = treefy(nums).map(node => {return {
    text: node.toText(true),
    latex: node.toLatex(true),
    score: node.score
  }});
  
  postMessage({
    command: 'end',
    data,
  });
}
function computationBound(numDigits) {
  if (numDigits == 1) return 5;
  return 5 * numDigits * computationBound(numDigits - 1);
}
function computationEstimate(nums, numsIx, computationIx = 0) {
  const INITIAL_PART = 0.1;
  let total = 0;
  let partial = 0;
  for (let i=0; i<nums.length; i++) {
    total += computationBound(nums[i].length);
    if (i < numsIx) {
      partial += computationBound(nums[i].length);
    }
  }
  partial += computationIx;
  loaded(INITIAL_PART + (1-INITIAL_PART)*partial/total);
}
function treefy(nums) {
  let c = 0; // total ticks
  let numsIx = 0;
  let data = [];
  for (let digits of nums) {
    digits = digits.map(d => new Node(d, 0));
    let computation = 0; // estimated per loop
    recurse(
      digits,
      (s1, s2) => {        
        const nodes = [];
        
        c++;
        computation++;
        if (computation > global_computation_limit) {
          makeAlert(`Computation limit exceeded, continuing anyways...`);
          return nodes;
        }
        if (c % 100 == 0) {
          computationEstimate(nums, numsIx, computation);
        }
        
        for (const op of ["+", "-", "*", "/", "**"]) {
          const node = new Node(
            op,
            1 + s1.ops + s2.ops,
            s1,
            s2,
          );
          const negNode = new Node(
            "-",
            1 + node.ops,
            node
          );
          nodes.push(node, negNode);
        }
        return nodes;
      },
      (nodes) => {
        const node = nodes[0];
        const expr = node.toString();
        // console.log(node.toText());
        const x = eval(expr);
        if (x >= 1 && x <= 100 && Number.isInteger(x)) {
          if (data[x] && data[x].betterThan(node)) {
            return;
          }
          data[x] = node;
        }
      },
      false
    );
    
    computationEstimate(nums, numsIx);
    numsIx++;
  }
  return data;
}
function digitize(digits) {
  let c = 0;
  let nums = [digits]; // CAN'T forget this ... bad designs
  let unique = new Set();
  recurse(
    digits,
    (s1, s2) => {
      // c++;
      ok = (s1[0] != "0");
      // ok = c < 100;
      if (!ok) {
        return [];
      }
      return [s1 + s2];
    },
    (arr) => {
//      console.log(arr);
      if (unique.has(arr.join())) return;
      unique.add(arr.join());
      nums.push(arr);
    },
    true
  );
  // console.log(nums);
  return nums;
}
function recurse(arr, joinFn, storeFn, canSkip = true, skipped = undefined) {
  if (arr.length == 1) {
    if (skipped) {
      return storeFn([...arr, ...skipped]);
    }
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
        
        recurse(toStore, joinFn, storeFn, canSkip, skipped);
      }
    }
  }
  if (canSkip) { // just for digitize
    return storeFn(arr);
    if (!skipped) {
      skipped = [];
    }
    skipped = [...skipped, arr[0]];
    recurse(
      arr.slice(1),
      joinFn,
      storeFn,
      canSkip,
      skipped
    );
  }
}

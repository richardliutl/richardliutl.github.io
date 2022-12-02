<base href="./sudoku/">

## Sudoku

![puzzle](./puzzle.png)

## Rules

* Sudoku rules apply (insert the numbers \`1-9\` so they appear exactly once in each row, column, and bolded \`3x3\` square).
* Digits connected by a \`V\` should add to \`5\`.
* Digits connected by an \`X\` should add to \`10\`.
* Two instances of the same digit cannot be a chess knight's move away from each other.

Puzzle proposed by Rebecca Chang.

Source: [UMA November 2022](http://uma.mit.edu/puzzle)

***

Let's write a sudoku assistant for this puzzle!

[sudoku assistant](./solver.html)
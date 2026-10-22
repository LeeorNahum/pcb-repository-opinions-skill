# Evidence

Never present an estimate as a datasheet value. Record the basis, the assumptions, and the consequence if the estimate is wrong.

## Order Of Evidence

Use this order when facts conflict:

1. The owner's current explicit decision
2. Decisions the owner has fixed in writing in the repository
3. The exact selected part's datasheet and official application guidance
4. The live KiCad project and library data
5. Manufacturer and distributor data for package, lifecycle, stock, and assembly availability
6. Reference designs and proven source projects
7. A clearly labeled engineering estimate

When a written instruction disagrees with a datasheet, build to neither silently. Say which pin or value is in question and let the owner decide.

## Datasheet Audit

Check every part pin by pin against the manufacturer's datasheet, for the exact package ordered. Passing ERC and DRC is not that check. Read the pages that control the implementation: absolute maximum and recommended conditions, pin definitions with the exposed pad and unused pins, startup and default states, decoupling and stability requirements, interface levels and addresses, the package drawing and land pattern, the reference layout, and programming and test access.

Then work out what the circuit does in each state it can be in: the controller unpowered, one supply present without another, each power-up order, and every combination of control inputs the controller can produce. Write down what each output does in each.

Record what was verified, what remains open, and the consequence of getting it wrong in the README.

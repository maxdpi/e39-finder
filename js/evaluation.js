function evaluateEligibility(listing) {
    const checks = [
      {
        value: listing.isE39Touring,
        disqualifyingValue: "no",
        failure: "Not an E39 Touring",
        unknown: "E39 Touring body style unconfirmed",
      },
      {
        value: listing.isPetrol,
        disqualifyingValue: "no",
        failure: "Not petrol",
        unknown: "Fuel type unconfirmed",
      },
      {
        value: listing.isManual,
        disqualifyingValue: "no",
        failure: "Not a manual",
        unknown: "Transmission unconfirmed",
      },
      {
        value: listing.severeCorrosion,
        disqualifyingValue: "yes",
        failure: "Confirmed severe structural corrosion",
        unknown: "Structural condition unconfirmed",
      },
      {
        value: listing.majorMechanicalDefect,
        disqualifyingValue: "yes",
        failure: "Confirmed major mechanical defect",
        unknown: "Major mechanical defects not ruled out",
      },
    ];
  
    const failures = [];
    const unknowns = [];
  
    for (const check of checks) {
      if (check.value === check.disqualifyingValue) {
        failures.push(check.failure);
      } else if (check.value !== "yes" && check.value !== "no") {
        unknowns.push(check.unknown);
      }
    }
  
    let verdict = "ELIGIBLE — not yet scored";
  
    if (failures.length > 0) {
      verdict = "PASS — disqualified";
    } else if (unknowns.length > 0) {
      verdict = "INVESTIGATE — mandatory checks incomplete";
    }
  
    return { verdict, failures, unknowns };
  }
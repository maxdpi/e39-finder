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

  function evaluateListing(listing) {
    const eligibility = evaluateEligibility(listing);
    const unknowns = [...eligibility.unknowns];
    let score = 0;
  
    const categories = [
      {
        label: "Price assessment",
        value: listing.priceAssessment,
        points: { good: 25, fair: 15, poor: 0 },
      },
      {
        label: "Structural condition",
        value: listing.structuralCondition,
        points: { sound: 25, "surface-rust": 18, "repair-needed": 5 },
      },
      {
        label: "Maintenance history",
        value: listing.maintenanceHistory,
        points: { documented: 20, claimed: 8, limited: 0 },
      },
      {
        label: "Mechanical condition",
        value: listing.mechanicalCondition,
        points: { healthy: 15, "minor-issues": 8, "repair-needed": 0 },
      },
      {
        label: "Modifications",
        value: listing.modifications,
        points: { original: 5, minimal: 3, extensive: 0 },
      },
    ];
  
    for (const category of categories) {
      const points = category.points[category.value];
  
      if (typeof points === "number") {
        score += points;
      } else {
        unknowns.push(`${category.label} unknown`);
      }
    }
  
    if (Number.isFinite(listing.mileage) && listing.mileage >= 0) {
      if (listing.mileage <= 270000) {
        score += 5;
      } else if (listing.mileage <= 320000) {
        score += 3;
      } else {
        score += 1;
      }
    } else {
      unknowns.push("Mileage unknown");
    }
  
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(listing.huUntil ?? "")) {
      const [year, month] = listing.huUntil.split("-").map(Number);
      const today = new Date();
  
      const monthsRemaining =
        (year - today.getFullYear()) * 12 +
        month -
        (today.getMonth() + 1);
  
      if (monthsRemaining >= 12) {
        score += 5;
      } else if (monthsRemaining >= 6) {
        score += 3;
      } else if (monthsRemaining >= 0) {
        score += 1;
      }
    } else {
      unknowns.push("HU expiry unknown");
    }
  
    if (listing.structuralCondition === "repair-needed") {
      unknowns.push("Structural repair severity needs verification");
    }
  
    if (listing.mechanicalCondition === "repair-needed") {
      unknowns.push("Mechanical repair severity needs verification");
    }
  
    let verdict;
  
    if (eligibility.failures.length > 0) {
      verdict = "PASS — disqualified";
    } else if (unknowns.length > 0) {
      verdict = "INVESTIGATE — information needs verification";
    } else if (score >= 70) {
      verdict = "CANDIDATE";
    } else if (score >= 55) {
      verdict = "INVESTIGATE";
    } else {
      verdict = "PASS";
    }
  
    return {
      score,
      verdict,
      failures: eligibility.failures,
      unknowns,
    };
  }
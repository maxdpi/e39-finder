function detectDescriptionTopics(description) {
    const rules = [
      {
        label: "Cooling system mentioned — check work and dates",
        pattern: /\b(kühler|kuehler|wasserpumpe|thermostat|kühlsystem|kuehlsystem)\b/i,
      },
      {
        label: "Clutch mentioned — check condition and replacement history",
        pattern: /\bkupplung\b/i,
      },
      {
        label: "Gearbox mentioned — check operation and defects",
        pattern: /\b(getriebe|schaltgetriebe)\b/i,
      },
      {
        label: "Corrosion mentioned — verify location and severity",
        pattern: /\b(rost|durchrostung|rostfrei|schweller|wagenheberaufnahmen)\b/i,
      },
      {
        label: "Rear suspension mentioned — check function and repairs",
        pattern: /\b(luftfederung|niveauregulierung|luftbalg|luftbälge)\b/i,
      },
      {
        label: "Maintenance evidence mentioned — inspect the records",
        pattern: /\b(rechnung|rechnungen|scheckheft|wartungsnachweise)\b/i,
      },
    ];
  
    const lines = description
    .split(/\r?\n/)
    .map(function (line) {
      return line.trim();
    })
    .filter(function (line) {
      return line !== "";
    });

  return rules
    .filter(function (rule) {
      return rule.pattern.test(description);
    })
    .map(function (rule) {
      const evidence = lines.filter(function (line) {
        return rule.pattern.test(line);
      });

      return {
        label: rule.label,
        evidence,
      };
    });
}

function extractHuSuggestion(description) {
    const pattern =
      /\b(?:HU|TÜV|TUEV)\s*(?:ist\s*)?(?:(?:bis|fällig|faellig)\s*:?\s*)?(0?[1-9]|1[0-2])\s*[/.]\s*(20\d{2}|\d{2})\b/gi;
  
    const matches = [...description.matchAll(pattern)];
  
    if (matches.length === 0) {
      return null;
    }
  
    const suggestions = matches.map(function (match) {
      const month = match[1].padStart(2, "0");
      const year = match[2].length === 2
        ? `20${match[2]}`
        : match[2];
  
      return {
        value: `${year}-${month}`,
        evidence: match[0],
      };
    });
  
    const dates = new Set(
      suggestions.map(function (suggestion) {
        return suggestion.value;
      })
    );
  
    return {
      suggestions,
      needsReview: true,
      conflicting: dates.size > 1,
    };
  }
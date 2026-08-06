"use client";

import { useState } from "react";
import {
  CONTINENTS,
  continentForCountry,
  countriesForContinent,
  regionsForCountry,
} from "@/lib/locations";
import { Input, Label, Select } from "@/components/ui";

export type LocationValue = {
  continent: string;
  country: string;
  region: string;
  city: string;
};

export function LocationFields({
  value,
  onChange,
  showContinent = true,
  cityLabel = "City / town",
  regionOptional = true,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  showContinent?: boolean;
  cityLabel?: string;
  regionOptional?: boolean;
}) {
  const [customRegion, setCustomRegion] = useState(
    value.region && !regionsForCountry(value.country).includes(value.region)
      ? value.region
      : ""
  );

  const countries = countriesForContinent(value.continent || null).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const regions = regionsForCountry(value.country);
  const hasRegionList = regions.length > 0;
  const regionSelectValue =
    hasRegionList && value.region
      ? regions.includes(value.region)
        ? value.region
        : "Other"
      : value.region || "";

  function setContinent(continent: string) {
    const nextCountries = countriesForContinent(continent || null);
    const keepCountry = nextCountries.some((c) => c.name === value.country);
    onChange({
      continent,
      country: keepCountry ? value.country : "",
      region: keepCountry ? value.region : "",
      city: value.city,
    });
    if (!keepCountry) setCustomRegion("");
  }

  function setCountry(country: string) {
    const cont = continentForCountry(country) || value.continent;
    const regs = regionsForCountry(country);
    const keepRegion = regs.includes(value.region);
    onChange({
      continent: cont || "",
      country,
      region: keepRegion ? value.region : "",
      city: value.city,
    });
    if (!keepRegion) setCustomRegion("");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showContinent && (
        <div>
          <Label>Continent</Label>
          <Select
            value={value.continent}
            onChange={(e) => setContinent(e.target.value)}
          >
            <option value="">Select continent…</option>
            {CONTINENTS.filter((c) => c.code !== "AN").map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label>Country</Label>
        <Select value={value.country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">Select country…</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-[11px] text-stone-400">
          {value.continent
            ? "Showing countries in this continent."
            : "Tip: pick a continent first to narrow the list — all countries are available."}
        </p>
      </div>
      <div>
        <Label>
          Province / state / region
          {regionOptional ? " (optional)" : ""}
        </Label>
        {hasRegionList ? (
          <>
            <Select
              value={regionSelectValue === "Other" ? "Other" : regionSelectValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "Other") {
                  onChange({ ...value, region: customRegion || "" });
                  setCustomRegion(customRegion || "");
                } else {
                  setCustomRegion("");
                  onChange({ ...value, region: v });
                }
              }}
            >
              <option value="">Select…</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other / not listed</option>
            </Select>
            {(regionSelectValue === "Other" ||
              (value.region && !regions.includes(value.region))) && (
              <Input
                className="mt-2"
                value={customRegion || (regions.includes(value.region) ? "" : value.region)}
                onChange={(e) => {
                  setCustomRegion(e.target.value);
                  onChange({ ...value, region: e.target.value });
                }}
                placeholder="Type your province / state"
              />
            )}
          </>
        ) : (
          <Input
            value={value.region}
            onChange={(e) => onChange({ ...value, region: e.target.value })}
            placeholder="e.g. province, state, canton"
            disabled={!value.country}
          />
        )}
      </div>
      <div>
        <Label>{cityLabel}</Label>
        <Input
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          placeholder="e.g. Cape Town, Berlin, São Paulo"
        />
      </div>
    </div>
  );
}

/** Cascading location filters for browse search forms. */
export function LocationFilterFields({
  continent: initialContinent = "",
  country: initialCountry = "",
  region: initialRegion = "",
  city: initialCity = "",
}: {
  continent?: string;
  country?: string;
  region?: string;
  city?: string;
}) {
  const [continent, setContinent] = useState(initialContinent);
  const [country, setCountry] = useState(initialCountry);
  const [region, setRegion] = useState(initialRegion);
  const countries = countriesForContinent(continent || null).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const regions = regionsForCountry(country);

  return (
    <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Continent
        </label>
        <select
          name="continent"
          value={continent}
          onChange={(e) => {
            setContinent(e.target.value);
            setCountry("");
            setRegion("");
          }}
          className="input-field"
        >
          <option value="">All continents</option>
          {CONTINENTS.filter((c) => c.code !== "AN").map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Country
        </label>
        <select
          name="country"
          value={country}
          onChange={(e) => {
            const v = e.target.value;
            setCountry(v);
            setRegion("");
            const cont = continentForCountry(v);
            if (cont) setContinent(cont);
          }}
          className="input-field"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Province / state
        </label>
        {regions.length > 0 ? (
          <select
            name="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="input-field"
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="region"
            className="input-field"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Any region"
          />
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          City
        </label>
        <input
          name="city"
          className="input-field"
          defaultValue={initialCity}
          placeholder="Any city"
        />
      </div>
    </div>
  );
}

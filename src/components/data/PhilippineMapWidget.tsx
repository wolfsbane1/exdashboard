import React, { useMemo } from 'react';
import { MapPinned } from 'lucide-react';
import philippineRegions from '../../data/philippinesRegions.geo.json';
import { useFilters } from '../../contexts/FilterContext';
import { useSettings } from '../../contexts/SettingsContext';
import MaximizeControl from '../utility/MaximizeControl';

type Coordinate = [number, number];
type PolygonCoordinates = Coordinate[][];
type MultiPolygonCoordinates = PolygonCoordinates[];

interface RegionFeature {
  type: 'Feature';
  id?: string | number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
  };
  properties: {
    adm1_psgc: string;
    adm2_psgc: string;
    adm2_en: string;
  };
}

interface RegionFeatureCollection {
  type: 'FeatureCollection';
  features: RegionFeature[];
}

const MAP_WIDTH = 420;
const MAP_HEIGHT = 780;
const MAP_PADDING = 12;

const REGION_META_BY_PSGC: Record<string, { code: string; label: string }> = {
  '100000000': { code: 'REGION_I', label: 'Region I - Ilocos' },
  '200000000': { code: 'REGION_II', label: 'Region II - Cagayan Valley' },
  '300000000': { code: 'REGION_III', label: 'Region III - Central Luzon' },
  '400000000': { code: 'CALABARZON', label: 'CALABARZON' },
  '1700000000': { code: 'MIMAROPA', label: 'MIMAROPA' },
  '500000000': { code: 'REGION_V', label: 'Region V - Bicol' },
  '600000000': { code: 'REGION_VI', label: 'Region VI - Western Visayas' },
  '700000000': { code: 'REGION_VII', label: 'Region VII - Central Visayas' },
  '800000000': { code: 'REGION_VIII', label: 'Region VIII - Eastern Visayas' },
  '900000000': { code: 'REGION_IX', label: 'Region IX - Zamboanga Peninsula' },
  '1000000000': { code: 'REGION_X', label: 'Region X - Northern Mindanao' },
  '1100000000': { code: 'REGION_XI', label: 'Region XI - Davao' },
  '1200000000': { code: 'REGION_XII', label: 'Region XII - SOCCSKSARGEN' },
  '1300000000': { code: 'NCR', label: 'NCR' },
  '1400000000': { code: 'CAR', label: 'CAR' },
  '1600000000': { code: 'CARAGA', label: 'Caraga' },
  '1900000000': { code: 'BARMM', label: 'BARMM' },
};

const REGION_PSGC_BY_CODE = Object.fromEntries(
  Object.entries(REGION_META_BY_PSGC).map(([psgc, meta]) => [meta.code, psgc])
);

const ALL_REGION_CODES = Object.values(REGION_META_BY_PSGC).map((region) => region.code);

const GEOJSON = philippineRegions as RegionFeatureCollection;

function collectCoordinates(input: unknown, output: Coordinate[] = []): Coordinate[] {
  if (!Array.isArray(input)) return output;
  if (typeof input[0] === 'number' && typeof input[1] === 'number') {
    output.push([input[0], input[1]]);
    return output;
  }
  input.forEach((item) => collectCoordinates(item, output));
  return output;
}

function computeBounds(features: RegionFeature[]) {
  const coordinates = features.flatMap((feature) => collectCoordinates(feature.geometry.coordinates));
  return coordinates.reduce(
    (bounds, [longitude, latitude]) => ({
      minLon: Math.min(bounds.minLon, longitude),
      maxLon: Math.max(bounds.maxLon, longitude),
      minLat: Math.min(bounds.minLat, latitude),
      maxLat: Math.max(bounds.maxLat, latitude),
    }),
    {
      minLon: Number.POSITIVE_INFINITY,
      maxLon: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
    }
  );
}

const bounds = computeBounds(GEOJSON.features);

function project([longitude, latitude]: Coordinate): [number, number] {
  const usableWidth = MAP_WIDTH - MAP_PADDING * 2;
  const usableHeight = MAP_HEIGHT - MAP_PADDING * 2;
  const x = MAP_PADDING + ((longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * usableWidth;
  const y = MAP_HEIGHT - MAP_PADDING - ((latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * usableHeight;
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

function ringToPath(ring: Coordinate[]) {
  if (ring.length === 0) return '';
  const [first, ...rest] = ring;
  const [startX, startY] = project(first);
  const lines = rest.map((coordinate) => {
    const [x, y] = project(coordinate);
    return `L ${x} ${y}`;
  });
  return `M ${startX} ${startY} ${lines.join(' ')} Z`;
}

function polygonToPath(polygon: PolygonCoordinates) {
  return polygon.map((ring) => ringToPath(ring)).join(' ');
}

function geometryToPath(geometry: RegionFeature['geometry']) {
  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates as PolygonCoordinates);
  }
  return (geometry.coordinates as MultiPolygonCoordinates).map((polygon) => polygonToPath(polygon)).join(' ');
}

const REGION_PATHS = GEOJSON.features.map((feature) => {
  const psgc = feature.properties.adm1_psgc;
  const meta = REGION_META_BY_PSGC[psgc];
  return {
    id: feature.id ?? feature.properties.adm2_psgc,
    psgc,
    code: meta?.code ?? psgc,
    label: meta?.label ?? feature.properties.adm2_en,
    subdivision: feature.properties.adm2_en,
    path: geometryToPath(feature.geometry),
  };
});

function selectedRegionCodes(selectedOffices: string[]): Set<string> {
  if (selectedOffices.length === 0) {
    return new Set(ALL_REGION_CODES);
  }

  const selected = new Set(selectedOffices);
  if (selected.has('CENTRAL_OFFICE')) selected.add('NCR');
  return selected;
}

function selectedRegionPsgcs(selectedOffices: string[]): Set<string> {
  const codes = selectedRegionCodes(selectedOffices);
  return new Set(
    Array.from(codes)
      .map((code) => REGION_PSGC_BY_CODE[code])
      .filter(Boolean)
  );
}

export const PhilippineMapWidget: React.FC = () => {
  const { filters } = useFilters();
  const { filterOptions } = useSettings();
  const activeRegionPsgcs = useMemo(() => selectedRegionPsgcs(filters.office), [filters.office]);
  const allSelected = filters.office.length === 0;

  const selectedLabels = useMemo(() => {
    if (allSelected) return ['All offices and regions'];
    return filters.office.map(
      (value) => filterOptions.office.find((option) => option.value === value)?.label || value
    );
  }, [allSelected, filterOptions.office, filters.office]);

  const renderMap = (className = 'mx-auto h-[700px] w-full max-w-[430px]') => (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="Actual Philippine regional map"
      className={className}
    >
      <defs>
        <filter id="philippineMapShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#7f1d1d" floodOpacity="0.16" />
        </filter>
      </defs>
      <g filter="url(#philippineMapShadow)">
        {REGION_PATHS.map((region) => {
          const active = activeRegionPsgcs.has(region.psgc);
          return (
            <path
              key={region.id}
              d={region.path}
              fill={active ? '#dc2626' : '#fee2e2'}
              fillRule="evenodd"
              stroke={active ? '#991b1b' : '#ffffff'}
              strokeLinejoin="round"
              strokeWidth={active ? 1.7 : 1}
              vectorEffect="non-scaling-stroke"
              className="transition-colors duration-300"
            >
              <title>{`${region.label}: ${region.subdivision}`}</title>
            </path>
          );
        })}
      </g>
    </svg>
  );

  const selectionSummary = (
    <div className="rounded-lg bg-red-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Highlighted</p>
      <p className="mt-1 text-sm font-medium text-gray-800">
        {selectedLabels.length > 2 ? `${selectedLabels.length} selections` : selectedLabels.join(', ')}
      </p>
      {!allSelected && selectedLabels.length > 2 && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{selectedLabels.join(', ')}</p>
      )}
    </div>
  );

  return (
    <aside className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-red-50 p-2 text-red-600">
            <MapPinned size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Philippine Map</h2>
            <p className="text-xs text-gray-500">Office/Region selection</p>
          </div>
        </div>
        <MaximizeControl title="Philippine Map" contentClassName="min-h-[72vh]">
          <div className="grid min-h-[72vh] gap-5 lg:grid-cols-[minmax(340px,560px),1fr]">
            <div className="rounded-lg bg-gradient-to-b from-red-50 to-white p-3">
              {renderMap('mx-auto h-[72vh] w-full max-w-[560px]')}
            </div>
            <div className="flex flex-col justify-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Philippine Map</h3>
                <p className="mt-1 text-sm text-gray-500">Office/Region selection</p>
              </div>
              {selectionSummary}
            </div>
          </div>
        </MaximizeControl>
      </div>

      <div className="rounded-lg bg-gradient-to-b from-red-50 to-white p-3">
        {renderMap()}
      </div>

      <div className="mt-4">{selectionSummary}</div>
    </aside>
  );
};

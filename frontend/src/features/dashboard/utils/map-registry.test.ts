import { describe, expect, it, jest } from '@jest/globals'
import * as echarts from 'echarts'
import {
  buildFeatureCollectionFromRegions,
  type EChartsMapFeatureCollection,
  INDIA_NATIONAL_BOUNDARY_FEATURE_NAME,
  PARENT_BOUNDARY_FEATURE_NAME,
  PARENT_BOUNDARY_FILL_FEATURE_NAME,
  registerDynamicMap,
} from './map-registry'

jest.mock('echarts', () => ({
  registerMap: jest.fn(),
}))

describe('map-registry', () => {
  it('registers map into echarts', () => {
    const geoJson: EChartsMapFeatureCollection = { type: 'FeatureCollection', features: [] }
    registerDynamicMap('test-map', geoJson)
    expect(echarts.registerMap).toHaveBeenCalledWith('test-map', expect.any(Object))
  })

  it('returns null when no valid boundaries exist', () => {
    const result = buildFeatureCollectionFromRegions([
      { id: '1', name: 'No Boundary' },
      { id: '2', name: 'Invalid Boundary', boundaryGeoJson: 'invalid' },
    ])
    expect(result).toBeNull()
  })

  it('builds region features and computes cp from polygon center', () => {
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0],
        ],
      ],
    }
    const result = buildFeatureCollectionFromRegions([
      { id: 'r1', name: 'Region One', boundaryGeoJson: polygon },
    ])

    expect(result?.features).toHaveLength(1)
    expect(result?.features[0]?.properties.name).toBe('Region One')
    expect(result?.features[0]?.properties.cp).toEqual([2, 2])
  })

  it('handles degenerate polygon by omitting cp', () => {
    const degeneratePolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          ['bad', 1],
          [2, 2],
        ],
      ],
    }
    const result = buildFeatureCollectionFromRegions([
      { id: 'r2', name: 'Degenerate', boundaryGeoJson: degeneratePolygon },
    ])
    expect(result?.features[0]?.properties.cp).toBeUndefined()
  })

  it('uses largest multipolygon piece for cp and includes optional boundaries', () => {
    const multipolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
        [
          [
            [10, 10],
            [20, 10],
            [20, 20],
            [10, 20],
            [10, 10],
          ],
        ],
      ],
    }
    const result = buildFeatureCollectionFromRegions(
      [{ id: 'r3', name: 'Multi Region', boundaryGeoJson: multipolygon }],
      {
        nationalBoundaryGeoJson: { type: 'Polygon', coordinates: [] },
        parentBoundaryGeoJson: { type: 'Polygon', coordinates: [] },
      }
    )

    expect(result?.features[0]?.id).toBe(INDIA_NATIONAL_BOUNDARY_FEATURE_NAME)
    expect(result?.features[1]?.id).toBe(PARENT_BOUNDARY_FILL_FEATURE_NAME)
    expect(result?.features[2]?.id).toBe(PARENT_BOUNDARY_FEATURE_NAME)
    expect(result?.features[3]?.properties.cp).toEqual([15, 15])
  })

  it('resolves geometry collection by first geometry with a center', () => {
    const geometryCollection = {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [1, 1] },
        {
          type: 'Polygon',
          coordinates: [
            [
              [2, 2],
              [6, 2],
              [6, 6],
              [2, 6],
              [2, 2],
            ],
          ],
        },
      ],
    }
    const result = buildFeatureCollectionFromRegions([
      { id: 'r4', name: 'Geometry Collection', boundaryGeoJson: geometryCollection },
    ])
    expect(result?.features[0]?.properties.cp).toEqual([4, 4])
  })
})

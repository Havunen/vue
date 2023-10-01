import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from '@cspotcode/source-map'
import { isFunction } from 'shared/util'
import { renderSync } from "sass";

function merge(oldMap, newMap) {
  if (!oldMap) return newMap
  if (!newMap) return oldMap

  var oldMapConsumer = new SourceMapConsumer(oldMap)
  var newMapConsumer = new SourceMapConsumer(newMap)
  var mergedMapGenerator = new SourceMapGenerator()

  // iterate on new map and overwrite original position of new map with one of old map
  newMapConsumer.eachMapping(function(m) {
    // pass when `originalLine` is null.
    // It occurs in case that the node does not have origin in original code.
    if (m.originalLine == null) return

    var origPosInOldMap = oldMapConsumer.originalPositionFor({
      line: m.originalLine,
      column: m.originalColumn
    })

    if (origPosInOldMap.source == null) return

    mergedMapGenerator.addMapping({
      original: {
        line: origPosInOldMap.line as number,
        column: origPosInOldMap.column as number
      },
      generated: {
        line: m.generatedLine,
        column: m.generatedColumn
      },
      source: origPosInOldMap.source,
      name: origPosInOldMap.name as string
    })
  })

  var consumers = [oldMapConsumer, newMapConsumer]
  consumers.forEach(function(consumer) {
    consumer.sources.forEach(function(sourceFile) {
      // mergedMapGenerator._sources.add(sourceFile)
      var sourceContent = consumer.sourceContentFor(sourceFile)
      if (sourceContent != null) {
        mergedMapGenerator.setSourceContent(sourceFile, sourceContent)
      }
    })
  })

  // mergedMapGenerator._sourceRoot = oldMap.sourceRoot
  // mergedMapGenerator._file = oldMap.file

  return JSON.parse(mergedMapGenerator.toString())
}


export type StylePreprocessor = (
  source: string,
  map: RawSourceMap | undefined,
  options: {
    [key: string]: any
    additionalData?: string | ((source: string, filename: string) => string)
    filename: string
  }
) => StylePreprocessorResults

export interface StylePreprocessorResults {
  code: string
  map?: object
  errors: Error[]
  dependencies: string[]
}

// .scss/.sass processor
const scss: StylePreprocessor = (source, map, options) => {
  const finalOptions = {
    ...options,
    data: getSource(source, options.filename, options.additionalData),
    file: options.filename,
    outFile: options.filename,
    sourceMap: !!map
  }

  try {
    const result = renderSync(finalOptions)
    const dependencies = result.stats.includedFiles
    if (map) {
      return {
        code: result.css.toString(),
        map: merge(map, JSON.parse(result.map!.toString())),
        errors: [],
        dependencies
      }
    }

    return { code: result.css.toString(), errors: [], dependencies }
  } catch (e: any) {
    return { code: '', errors: [e], dependencies: [] }
  }
}

const sass: StylePreprocessor = (source, map, options) =>
  scss(source, map, {
    ...options,
    indentedSyntax: true
  })

function getSource(
  source: string,
  filename: string,
  additionalData?: string | ((source: string, filename: string) => string)
) {
  if (!additionalData) return source
  if (isFunction(additionalData)) {
    return additionalData(source, filename)
  }
  return additionalData + source
}

export type PreprocessLang = 'sass' | 'scss'

export const processors: Record<PreprocessLang, StylePreprocessor> = {
  sass,
  scss,
}

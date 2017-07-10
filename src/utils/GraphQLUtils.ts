// Angular imports
//import { isArray, isBlank, isDate, isNumber, isStringMap, isPresent, isString } from '@angular/core'

export class GraphQLUtils {
    static createMutation(data: Object, dataDefinition: Object, method: string, mutationName?: string): string {
        if (!method || !data) { return null }

        let mutation: string = (mutationName || method) + '{' + method

        mutation += '(' + GraphQLUtils.flattenObject(data) + ')'

        mutation += GraphQLUtils.processDataDefinition(dataDefinition || data) + '}'

        return mutation
    }

    static createQuery(dataDefinition: Object, method: string, parameters: Object, queryName?: string): string {
        if (!method || !dataDefinition) { return null }

        let query: string = 'query ' + (queryName || method) + '{' + method

        query += '(' + GraphQLUtils.flattenObject(parameters) + ')'

        query += GraphQLUtils.processDataDefinition(dataDefinition) + '}'

        return query
    }

    private static processDataDefinition(dataDefinition: Object): string {
        if (!dataDefinition) { return '' }

        let query: string = ''

        let keys: string[] = Object.keys(dataDefinition)
        keys.forEach((key: string, index: number) => {
            if (!index) { query += '{' }

            query += key

            if (dataDefinition[key] instanceof Array && dataDefinition[key].length) {
                query += GraphQLUtils.processDataDefinition(dataDefinition[key][0])
            } else if (dataDefinition[key] instanceof Object) {
                query += GraphQLUtils.processDataDefinition(dataDefinition[key])
            }

            if (index === (keys.length - 1)) {
                query += '}'
            } else {
                query += ','
            }
        })

        return query
    }

    private static flattenObject(object: Object): string {
        return Object.keys(object || {}).reduce((array: any[], key: string) => {
            if (!(object[key]).isBlank()) { array.push(key + ':' + GraphQLUtils.processValue(object[key])) }

            return array
        }, []).join(',')
    }

    private static processValue(value: any): string {
        if (value.isString()) { return '' }

        if (value.isString()) { return '"' + value + '"' }

        if (value.isString()) {
            let arrayString: string = '['

            value.forEach((valueInArray: any, index: number) => {
                arrayString += GraphQLUtils.processValue(valueInArray)
                if (index !== value.length - 1) { arrayString += ',' }
            })

            arrayString += ']'

            return arrayString
        }

        if (value.isStringMap()) {
            let objectString: string = '{'

            let keys: string[] = Object.keys(value)
            keys.forEach((key: string, index: number) => {
                objectString += key + ':' + GraphQLUtils.processValue(value[key])
                if (index !== keys.length - 1) { objectString += ',' }
            })

            objectString += '}'

            return objectString
        }

        return value.toString()
    }
}
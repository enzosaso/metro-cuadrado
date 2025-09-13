'use server'

import Papa from 'papaparse'

/**
 * Represents a single row in the CSV data as key-value pairs
 * where keys are column headers and values are string cell values
 */
export interface CsvRow {
  [columnName: string]: string
}

/**
 * Fetches and parses a CSV file from the given URL into an array of objects
 * @param csvUrl - The URL of the CSV file to fetch
 * @returns A promise that resolves to an array of objects representing the CSV data
 */
export async function fetchCsv<RowType = CsvRow>(csvUrl: string): Promise<RowType[]> {
  const response = await fetch(csvUrl, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch the CSV file from Google Sheets')
  }

  const csvText = await response.text()

  const parsed = Papa.parse<RowType>(csvText, {
    header: true,
    skipEmptyLines: true
  })

  if (parsed.errors.length > 0) {
    console.error('CSV parse errors:', parsed.errors)
    throw new Error('Error parsing CSV data')
  }

  return parsed.data
}

const NUMBER_FORMAT = new Intl.NumberFormat('en', {notation: 'compact'})
export function numberFormat(number: number) {
    return NUMBER_FORMAT.format(number)
}
import numeral from 'numeral';

export default function toRwf(value: number) {
  const number = Number(value.toFixed(2));
  if (isNaN(number)) {
    return 'Invalid input';
  }
  const formatter = new Intl.NumberFormat('fr-RW', {
    // style: 'currency',
    // currency: 'RWF',
    // currencyDisplay: 'code',
    // useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    // minimumSignificantDigits: 1,
  });

  return numeral(Number(value)).format('$0,0.00').replace('$', '');

  // return formatter.format(number).replace(',', '.').replace(' ', ',');
}

export function formatCurrency(amount, currency) {
  const code = currency?.code ?? 'ARS';

  switch (code) {
    case 'USD':
      return `US$ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR':
      return `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    case 'GBP':
      return `£ ${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'ARS':
    default:
      return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}

async function openReadingReceipt(page) {
  const pouch = page.getByTestId('reveal-overlay');
  await pouch.getByRole('button', { name: 'Ir ao resumo' }).click();
  await pouch.getByTestId('reward-receipt').waitFor();
  return pouch;
}

async function dismissReadingRewards(page) {
  const pouch = await openReadingReceipt(page);
  await pouch.getByRole('button', { name: 'Continuar', exact: true }).click();
  await pouch.waitFor({ state: 'hidden' });
}

module.exports = { openReadingReceipt, dismissReadingRewards };

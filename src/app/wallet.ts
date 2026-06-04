export const updateStoredWalletBalance = (walletBalance: number | string | undefined) => {
  if (walletBalance === undefined || walletBalance === null) return;

  const storedUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  if (!storedUser) return;

  localStorage.setItem(
    "quicksplitUser",
    JSON.stringify({
      ...storedUser,
      wallet_balance: Number(walletBalance),
    })
  );
};

"use client";
// Delete-account button. Must be a Client Component: the confirm() dialog needs
// an onClick handler, which Server Components can't attach (that crashed /account).

export default function DeleteAccountButton() {
  return (
    <form action="/api/account/delete" method="POST">
      <button
        type="submit"
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={(e) => {
          // Destructive action: require explicit confirmation
          if (!confirm("Delete your account and all data? This cannot be undone.")) {
            e.preventDefault();
          }
        }}
      >
        Delete account
      </button>
    </form>
  );
}

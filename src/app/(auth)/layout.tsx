export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      {children}
    </div>
  );
}

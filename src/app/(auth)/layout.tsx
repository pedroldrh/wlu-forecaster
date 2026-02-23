export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mt-6 -mb-20 md:-mb-6 w-screen relative left-1/2 -translate-x-1/2">
      {children}
    </div>
  );
}

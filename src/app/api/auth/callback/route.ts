import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RANDOM_NAMES } from "@/lib/random-names";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const isWlu = user.email.endsWith("@mail.wlu.edu");
        const meta = user.user_metadata;
        const name = meta?.full_name || meta?.name || null;

        // Use service role client to update profile
        const admin = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              },
            },
          }
        );

        // Set is_wlu_verified, and fill in name if not already set
        const updates: Record<string, unknown> = { is_wlu_verified: isWlu };

        const { data: profile } = await admin
          .from("profiles")
          .select("name, display_name, referred_by")
          .eq("id", user.id)
          .single();

        if (profile && !profile.name && name) {
          updates.name = name;
        }

        // Record referral if cookie present and not yet referred
        const referralCode = cookieStore.get("referral_code")?.value;
        if (referralCode && profile && !profile.referred_by && referralCode !== user.id) {
          // Verify the referrer exists
          const { data: referrer } = await admin
            .from("profiles")
            .select("id")
            .eq("id", referralCode)
            .single();

          if (referrer) {
            updates.referred_by = referralCode;
          }
        }

        // Assign a random unhinged display name if they don't have one
        if (profile && !profile.display_name) {
          const { data: allProfiles } = await admin
            .from("profiles")
            .select("display_name");

          const takenNames = new Set(
            (allProfiles ?? [])
              .map((p: { display_name: string | null }) => p.display_name)
              .filter(Boolean)
          );

          const available = RANDOM_NAMES.filter((n) => !takenNames.has(n));

          if (available.length > 0) {
            updates.display_name =
              available[Math.floor(Math.random() * available.length)];
          } else {
            // All names taken — append a random number
            const base =
              RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
            updates.display_name = `${base} #${Math.floor(Math.random() * 1000)}`;
          }
        }

        await admin
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        // Clear referral cookie if it was used
        if (referralCode) {
          cookieStore.delete("referral_code");
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/signin`);
}
